import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { prisma } from "../../config/prisma";


export const textSplitting = async (text: string, documentId: string) => {
  try {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.splitText(text);

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
    console.log("Chunking error", error);
    return [];
  }
};
