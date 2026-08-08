import type { Request, Response } from "express";
import { indexQuery } from "../lib/search-vectors";
import { createEmbeddings } from "../services/ai/embeddings";
import { gemini } from "../services/ai/gemini";

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(401).json({
        message: "Cant send an empty message",
      });
    }

    const embedding = await createEmbeddings(message);

    const reply = await indexQuery(embedding);

    const context = reply.matches
      .map((match) => match.metadata?.text)
      .filter(Boolean)
      .join("\n\n");

    const answer = await gemini(context, message);

    console.log("context: ------------> ", context);

    res.status(201).json({
      answer,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while uploading the file",
    });
  }
};
