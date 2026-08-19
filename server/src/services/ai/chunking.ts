import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "../../config/prisma";


export const textSplitting = async (text: string, documentId: string) => {
  try {
    if (!text || !text.trim()) {
      console.warn(`[Chunking] Empty or whitespace text provided for document ${documentId}`);
      return [];
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(text);

    if (!chunks || chunks.length === 0) {
      console.warn(`[Chunking] Splitter returned 0 chunks for document ${documentId}`);
      return [];
    }

    const chunkData = chunks.map((chunk, index) => ({
      content: chunk,
      chunkIndex: index,
      page: null,
      documentId: documentId,
    }));

    await prisma.chunk.createMany({
      data: chunkData,
    });

    return chunks;
  } catch (error) {
    console.error(`[Chunking Error] Failed for document ${documentId}:`, error);
    return [];
  }
};
