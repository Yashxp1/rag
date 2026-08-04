import { pc } from "./pinecone";

const index = pc.index(process.env.PINECONE_INDEX_NAME || "rag-app");

export const indexQuery = async (vectors: number[]) => {
  const queryResponse = await index.query({
    vector: vectors,
    topK: 5,
    includeValues: false,
    includeMetadata: true,
  });

  return queryResponse;
};
