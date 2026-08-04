import { Pinecone } from "@pinecone-database/pinecone";

export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
});
const index = pc.index(process.env.PINECONE_INDEX_NAME || "rag-app");
export interface IEmbedding {
  id: string;
  values: number[];
  metadata?: {
    text?: string;
    pageNo?: number;
    source?: string;
  };
}

export const storeEmbeddings = async (
  embeddings: IEmbedding[],
): Promise<void> => {
  try {
    if (!embeddings.length) {
      console.log("No embeddings to store.");
      return;
    }

    const records = embeddings.map((embedding) => ({
      id: embedding.id,
      values: embedding.values,
      metadata: embedding.metadata ?? {},
    }));

    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      await index.upsert({
        records: batch,
      });

      console.log(
        `Uploaded batch ${i / BATCH_SIZE + 1} (${batch.length} records)`,
      );
    }

    console.log("All embeddings stored successfully.");
  } catch (err) {
    console.error("Failed to store embeddings:", err);
    throw err;
  }
};
