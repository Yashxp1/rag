import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function createGithubMcpClient(): Promise<Client> {
  const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  if (!token) {
    throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN is not defined");
  }

  const isWindows = process.platform === "win32";
  const command = isWindows ? "cmd.exe" : "npx";

  const args = isWindows
    ? ["/c", "npx", "-y", "@modelcontextprotocol/server-github"]
    : ["-y", "@modelcontextprotocol/server-github"];

  const transport = new StdioClientTransport({
    command,
    args,
    env: {
      ...process.env,
      GITHUB_PERSONAL_ACCESS_TOKEN: token,
    },
  });

  const client = new Client(
    {
      name: "rag-github-client",
      version: "1.0.0",
    },
    { capabilities: {} },
  );

  await client.connect(transport);
  console.log(" Connected to GitHub MCP Server");

  return client;
}
