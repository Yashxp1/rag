import type { Request, Response } from "express";
import { uploadToBucket } from "../config/supabase";
import { prisma } from "../config/prisma";
import { extractFramesQueue, uploadQueue } from "../queues/upload.queue";
import path from "node:path";
import * as fs from "node:fs/promises";
import { extractFrames } from "../lib/extractFrames";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Please provide a file to upload",
      });
    }

    const fileName = Date.now() + "-" + file.originalname;

    const tempDir = path.join(__dirname, "../..", "temp/frames");
    await fs.mkdir(tempDir, { recursive: true });
    const tempFilePath = path.join(tempDir, fileName);
    await fs.writeFile(tempFilePath, Buffer.from(file.buffer));

    console.log("Temp file created:", tempFilePath);

    if (file.mimetype.startsWith("video/")) {
      await extractFrames(
        tempFilePath,
        path.join(tempDir, "frame_%04d.jpg"),
      );
    }

    const bucket = await uploadToBucket(file.buffer, fileName, file.mimetype);

    if (!bucket?.path) {
      return res.status(401).json({
        success: false,
        message: "Storage path not found!",
      });
    }

    const document = await prisma.document.create({
      data: {
        filetype: file.mimetype,
        name: fileName,
        storagePath: bucket.path,
        status: "QUEUED",
      },
    });

    if (file.mimetype.startsWith("video/")) {
      await extractFramesQueue.add("process-document", {
        documentId: document.id,
        storagePath: document.storagePath,
        filetype: document.filetype,
        fileName: document.name,
      });
    } else {
      await uploadQueue.add("process-document", {
        documentId: document.id,
        storagePath: document.storagePath,
        filetype: document.filetype,
        fileName: document.name,
      });
    }

    return res.status(202).json({
      success: true,

      message: "File uploaded. Processing started.",

      documentId: document.id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};
