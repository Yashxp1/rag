import { ApiRouteInfo } from "./types";

export const AVAILABLE_API_ROUTES: ApiRouteInfo[] = [
  {
    method: "GET",
    path: "/api/health",
    category: "System",
    description: "Check server status, process uptime, and connectivity.",
    responseSample: JSON.stringify(
      {
        success: true,
        status: "online",
        uptime: 142,
        timestamp: "2026-09-27T17:50:00.000Z",
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/upload",
    category: "Documents & Storage",
    contentType: "multipart/form-data",
    requestBody: "FormData: { document: File (pdf, docx, pptx, xlsx, txt, md, wav, mp4, etc.), chatId?: string }",
    description:
      "Upload a document, audio, or video file to Supabase storage, record in database with QUEUED status, and enqueue to BullMQ for asynchronous chunking/embedding or video frame analysis.",
    responseSample: JSON.stringify(
      {
        success: true,
        message: "File uploaded. Processing started.",
        documentId: "cm1234567890abcdef",
        chatId: "cm0987654321fedcba",
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/upload/chat/:chatId",
    category: "Documents & Storage",
    urlParams: ":chatId - The unique CUID of the target chat session",
    contentType: "multipart/form-data",
    requestBody: "FormData: { document: File (pdf, docx, pptx, xlsx, txt, md, wav, mp4, etc.) }",
    description:
      "Upload a document or media file directly to a specific existing chat session, link it in chatDocument, and enqueue to BullMQ for asynchronous chunking/embedding.",
    responseSample: JSON.stringify(
      {
        success: true,
        message: "File uploaded. Processing started.",
        documentId: "cm1234567890abcdef",
        chatId: "cm0987654321fedcba",
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/documents",
    category: "Documents & Storage",
    description: "Retrieve all uploaded documents with their current processing status (QUEUED, PROCESSING, DONE, FAILED) and chunk count.",
    responseSample: JSON.stringify(
      {
        success: true,
        documents: [
          {
            id: "cm1234567890abcdef",
            name: "1727460000000-sample-doc.pdf",
            filetype: "application/pdf",
            storagePath: "1727460000000-sample-doc.pdf",
            status: "DONE",
            createdAt: "2026-09-27T17:40:00.000Z",
            updatedAt: "2026-09-27T17:40:15.000Z",
            _count: { chunks: 14, chatDocuments: 1 },
          },
        ],
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/documents/:documentId",
    category: "Documents & Storage",
    urlParams: ":documentId - The unique CUID of the document",
    description: "Retrieve details of a specific document including chunk indices and page metadata.",
    responseSample: JSON.stringify(
      {
        success: true,
        document: {
          id: "cm1234567890abcdef",
          name: "sample-doc.pdf",
          filetype: "application/pdf",
          storagePath: "...",
          status: "DONE",
          chunks: [
            { id: "chunk_1", chunkIndex: 0, page: 1, createdAt: "2026-09-27T17:40:05.000Z" },
            { id: "chunk_2", chunkIndex: 1, page: 1, createdAt: "2026-09-27T17:40:06.000Z" },
          ],
          chatDocuments: [],
        },
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/chats",
    category: "Chat & Inference",
    description: "Fetch all conversational chat sessions ordered by newest first.",
    responseSample: JSON.stringify(
      {
        success: true,
        chats: [
          {
            id: "cm0987654321fedcba",
            title: "Analysis of Q3 financial report",
            createdAt: "2026-09-27T17:30:00.000Z",
            updatedAt: "2026-09-27T17:35:00.000Z",
          },
        ],
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/chats",
    category: "Chat & Inference",
    contentType: "application/json",
    requestBody: JSON.stringify({ title: "Custom Session Title" }, null, 2),
    description: "Create a new conversation session without sending an initial message.",
    responseSample: JSON.stringify(
      {
        success: true,
        chat: {
          id: "cm0987654321fedcba",
          title: "Custom Session Title",
          createdAt: "2026-09-27T17:30:00.000Z",
          updatedAt: "2026-09-27T17:30:00.000Z",
        },
      },
      null,
      2
    ),
  },
  {
    method: "GET",
    path: "/api/chats/:chatId",
    category: "Chat & Inference",
    urlParams: ":chatId - The unique CUID of the chat session",
    description: "Retrieve a chat session with its full message history in chronological order.",
    responseSample: JSON.stringify(
      {
        success: true,
        chat: {
          id: "cm0987654321fedcba",
          title: "Analysis of Q3 financial report",
          createdAt: "2026-09-27T17:30:00.000Z",
          updatedAt: "2026-09-27T17:35:00.000Z",
          messages: [
            {
              id: "msg_1",
              role: "USER",
              content: "What were the key revenue figures?",
              chatId: "cm0987654321fedcba",
              createdAt: "2026-09-27T17:31:00.000Z",
            },
            {
              id: "msg_2",
              role: "ASSISTANT",
              content: "Based on the uploaded document, total revenue reached $4.2M...",
              chatId: "cm0987654321fedcba",
              createdAt: "2026-09-27T17:31:04.000Z",
            },
          ],
        },
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/chats/:chatId/documents",
    category: "Documents & Storage",
    urlParams: ":chatId - The unique CUID of the chat session",
    contentType: "application/json",
    requestBody: JSON.stringify({ documentId: "cm1234567890abcdef" }, null, 2),
    description: "Explicitly link an existing document to a chat session so Pinecone vector queries are filtered to this document.",
    responseSample: JSON.stringify(
      {
        success: true,
        chatDocument: {
          chatId: "cm0987654321fedcba",
          documentId: "cm1234567890abcdef",
          createdAt: "2026-09-27T17:35:00.000Z",
        },
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/chat",
    category: "Chat & Inference",
    contentType: "application/json",
    requestBody: JSON.stringify(
      {
        message: "Summarize the key findings from the uploaded document",
        chatId: "optional-chat-id",
      },
      null,
      2
    ),
    description:
      "Send a query. Auto-creates a new chat session if chatId is not provided. Embeds query with Gemini embedding-2, searches Pinecone vector DB, and generates response with Ollama Gemma 3.",
    responseSample: JSON.stringify(
      {
        success: true,
        answer: "The findings highlight three key areas of growth...",
        chatId: "cm0987654321fedcba",
        newChat: {
          id: "cm0987654321fedcba",
          title: "Summarize the key find...",
        },
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/chat/:chatId",
    category: "Chat & Inference",
    urlParams: ":chatId - The unique CUID of the target chat session",
    contentType: "application/json",
    requestBody: JSON.stringify(
      {
        message: "Explain point 2 in more detail",
      },
      null,
      2
    ),
    description:
      "Send a follow-up query to an existing chat. Includes the last 10 messages as conversation history, embeds the query, searches Pinecone vector DB for linked documents, and generates response with Ollama Gemma 3.",
    responseSample: JSON.stringify(
      {
        success: true,
        answer: "Expanding on point 2, the team observed...",
        chatId: "cm0987654321fedcba",
      },
      null,
      2
    ),
  },
];
