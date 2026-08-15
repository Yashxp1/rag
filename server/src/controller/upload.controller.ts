import type { Request, Response } from "express";
import { uploadToBucket } from "../config/supabase";
import { prisma } from "../config/prisma";
import { extractFramesQueue, uploadQueue } from "../queues/queues";

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

    let chatId = req.body.chatId || (req.query.chatId as string);
    let chatExists = false;

    if (chatId) {
      const existingChat = await prisma.chat.findUnique({
        where: { id: chatId },
      });
      if (existingChat) {
        chatExists = true;
      }
    }

    if (!chatExists) {
      const newChat = await prisma.chat.create({
        data: {
          title: file.originalname.slice(0, 40),
        },
      });
      chatId = newChat.id;
    }

    await prisma.chatDocument.create({
      data: {
        chatId,
        documentId: document.id,
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
      chatId,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};
