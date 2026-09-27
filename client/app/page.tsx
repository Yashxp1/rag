"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DEFAULT_SERVER_URL, executeApiCall } from "./api";
import { ApiCallLog, ApiRouteInfo, ServerHealth } from "./types";
import { AVAILABLE_API_ROUTES } from "./routes-data";
import { ApiRoutesSection } from "./components/ApiRoutesSection";
import { ChatSection } from "./components/ChatSection";
import { DocumentsSection } from "./components/DocumentsSection";
import { ChatsManagerSection } from "./components/ChatsManagerSection";
import { ApiConsoleSection } from "./components/ApiConsoleSection";

type TabKey = "routes" | "chat" | "documents" | "sessions" | "console";

export default function Home() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [activeTab, setActiveTab] = useState<TabKey>("routes");
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [healthData, setHealthData] = useState<ServerHealth | null>(null);
  const [apiLogs, setApiLogs] = useState<ApiCallLog[]>([]);
  const [selectedChatIdForQuery, setSelectedChatIdForQuery] = useState<string>("");

  const handleLog = useCallback((log: ApiCallLog) => {
    setApiLogs((prev) => [log, ...prev].slice(0, 50));
  }, []);

  // Ping server health
  const checkHealth = useCallback(async () => {
    setServerStatus("checking");
    const res = await executeApiCall(serverUrl, "/api/health", { method: "GET" }, handleLog);
    if (res.ok && res.status === 200) {
      setServerStatus("online");
      setHealthData(res.data as ServerHealth);
    } else {
      // Fallback check against /api/chats
      const chatsRes = await executeApiCall(serverUrl, "/api/chats", { method: "GET" }, handleLog);
      if (chatsRes.ok) {
        setServerStatus("online");
        setHealthData({
          success: true,
          status: "online",
          uptime: 0,
          timestamp: new Date().toISOString(),
        });
      } else {
        setServerStatus("offline");
        setHealthData(null);
      }
    }
  }, [serverUrl, handleLog]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleSelectRouteFromReference = (route: ApiRouteInfo) => {
    if (route.category === "Chat & Inference") {
      if (route.path.includes("chats")) {
        setActiveTab("sessions");
      } else {
        setActiveTab("chat");
      }
    } else if (route.category === "Documents & Storage") {
      setActiveTab("documents");
    } else {
      checkHealth();
    }
  };

  const handleOpenInChatTab = (chatId: string) => {
    setSelectedChatIdForQuery(chatId);
    setActiveTab("chat");
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans">
      {/* Top Simple Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-50">
                  RAG Server Dashboard
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  Minimal Console
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Bun + Express + Pinecone + Ollama Gemma 3 + Gemini Embeddings
              </p>
            </div>
          </div>

          {/* Server URL Input & Connection Status */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1">
              <span className="text-zinc-400 font-mono text-[11px] mr-1.5">Host:</span>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:4001"
                className="font-mono text-xs text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-none w-44"
              />
            </div>

            <button
              type="button"
              onClick={checkHealth}
              className="px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono text-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Ping</span>
            </button>

            {/* Status indicator */}
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono font-medium ${
                serverStatus === "online"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                  : serverStatus === "checking"
                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  serverStatus === "online"
                    ? "bg-emerald-500 animate-pulse"
                    : serverStatus === "checking"
                    ? "bg-amber-500"
                    : "bg-rose-500"
                }`}
              />
              <span className="uppercase text-[11px] tracking-wider">
                {serverStatus === "online"
                  ? "Online"
                  : serverStatus === "checking"
                  ? "Checking..."
                  : "Offline"}
              </span>
              {healthData?.uptime !== undefined && (
                <span className="text-zinc-500 text-[10px] hidden sm:inline">
                  ({healthData.uptime}s uptime)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto text-xs py-1">
          <button
            type="button"
            onClick={() => setActiveTab("routes")}
            className={`px-3 py-1.5 rounded font-medium cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "routes"
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Available API Routes ({AVAILABLE_API_ROUTES.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded font-medium cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "chat"
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Chat &amp; RAG Query
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-1.5 rounded font-medium cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "documents"
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Document Ingestion &amp; Status
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`px-3 py-1.5 rounded font-medium cursor-pointer whitespace-nowrap transition-colors ${
              activeTab === "sessions"
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Chat Sessions
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("console")}
            className={`px-3 py-1.5 rounded font-medium cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === "console"
                ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <span>Live Response Log</span>
            {apiLogs.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold">
                {apiLogs.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5">
        {serverStatus === "offline" && (
          <div className="mb-5 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold">Server Not Reachable at {serverUrl}:</span>{" "}
              Make sure your RAG server is running (<code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">bun run dev</code> in the server folder).
            </div>
            <button
              type="button"
              onClick={checkHealth}
              className="text-xs font-mono font-medium underline hover:text-amber-700 dark:hover:text-amber-300 self-start sm:self-auto cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === "routes" && (
          <ApiRoutesSection
            serverUrl={serverUrl}
            onSelectRoute={handleSelectRouteFromReference}
          />
        )}

        {activeTab === "chat" && (
          <ChatSection
            serverUrl={serverUrl}
            onLog={handleLog}
            selectedChatId={selectedChatIdForQuery}
            onSelectChatId={setSelectedChatIdForQuery}
          />
        )}

        {activeTab === "documents" && (
          <DocumentsSection
            serverUrl={serverUrl}
            onLog={handleLog}
            onSelectChatForQuery={handleOpenInChatTab}
          />
        )}

        {activeTab === "sessions" && (
          <ChatsManagerSection
            serverUrl={serverUrl}
            onLog={handleLog}
            onOpenInChat={handleOpenInChatTab}
          />
        )}

        {activeTab === "console" && (
          <ApiConsoleSection
            logs={apiLogs}
            onClearLogs={() => setApiLogs([])}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 py-3 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            RAG Server Minimal Dashboard &bull; Direct API integration with complete response inspection
          </div>
          <div className="font-mono text-[11px] text-zinc-400">
            Routes: {AVAILABLE_API_ROUTES.length} &bull; Server: {serverUrl}
          </div>
        </div>
      </footer>
    </div>
  );
}
