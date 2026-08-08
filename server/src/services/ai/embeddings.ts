import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const createEmbeddings = async (text: string) => {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: { role: "user", parts: [{ text }] },
    // title,
    config: {
      outputDimensionality: 1024,
    },
  });

  const values = result.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Embedding generation returned no values");
  }

  return values;
};
