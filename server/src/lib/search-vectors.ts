import { pc } from "./pinecone";

const index = pc.index(process.env.PINECONE_INDEX_NAME || "rag-app");

export const indexQuery = async (
  vectors: number[],
  documentIds?: string[],
) => {
  if (documentIds !== undefined && documentIds.length === 0) {
    return { matches: [] };
  }

  let filter: Record<string, any> | undefined = undefined;

  if (documentIds && documentIds.length > 0) {
    if (documentIds.length === 1) {
      filter = { documentId: documentIds[0] };
    } else {
      filter = { documentId: { $in: documentIds } };
    }
  }

  const queryResponse = await index.query({
    vector: vectors,
    topK: 5,
    includeValues: false,
    includeMetadata: true,
    filter,
  });

  return queryResponse;
};
