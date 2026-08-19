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
    const { documentId, storagePath, filetype, fileName } = job.data;
    const baseTempDir = path.join(__dirname, "../..", `temp/${documentId}`);
    const tempFilePath = path.join(baseTempDir, fileName);

    try {
      await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          status: "PROCESSING",
        },
      });

      const documentBuffer = await downloadFromBucket(storagePath);

      if (!documentBuffer) {
        throw new Error("File not found in bucket");
      }

      let data: string | undefined;

      const isAudio =
        filetype?.includes("wav") ||
        fileName.toLowerCase().endsWith(".wav") ||
        filetype?.startsWith("audio/");

      if (isAudio) {
        await fs.mkdir(baseTempDir, { recursive: true });
        await fs.writeFile(tempFilePath, Buffer.from(documentBuffer));

        data = (await transcribe(tempFilePath)) as string;
      } else {
        data = (await parseDocument(
          Buffer.from(documentBuffer),
          filetype,
        )) as string;
      }

      if (!data || !data.trim()) {
        throw new Error("No text content found inside document");
      }

      const chunks = await textSplitting(data, documentId);

      if (!chunks || chunks.length === 0) {
        throw new Error("No text chunks could be generated from document");
      }

      const embeddings: IEmbedding[] = [];
      const BATCH_SIZE = 5;

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.all(
          batch.map(async (chunk, idx) => ({
            id: `${documentId}_${i + idx}`,
            values: await createEmbeddings(chunk),
            metadata: { text: chunk, source: fileName, documentId },
          })),
        );
        embeddings.push(...batchResults);
      }
      // const embeddings: IEmbedding[] = await Promise.all(
      //   chunks.map(async (chunk, index) => {
      //     const values = await createEmbeddings(chunk);
      //     return {
      //       id: `${documentId}_${index}`,
      //       values,
      //       metadata: {
      //         text: chunk,
      //         source: fileName,
      //         documentId: documentId,
      //       },
      //     };
      //   }),
      // );

      if (!embeddings || embeddings.length === 0) {
        await prisma.document.update({
          where: { id: documentId },
          data: { status: "FAILED" },
        });
        throw new Error("No embeddings generated");
      }

      await storeEmbeddings(embeddings);

      if (isAudio) {
        await fs.rm(baseTempDir, { recursive: true, force: true });
      }

      await prisma.document.update({
        where: { id: documentId },
        data: { status: "DONE" },
      });
    } catch (error) {
      await fs
        .rm(baseTempDir, { recursive: true, force: true })
        .catch(() => {});

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
