import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function gemini(context: string, question: string) {
  const prompt = `
You are a helpful assistant.

Answer ONLY using the context below.

Context:
${context}

Question:
${question}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
  });

  return response.text;
}
