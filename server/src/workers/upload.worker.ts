import { Job, Worker } from "bullmq";
import { prisma } from "../config/prisma";
import { textSplitting } from "../services/ai/chunking";
import { downloadFromBucket } from "../config/supabase";
import { redis } from "../config/redis";
import { parse } from "../services/parsers/pdf.parser";

new Worker(
  "uploads",
  async (job: Job) => {
    try {
      const { documentId, storagePath } = job.data;
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

      const parsedDoc = await parse(Buffer.from(fileBuffer));

      if (!parsedDoc?.text) {
        throw new Error("No text found inside PDF");
      }
      await textSplitting(parsedDoc.text, documentId);
    } catch (error) {
      console.error(error);
    }
  },
  { connection: redis },
);
