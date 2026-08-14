import type { Request, Response } from "express";
import { indexQuery } from "../lib/search-vectors";
import { createEmbeddings } from "../services/ai/embeddings";
import { prisma } from "../config/prisma";
import { ollamaModel } from "../services/ai/ollama";

export const createChat = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;

    const chat = await prisma.chat.create({
      data: {
        title: title || "New Chat",
      },
    });

    return res.status(201).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating chat",
    });
  }
};

export const getChats = async (req: Request, res: Response) => {
  try {
    const chats = await prisma.chat.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, chats });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching chats" });
  }
};

export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const chatId = Array.isArray(req.params.chatId)
      ? req.params.chatId[0]
      : req.params.chatId;
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    return res.status(200).json({ success: true, chat });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Error fetching chat messages" });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message, chatId } = req.body;

    if (!message) {
      return res.status(400).json({
        message: "Cant send an empty message",
      });
    }

    const embedding = await createEmbeddings(message);

    const reply = await indexQuery(embedding, chatId);

    const context = reply.matches
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join("\n\n");
    const answer = await ollamaModel(message, [], context);

    let activeChatId = chatId;
    let newChat = null;

    if (activeChatId) {
      const existingChat = await prisma.chat.findUnique({
        where: { id: activeChatId },
      });

      if (!existingChat) {
        return res.status(404).json({
          success: false,
          message: "Chat ID not found",
        });
      }

      await prisma.message.createMany({
        data: [
          {
            chatId: activeChatId,
            role: "USER",
            content: message,
          },
          {
            chatId: activeChatId,
            role: "ASSISTANT",
            content: answer ?? "",
          },
        ],
      });
    } else {
      newChat = await prisma.chat.create({
        data: {
          title: message.slice(0, 30),
          messages: {
            create: [
              {
                role: "USER",
                content: message,
              },
              {
                role: "ASSISTANT",
                content: answer ?? "",
              },
            ],
          },
        },
      });
      activeChatId = newChat.id;
    }

    return res.status(201).json({
      success: true,
      answer: answer,
      chatId: activeChatId,
      newChat,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending message",
    });
  }
};

export const sendMessageById = async (req: Request, res: Response) => {
  try {
    const chatId = Array.isArray(req.params.chatId)
      ? req.params.chatId[0]
      : req.params.chatId;
    const { message } = req.body;

    if (!chatId) {
      return res.status(400).json({
        message: "ChatId not foud!",
      });
    }

    if (!message) {
      return res.status(400).json({
        message: "Cant send an empty message",
      });
    }

    const embedding = await createEmbeddings(message);

    const reply = await indexQuery(embedding, chatId);

    const context = reply.matches
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join("\n\n");

    const answer = await ollamaModel(message, [], context);

    const newChat = await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        title: message.slice(0, 30),
        messages: {
          create: [
            {
              role: "USER",
              content: message,
            },
            {
              role: "ASSISTANT",
              content: answer ?? "",
            },
          ],
        },
      },
    });

    return res.status(201).json({
      success: true,
      answer: answer,
      chatId,
      newChat,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the chatId",
    });
  }
};
