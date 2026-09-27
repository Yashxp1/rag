export interface ServerHealth {
  success: boolean;
  status: string;
  uptime: number;
  timestamp: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  filetype: string;
  storagePath: string;
  status: "QUEUED" | "PROCESSING" | "DONE" | "FAILED";
  createdAt: string;
  updatedAt: string;
  _count?: {
    chunks: number;
    chatDocuments: number;
  };
  chunks?: Array<{
    id: string;
    chunkIndex: number;
    page: number | null;
    createdAt: string;
  }>;
}

export interface MessageItem {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  chatId: string;
  createdAt: string;
}

export interface ChatItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: MessageItem[];
  chatDocuments?: Array<{
    chatId: string;
    documentId: string;
    createdAt: string;
  }>;
}

export interface ApiRouteInfo {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  contentType?: string;
  requestBody?: string;
  urlParams?: string;
  queryParams?: string;
  responseSample: string;
  category: "Chat & Inference" | "Documents & Storage" | "System";
}

export interface ApiCallLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  durationMs: number;
  requestPayload?: unknown;
  responseData: unknown;
  isError: boolean;
}
