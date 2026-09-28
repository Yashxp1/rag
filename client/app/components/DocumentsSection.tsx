"use client";

import React, { useState, useEffect, useCallback } from "react";
import { executeApiCall } from "../api";
import { ApiResponseViewer } from "./ApiResponseViewer";
import { DocumentItem, ChatItem, ApiCallLog } from "../types";

interface DocumentsSectionProps {
  serverUrl: string;
  onLog: (log: ApiCallLog) => void;
  onSelectChatForQuery?: (chatId: string) => void;
}

export function DocumentsSection({
  serverUrl,
  onLog,
  onSelectChatForQuery,
}: DocumentsSectionProps) {
  // Document list
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploadChatId, setUploadChatId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<unknown>(null);
  const [uploadStatus, setUploadStatus] = useState<number | undefined>(undefined);
  const [uploadDuration, setUploadDuration] = useState<number | undefined>(undefined);

  // Link document to chat state
  const [linkDocId, setLinkDocId] = useState("");
  const [linkChatId, setLinkChatId] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkResponse, setLinkResponse] = useState<unknown>(null);
  const [linkStatus, setLinkStatus] = useState<number | undefined>(undefined);

  // Document details inspection
  const [inspectDocId, setInspectDocId] = useState<string | null>(null);
  const [inspectDocData, setInspectDocData] = useState<unknown>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  // Chats list for dropdowns
  const [chats, setChats] = useState<ChatItem[]>([]);

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    const res = await executeApiCall(serverUrl, "/api/documents", { method: "GET" }, onLog);
    if (res.ok && res.data && typeof res.data === "object" && "documents" in (res.data as Record<string, unknown>)) {
      setDocuments((res.data as { documents: DocumentItem[] }).documents || []);
    }
    setLoadingDocs(false);
  }, [serverUrl, onLog]);

  const loadChats = useCallback(async () => {
    const res = await executeApiCall(serverUrl, "/api/chats", { method: "GET" }, onLog);
    if (res.ok && res.data && typeof res.data === "object" && "chats" in (res.data as Record<string, unknown>)) {
      setChats((res.data as { chats: ChatItem[] }).chats || []);
    }
  }, [serverUrl, onLog]);

  useEffect(() => {
    loadDocuments();
    loadChats();
  }, [loadDocuments, loadChats]);

  // Inspect specific document details
  const handleInspectDocument = async (id: string) => {
    if (inspectDocId === id) {
      setInspectDocId(null);
      setInspectDocData(null);
      return;
    }
    setInspectDocId(id);
    setLoadingInspect(true);
    const res = await executeApiCall(serverUrl, `/api/documents/${id}`, { method: "GET" }, onLog);
    setInspectDocData(res.data);
    setLoadingInspect(false);
  };

  // Handle file upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    setUploadResponse(null);

    const formData = new FormData();
    formData.append("document", file);

    const hasChatId = Boolean(uploadChatId.trim());
    const endpoint = hasChatId
      ? `/api/upload/chat/${encodeURIComponent(uploadChatId.trim())}`
      : "/api/upload";

    const res = await executeApiCall(
      serverUrl,
      endpoint,
      {
        method: "POST",
        body: formData,
        isFormData: true,
      },
      onLog
    );

    setUploadStatus(res.status);
    setUploadDuration(res.durationMs);
    setUploadResponse(res.data);
    setUploading(false);

    // Refresh document list and chats
    await loadDocuments();
    await loadChats();
  };

  // Handle document linking
  const handleLinkDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkDocId || !linkChatId || linking) return;

    setLinking(true);
    setLinkResponse(null);

    const res = await executeApiCall(
      serverUrl,
      `/api/chats/${linkChatId}/documents`,
      {
        method: "POST",
        body: { documentId: linkDocId },
      },
      onLog
    );

    setLinkStatus(res.status);
    setLinkResponse(res.data);
    setLinking(false);

    await loadDocuments();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      case "PROCESSING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse";
      case "QUEUED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800";
      case "FAILED":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Document Ingestion &amp; Storage</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              POST /api/upload | GET /api/documents
            </span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Upload files (PDF, DOCX, TXT, WAV audio, MP4 video) to trigger background chunking &amp; Pinecone vector indexing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadDocuments();
            loadChats();
          }}
          disabled={loadingDocs}
          className="text-xs px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono cursor-pointer self-start sm:self-auto"
        >
          {loadingDocs ? "Refreshing..." : "↻ Refresh Documents"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload Form */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3.5 bg-white dark:bg-zinc-950 space-y-3">
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
            <span>Upload Document or Media</span>
            <span className="font-mono text-[10px] text-zinc-500">
              {uploadChatId.trim()
                ? `POST /api/upload/chat/${uploadChatId.trim().slice(0, 8)}...`
                : "POST /api/upload"}
            </span>
          </div>

          <form onSubmit={handleUpload} className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 mb-1">
                Select File to Ingest:
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs p-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-800 dark:file:text-zinc-200 file:cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Supported: PDF, DOCX, PPTX, XLSX, TXT, MD, WAV (audio whisper), MP4/AVI (video frames + audio)
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-zinc-700 dark:text-zinc-300">
                  Target Chat Session:
                </label>
                <span className="font-mono text-[10px] text-zinc-400">
                  {uploadChatId.trim() ? "Uses /api/upload/chat/:chatId" : "Uses /api/upload (Auto-create)"}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Chat ID (leave blank to auto-create chat)..."
                  value={uploadChatId}
                  onChange={(e) => setUploadChatId(e.target.value)}
                  className="flex-1 font-mono text-xs p-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
                {chats.length > 0 && (
                  <select
                    value={uploadChatId}
                    onChange={(e) => setUploadChatId(e.target.value)}
                    className="text-xs p-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 max-w-[140px]"
                  >
                    <option value="">New / Auto...</option>
                    {chats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title.slice(0, 18)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {uploading ? (
                <>
                  <span className="inline-block animate-spin font-mono">◓</span>
                  <span>Uploading &amp; Queuing Job...</span>
                </>
              ) : (
                <span>Upload &amp; Start Ingestion →</span>
              )}
            </button>
          </form>

          {/* Upload Server Response (Displays ALL response content) */}
          {uploadResponse !== null && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <ApiResponseViewer
                data={uploadResponse}
                status={uploadStatus}
                durationMs={uploadDuration}
                title="Upload API Response"
                defaultExpanded={true}
              />
            </div>
          )}
        </div>

        {/* Link Document to Chat Form */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3.5 bg-white dark:bg-zinc-950 space-y-3">
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
            <span>Link Document to Chat Session</span>
            <span className="font-mono text-[10px] text-zinc-500">POST /api/chats/:chatId/documents</span>
          </div>

          <form onSubmit={handleLinkDocument} className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 mb-1">
                Target Chat ID:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Chat ID"
                  value={linkChatId}
                  onChange={(e) => setLinkChatId(e.target.value)}
                  className="flex-1 font-mono text-xs p-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
                {chats.length > 0 && (
                  <select
                    value={linkChatId}
                    onChange={(e) => setLinkChatId(e.target.value)}
                    className="text-xs p-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 max-w-[140px]"
                  >
                    <option value="">Select Chat...</option>
                    {chats.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title.slice(0, 18)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 mb-1">
                Document ID to Link:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Document ID (e.g. cm123...)"
                  value={linkDocId}
                  onChange={(e) => setLinkDocId(e.target.value)}
                  className="flex-1 font-mono text-xs p-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
                {documents.length > 0 && (
                  <select
                    value={linkDocId}
                    onChange={(e) => setLinkDocId(e.target.value)}
                    className="text-xs p-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 max-w-[140px]"
                  >
                    <option value="">Select Doc...</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name.slice(0, 18)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Links document so RAG vector search specifically targets this content.
              </p>
            </div>

            <button
              type="submit"
              disabled={linking || !linkDocId || !linkChatId}
              className="w-full py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {linking ? "Linking..." : "Link Document to Chat →"}
            </button>
          </form>

          {linkResponse !== null && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <ApiResponseViewer
                data={linkResponse}
                status={linkStatus}
                title="Link Document API Response"
                defaultExpanded={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Document List Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Uploaded Documents &amp; Ingestion Status</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {documents.length} recorded
            </span>
          </div>
          <span className="font-mono text-[10px] text-zinc-500">GET /api/documents</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 font-mono text-[11px]">
                <th className="p-2.5 font-medium">Document ID</th>
                <th className="p-2.5 font-medium">Name</th>
                <th className="p-2.5 font-medium">Type</th>
                <th className="p-2.5 font-medium">Status</th>
                <th className="p-2.5 font-medium">Chunks</th>
                <th className="p-2.5 font-medium">Linked Chats</th>
                <th className="p-2.5 font-medium">Uploaded At</th>
                <th className="p-2.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <td className="p-2.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 select-all">
                    {doc.id}
                  </td>
                  <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate" title={doc.name}>
                    {doc.name}
                  </td>
                  <td className="p-2.5 font-mono text-[11px] text-zinc-500">
                    {doc.filetype}
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${getStatusBadge(
                        doc.status
                      )}`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-zinc-700 dark:text-zinc-300">
                    {doc._count?.chunks ?? 0}
                  </td>
                  <td className="p-2.5 font-mono text-zinc-700 dark:text-zinc-300">
                    {doc._count?.chatDocuments ?? 0}
                  </td>
                  <td className="p-2.5 text-zinc-500 text-[11px]">
                    {new Date(doc.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => handleInspectDocument(doc.id)}
                      className="px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      {inspectDocId === doc.id ? "Close ▲" : "Inspect ▼"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkDocId(doc.id);
                      }}
                      title="Pre-fill Link Document form with this ID"
                      className="px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      Link
                    </button>
                  </td>
                </tr>
              ))}

              {documents.length === 0 && !loadingDocs && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs text-zinc-500">
                    No documents uploaded yet. Upload a document or media file above to test the ingestion pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detailed Inspection Drawer for Document */}
        {inspectDocId && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                Document Details (GET /api/documents/{inspectDocId}):
              </span>
              <button
                type="button"
                onClick={() => setInspectDocId(null)}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-mono"
              >
                ✕ Close
              </button>
            </div>

            {loadingInspect ? (
              <div className="text-xs text-zinc-500 py-3 font-mono">Loading details...</div>
            ) : (
              <ApiResponseViewer
                data={inspectDocData}
                title={`GET /api/documents/${inspectDocId}`}
                defaultExpanded={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
