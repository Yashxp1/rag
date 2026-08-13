import { Job, Worker } from "bullmq";
import { prisma } from "../config/prisma";
import { textSplitting } from "../services/ai/chunking";
import { downloadFromBucket } from "../config/supabase";
import { redis } from "../config/redis";
import { parseDocument } from "../services/parsers/parseDocument";
import { createEmbeddings } from "../services/ai/embeddings";
import { storeEmbeddings, type IEmbedding } from "../lib/pinecone";
import path from "node:path";
import * as fs from "node:fs/promises";
import { transcribe } from "../lib/transcribe";

new Worker(
  "uploads",
  async (job: Job) => {
    try {
      const { documentId, storagePath, filetype, fileName } = job.data;
      await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          status: "PROCESSING",
        },
      });

      const fileBuffer = await downloadFromBucket(storagePath);

      if (!fileBuffer) {
        throw new Error("File not found in bucket");
      }

      const tempDir = path.join(__dirname, "../..", "temp/audio");

      await fs.mkdir(tempDir, { recursive: true });

      const tempFilePath = path.join(tempDir, fileName);

      await fs.writeFile(tempFilePath, Buffer.from(fileBuffer));

      console.log("Temp file created:", tempFilePath);

      let data: string | undefined;

      const isWav =
        filetype?.includes("wav") ||
        fileName.toLowerCase().endsWith(".wav") ||
        filetype?.startsWith("audio/");

      if (isWav) {
        data = (await transcribe(tempFilePath)) as string;
      }

      if (
        filetype?.includes("docx") ||
        filetype?.includes("pdf") ||
        filetype?.includes("pptx") ||
        filetype?.includes("xlsx") ||
        filetype?.includes("txt")
      ) {
        data = (await parseDocument(
          Buffer.from(fileBuffer),
          filetype,
        )) as string;
      }

      if (!data) {
        throw new Error("No text found inside document");
      }

      const chunks = await textSplitting(data, documentId);

      const embeddings: IEmbedding[] = await Promise.all(
        chunks.map(async (chunk, index) => {
          const values = await createEmbeddings(chunk);
          return {
            id: `${documentId}_${index}`,
            values,
            metadata: {
              text: chunk,
              source: fileName,
            },
          };
        }),
      );

      await storeEmbeddings(embeddings);

      await fs.unlink(tempFilePath);

      await prisma.document.update({
        where: { id: documentId },
        data: { status: "DONE" },
      });
    } catch (error) {
      console.error("Worker error:", error);
    }
  },
  { connection: redis },
);
