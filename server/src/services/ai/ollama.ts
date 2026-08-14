import ollama from "ollama";
import * as fs from "node:fs/promises";

export const ollamaModel = async (
  question: string,
  framePaths: string[] = [],
  context?: string,
) => {
  const images =
    Array.isArray(framePaths) && framePaths.length > 0
      ? await Promise.all(framePaths.map((path) => fs.readFile(path)))
      : [];

  const response = await ollama.chat({
    model: "gemma3:4b",
    options: {
      num_ctx: 16384,
    },
    messages: [
      {
        role: "system",
        content: `
        You are a helpful assistant.

        Answer ONLY using the context below.

        Context:${context || ""}
        `,
      },
      { role: "user", content: question, images },
    ],
  });
  return response.message.content;
};
