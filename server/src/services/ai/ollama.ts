import ollama from "ollama";

export const ollamaModel = async (context: string, question: string) => {
  const response = await ollama.chat({
    model: "gemma3:4b",
    messages: [
      {
        role: "system",
        content: `
        You are a helpful assistant.

        Answer ONLY using the context below.

        Context:${context}
        `,
      },
      { role: "ASSISTANT", content: question },
    ],
  });
  return response.message.content;
};
