import { Job, Worker } from "bullmq";
import path from "node:path";
import { ollamaModel } from "../services/ai/ollama";
import { redis } from "../config/redis";
import { prisma } from "../config/prisma";
import { downloadFromBucket } from "../config/supabase";
import * as fs from "node:fs/promises";
import { extractAudio } from "../lib/extractAudio";
import { extractFrames } from "../lib/extractFrames";
import { transcribe } from "../lib/transcribe";
import { textSplitting } from "../services/ai/chunking";
import { storeEmbeddings, type IEmbedding } from "../lib/pinecone";
import { createEmbeddings } from "../services/ai/embeddings";
import { readdir, rm } from "node:fs/promises";

new Worker(
  "extract-frames",
  async (job: Job) => {
    const { documentId, storagePath, filetype, fileName } = job.data;
    const baseTempDir = path.join(__dirname, "../..", `temp/${documentId}`);
    const framesDir = path.join(baseTempDir, "frames");
    const audioPath = path.join(baseTempDir, "audio.wav");
    const videoPath = path.join(baseTempDir, fileName);

    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "PROCESSING" },
      });

      const videoBuffer = await downloadFromBucket(storagePath);

      if (!videoBuffer) {
        throw new Error("File not found");
      }

      await fs.mkdir(framesDir, { recursive: true });
      await fs.writeFile(videoPath, Buffer.from(videoBuffer));

      let audioTranscript: string | undefined;

      try {
        await extractAudio(videoPath, audioPath);
        audioTranscript = (await transcribe(audioPath)) as string;
      } catch (error) {
        console.log("Audio extract failed", error);
      }

      try {
        await extractFrames(videoPath, path.join(framesDir, "frame_%04d.jpg"));
      } catch (error) {
        console.log("Frame extract failed", error);
      }

      const videoFiles = await readdir(framesDir);

      const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
      const imageFiles = videoFiles
        .filter((f) => imageExtensions.has(path.extname(f).toLowerCase()))
        .sort();

      const framesPath = imageFiles.map((f) => path.join(framesDir, f));

      let visionSummary = "";
      if (framesPath.length > 0) {
        visionSummary = (await ollamaModel("", framesPath, "")) as string;
      }

      const combinedText = `

        VIDEO AUDIO TRANSCRIPT:

        ${audioTranscript || "No spoken audio found."}

        VIDEO VISUAL DESCRIPTION:

        ${visionSummary || "No visual descriptions available."}

      `.trim();

      const chunks = await textSplitting(combinedText, documentId);

      const embeddings: IEmbedding[] = await Promise.all(
        chunks.map(async (chunk, index) => {
          const values = await createEmbeddings(chunk);
          return {
            id: `${documentId}_${index}`,
            values,
            metadata: {
              text: chunk,
              source: fileName,
              documentId: documentId,
            },
          };
        }),
      );
      await storeEmbeddings(embeddings);

      await rm(baseTempDir, { recursive: true, force: true });

      await prisma.document.update({
        where: { id: documentId },
        data: { status: "DONE" },
      });

      console.log(`Successfully processed video document: ${documentId}`);

      return { visionSummary };
    } catch (error) {
      await rm(baseTempDir, { recursive: true, force: true }).catch(() => {});
      console.error("Worker error:", error);
      if (job?.data?.documentId) {
        await prisma.document.update({
          where: { id: job.data.documentId },
          data: { status: "FAILED" },
        });
      }
    }
  },
  { connection: redis },
);
