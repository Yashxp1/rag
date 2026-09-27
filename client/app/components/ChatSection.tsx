"use client";

import React, { useState, useEffect, useCallback } from "react";
import { executeApiCall } from "../api";
import { ApiResponseViewer } from "./ApiResponseViewer";
import { ChatItem, ApiCallLog } from "../types";

interface ChatSectionProps {
  serverUrl: string;
  onLog: (log: ApiCallLog) => void;
  selectedChatId?: string;
  onSelectChatId?: (chatId: string) => void;
}

export function ChatSection({
  serverUrl,
  onLog,
  selectedChatId,
  onSelectChatId,
}: ChatSectionProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>(selectedChatId || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingChats, setFetchingChats] = useState(false);
  const [fetchingChatDetail, setFetchingChatDetail] = useState(false);
  const [currentChatDetail, setCurrentChatDetail] = useState<ChatItem | null>(null);

  // Response from the latest send query
  const [latestResponse, setLatestResponse] = useState<unknown>(null);
  const [latestStatus, setLatestStatus] = useState<number | undefined>(undefined);
  const [latestDuration, setLatestDuration] = useState<number | undefined>(undefined);

  // Sync external selectedChatId
  useEffect(() => {
    if (selectedChatId !== undefined && selectedChatId !== activeChatId) {
      setActiveChatId(selectedChatId);
    }
  }, [selectedChatId, activeChatId]);

  // Load chat sessions
  const loadChats = useCallback(async () => {
    setFetchingChats(true);
    const res = await executeApiCall(serverUrl, "/api/chats", { method: "GET" }, onLog);
    if (res.ok && res.data && typeof res.data === "object" && "chats" in (res.data as Record<string, unknown>)) {
      setChats((res.data as { chats: ChatItem[] }).chats || []);
    }
    setFetchingChats(false);
  }, [serverUrl, onLog]);

  // Load specific chat messages
  const loadChatDetail = useCallback(async (chatId: string) => {
    if (!chatId) {
      setCurrentChatDetail(null);
      return;
    }
    setFetchingChatDetail(true);
    const res = await executeApiCall(serverUrl, `/api/chats/${chatId}`, { method: "GET" }, onLog);
    if (res.ok && res.data && typeof res.data === "object" && "chat" in (res.data as Record<string, unknown>)) {
      setCurrentChatDetail((res.data as { chat: ChatItem }).chat);
    }
    setFetchingChatDetail(false);
  }, [serverUrl, onLog]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    if (activeChatId) {
      loadChatDetail(activeChatId);
    } else {
      setCurrentChatDetail(null);
    }
  }, [activeChatId, loadChatDetail]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    setLatestResponse(null);

    let endpoint = "/api/chat";
    let payload: Record<string, string> = { message };

    if (activeChatId) {
      // Use existing chat endpoint
      endpoint = `/api/chat/${activeChatId}`;
      payload = { message };
    } else {
      // Auto-creates new chat or creates chat
      endpoint = "/api/chat";
      payload = { message };
    }

    const res = await executeApiCall(
      serverUrl,
      endpoint,
      {
        method: "POST",
        body: payload,
      },
      onLog
    );

    setLatestStatus(res.status);
    setLatestDuration(res.durationMs);
    setLatestResponse(res.data);

    // If new chat ID returned, switch to it
    if (res.ok && res.data && typeof res.data === "object") {
      const respObj = res.data as { chatId?: string };
      if (respObj.chatId) {
        setActiveChatId(respObj.chatId);
        if (onSelectChatId) onSelectChatId(respObj.chatId);
        await loadChats();
        await loadChatDetail(respObj.chatId);
      } else if (activeChatId) {
        await loadChatDetail(activeChatId);
      }
    }

    setMessage("");
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>RAG Chat &amp; Query Console</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              POST /api/chat | POST /api/chat/:chatId
            </span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Send queries to query Pinecone vectors (Gemini embeddings) + generate answers with Ollama Gemma 3.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadChats();
            if (activeChatId) loadChatDetail(activeChatId);
          }}
          disabled={fetchingChats || fetchingChatDetail}
          className="text-xs px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono cursor-pointer self-start sm:self-auto"
        >
          {fetchingChats ? "Refreshing..." : "↻ Refresh Chats"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Chat Selector & Mode */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-950 space-y-3">
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
            <span>Select Target Chat Session</span>
            <span className="font-mono text-[10px] text-zinc-500">
              {chats.length} available
            </span>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveChatId("");
                if (onSelectChatId) onSelectChatId("");
              }}
              className={`w-full text-left text-xs p-2 rounded border cursor-pointer transition-colors ${
                !activeChatId
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-medium"
                  : "border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>+ Auto-Create New Chat</span>
                <span className="font-mono text-[10px] uppercase text-zinc-400">POST /api/chat</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Automatically creates session from the query title
              </p>
            </button>

            <div className="max-h-56 overflow-y-auto space-y-1 pt-1">
              {chats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveChatId(c.id);
                    if (onSelectChatId) onSelectChatId(c.id);
                  }}
                  className={`w-full text-left text-xs p-2 rounded border cursor-pointer transition-colors ${
                    activeChatId === c.id
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div className="font-medium truncate">{c.title || "Untitled Session"}</div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                    <span>{c.id.slice(0, 10)}...</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}

              {chats.length === 0 && !fetchingChats && (
                <div className="text-center text-xs text-zinc-500 py-3">
                  No chat sessions found. Start a new one below!
                </div>
              )}
            </div>
          </div>

          {activeChatId && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] space-y-1">
              <div className="text-zinc-500">Active Chat ID:</div>
              <div className="font-mono bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 break-all select-all">
                {activeChatId}
              </div>
            </div>
          )}
        </div>

        {/* Right / Center Column: Message Input & History */}
        <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-950 flex flex-col justify-between space-y-3">
          {/* Active Target Banner */}
          <div className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">Route target:</span>
              <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                {activeChatId ? `POST /api/chat/${activeChatId}` : "POST /api/chat"}
              </span>
            </div>
            {currentChatDetail && (
              <span className="text-zinc-500 text-[11px]">
                {currentChatDetail.messages?.length || 0} messages in history
              </span>
            )}
          </div>

          {/* Conversation Messages if chat detail is loaded */}
          {currentChatDetail && currentChatDetail.messages && currentChatDetail.messages.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded p-2.5 max-h-72 overflow-y-auto space-y-2 bg-zinc-50/50 dark:bg-zinc-900/30">
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                Session History ({currentChatDetail.messages.length} messages)
              </div>
              {currentChatDetail.messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded text-xs space-y-1 ${
                    m.role === "USER"
                      ? "bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-100 ml-4"
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 mr-4"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span className="font-bold uppercase tracking-wider">{m.role}</span>
                    <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-xs">{m.content}</div>
                </div>
              ))}
            </div>
          )}

          {/* Query Form */}
          <form onSubmit={handleSendMessage} className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Prompt / Query Text:
            </label>
            <textarea
              rows={3}
              placeholder="Type your question for the RAG server (e.g. 'Summarize the document', 'What were the financial numbers?')..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs p-2.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 font-sans"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-zinc-500">
                {activeChatId ? "Will query linked docs & use recent context" : "Will create a fresh session"}
              </div>

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="px-4 py-1.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin font-mono">◓</span>
                    <span>Querying RAG...</span>
                  </>
                ) : (
                  <span>Send Query →</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* RAG API Response Viewer (Displays ALL response content) */}
      {latestResponse !== null && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1 flex items-center gap-2">
            <span>RAG Query Server Response</span>
            <span className="text-[11px] text-zinc-500 font-normal">
              (All content returned by the server)
            </span>
          </div>

          {/* If an answer is returned in the payload, show a clean prominent display */}
          {typeof latestResponse === "object" &&
            latestResponse !== null &&
            "answer" in (latestResponse as Record<string, unknown>) && (
              <div className="p-3 mb-2 rounded border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
                <div className="font-mono text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  Assistant Answer:
                </div>
                <div className="text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed">
                  {String((latestResponse as Record<string, unknown>).answer || "(Empty answer)")}
                </div>
              </div>
            )}

          <ApiResponseViewer
            data={latestResponse}
            status={latestStatus}
            durationMs={latestDuration}
            title="Complete RAG Response Payload"
            defaultExpanded={true}
          />
        </div>
      )}
    </div>
  );
}
