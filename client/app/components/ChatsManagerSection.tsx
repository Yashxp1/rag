"use client";

import React, { useState, useEffect, useCallback } from "react";
import { executeApiCall } from "../api";
import { ApiResponseViewer } from "./ApiResponseViewer";
import { ChatItem, ApiCallLog } from "../types";

interface ChatsManagerSectionProps {
  serverUrl: string;
  onLog: (log: ApiCallLog) => void;
  onOpenInChat: (chatId: string) => void;
}

export function ChatsManagerSection({
  serverUrl,
  onLog,
  onOpenInChat,
}: ChatsManagerSectionProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);

  // New Chat Creation
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [createResponse, setCreateResponse] = useState<unknown>(null);
  const [createStatus, setCreateStatus] = useState<number | undefined>(undefined);

  // Active Chat Inspection
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatDetail, setChatDetail] = useState<ChatItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadChats = useCallback(async () => {
    setLoading(true);
    const res = await executeApiCall(serverUrl, "/api/chats", { method: "GET" }, onLog);
    if (res.ok && res.data && typeof res.data === "object" && "chats" in (res.data as Record<string, unknown>)) {
      setChats((res.data as { chats: ChatItem[] }).chats || []);
    }
    setLoading(false);
  }, [serverUrl, onLog]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;

    setCreating(true);
    setCreateResponse(null);

    const res = await executeApiCall(
      serverUrl,
      "/api/chats",
      {
        method: "POST",
        body: newTitle.trim() ? { title: newTitle.trim() } : {},
      },
      onLog
    );

    setCreateStatus(res.status);
    setCreateResponse(res.data);
    setCreating(false);

    if (res.ok) {
      setNewTitle("");
      await loadChats();
    }
  };

  const handleSelectChat = async (chatId: string) => {
    if (selectedChatId === chatId && chatDetail) {
      return;
    }

    setSelectedChatId(chatId);
    setLoadingDetail(true);
    setChatDetail(null);

    const res = await executeApiCall(serverUrl, `/api/chats/${chatId}`, { method: "GET" }, onLog);
    if (res.ok && res.data && typeof res.data === "object" && "chat" in (res.data as Record<string, unknown>)) {
      setChatDetail((res.data as { chat: ChatItem }).chat);
    }
    setLoadingDetail(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Chat Sessions Manager</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              GET /api/chats | POST /api/chats | GET /api/chats/:chatId
            </span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage conversational threads, inspect persisted PostgreSQL messages, and verify state.
          </p>
        </div>

        <button
          type="button"
          onClick={loadChats}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono cursor-pointer self-start sm:self-auto"
        >
          {loading ? "Refreshing..." : "↻ Refresh Sessions"}
        </button>
      </div>

      {/* Create New Session Bar */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-950">
        <form onSubmit={handleCreateChat} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
          <span className="font-mono text-zinc-500 text-[11px] whitespace-nowrap">
            POST /api/chats:
          </span>
          <input
            type="text"
            placeholder="New chat title (optional, e.g. 'Project Roadmap RAG Analysis')..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 text-xs p-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={creating}
            className="px-3 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-medium cursor-pointer disabled:opacity-50"
          >
            {creating ? "Creating..." : "+ Create Chat"}
          </button>
        </form>

        {createResponse !== null && (
          <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <ApiResponseViewer
              data={createResponse}
              status={createStatus}
              title="Create Chat API Response"
              defaultExpanded={false}
            />
          </div>
        )}
      </div>

      {/* Two Column Layout: List and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chat List */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
            <span>All Sessions</span>
            <span className="font-mono text-[10px] text-zinc-500">{chats.length} total</span>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[500px] overflow-y-auto">
            {chats.map((c) => {
              const isSelected = selectedChatId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectChat(c.id)}
                  className={`p-3 text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-900 font-medium"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {c.title || "Untitled Session"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInChat(c.id);
                      }}
                      title="Open and query in chat console"
                      className="px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-[10px] font-mono text-zinc-700 dark:text-zinc-300"
                    >
                      Chat →
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                    <span className="select-all">{c.id.slice(0, 14)}...</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}

            {chats.length === 0 && !loading && (
              <div className="p-6 text-center text-xs text-zinc-500">
                No chat sessions yet. Create one above!
              </div>
            )}
          </div>
        </div>

        {/* Selected Chat Detail Viewer */}
        <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 rounded-md p-3.5 bg-white dark:bg-zinc-950 space-y-3">
          {selectedChatId ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                    Session Inspection: {chatDetail?.title || selectedChatId}
                  </h3>
                  <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
                    ID: {selectedChatId}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenInChat(selectedChatId)}
                    className="px-2.5 py-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 text-xs font-medium cursor-pointer"
                  >
                    Open in Chat Tab →
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectChat(selectedChatId)}
                    className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 font-mono text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    ↻ Reload
                  </button>
                </div>
              </div>

              {loadingDetail ? (
                <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                  Loading session data from GET /api/chats/{selectedChatId}...
                </div>
              ) : chatDetail ? (
                <div className="space-y-4 pt-3">
                  {/* Messages timeline */}
                  <div>
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center justify-between">
                      <span>Message Stream ({chatDetail.messages?.length || 0})</span>
                      <span className="font-mono text-[10px] text-zinc-500">Chronological</span>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {chatDetail.messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-2.5 rounded border text-xs space-y-1 ${
                            msg.role === "USER"
                              ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-100"
                              : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                            <span className="font-bold uppercase tracking-wider">{msg.role}</span>
                            <span>{new Date(msg.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                          <div className="font-mono text-[9px] text-zinc-400 select-all pt-1">
                            msg_id: {msg.id}
                          </div>
                        </div>
                      ))}

                      {(!chatDetail.messages || chatDetail.messages.length === 0) && (
                        <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
                          No messages yet in this session. Send a query in the Chat tab to start.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Full Raw API Response Content */}
                  <ApiResponseViewer
                    data={chatDetail}
                    title={`Full Chat Session Object (GET /api/chats/${selectedChatId})`}
                    defaultExpanded={true}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-zinc-500">
              Select a chat session on the left to inspect its messages and full API response object.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
