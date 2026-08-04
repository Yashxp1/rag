import type { Request, Response } from "express";
import { uploadToBucket } from "../lib/supabase";
import { prisma } from "../lib/prisma";
import { parse } from "../lib/pdf-parser";
import { textSplitting } from "../ai/chunking";
import { createEmbeddings } from "../ai/embeddings";
import { storeEmbeddings } from "../lib/pinecone";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Please provide a file to upload",
      });
    }

    const parsedDoc = await parse(file.buffer);

    const fileName = Date.now() + "-" + file.originalname;

    const bucket = await uploadToBucket(file.buffer, fileName, file.mimetype);

    const data = await prisma.document.create({
      data: {
        filetype: file.mimetype,
        name: fileName,
        storagePath: bucket?.fullPath || "",
      },
    });

    let chunks: string[] = [];

    if (parsedDoc?.text) {
      chunks = await textSplitting(parsedDoc.text, data.id);
    }

    if (chunks.length) {
      const records = await Promise.all(
        chunks.map(async (chunkText, i) => {
          const values = await createEmbeddings(chunkText);
          return {
            id: `${data.id}-${i}`,
            values,
            metadata: {
              text: chunkText,
              source: data.name,
            },
          };
        }),
      );
      await storeEmbeddings(records);
    }

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data,
      embeddings: "SUCCESS",
      chunks: chunks,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while uploading the file",
    });
  }
};
