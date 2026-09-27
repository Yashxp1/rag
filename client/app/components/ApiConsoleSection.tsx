"use client";

import React, { useState } from "react";
import { ApiCallLog } from "../types";
import { ApiResponseViewer } from "./ApiResponseViewer";

interface ApiConsoleSectionProps {
  logs: ApiCallLog[];
  onClearLogs: () => void;
}

export function ApiConsoleSection({ logs, onClearLogs }: ApiConsoleSectionProps) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(
    logs.length > 0 ? logs[0].id : null
  );

  const selectedLog = logs.find((l) => l.id === selectedLogId) || logs[0];

  const getStatusColor = (status: number) => {
    if (status === 0) return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300";
    if (status >= 200 && status < 300) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300";
    if (status >= 400 && status < 500) return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300";
    return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300";
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rag-api-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Live API Request &amp; Response Console</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {logs.length} calls logged
            </span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Full audit log of every request sent and response payload received from the RAG server.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              className="text-xs px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono cursor-pointer"
            >
              Export JSON
            </button>
          )}
          <button
            type="button"
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="text-xs px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono cursor-pointer disabled:opacity-50"
          >
            Clear History
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md">
          No API calls recorded yet. Interact with the chat, upload, or routes tab to see live request/response logs.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Logs List */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 overflow-hidden">
            <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
              <span>Request Stream</span>
              <span className="font-mono text-[10px] text-zinc-500">Recent First</span>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-[500px] overflow-y-auto">
              {logs.map((log) => {
                const isSelected = (selectedLog?.id || logs[0]?.id) === log.id;
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`p-2.5 text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-900 font-medium"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-[10px] text-zinc-600 dark:text-zinc-400">
                          {log.method}
                        </span>
                        <span className="truncate max-w-[140px] text-zinc-900 dark:text-zinc-100 text-[11px]">
                          {log.endpoint}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {log.status === 0 ? "ERR" : log.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>{log.durationMs}ms</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Log Inspector */}
          <div className="lg:col-span-2 border border-zinc-200 dark:border-zinc-800 rounded-md p-3.5 bg-white dark:bg-zinc-950 space-y-3">
            {selectedLog ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-200 dark:border-zinc-800 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold uppercase text-zinc-700 dark:text-zinc-300">
                      {selectedLog.method}
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      {selectedLog.endpoint}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded border font-bold ${getStatusColor(
                        selectedLog.status
                      )}`}
                    >
                      Status: {selectedLog.status === 0 ? "Network Error" : selectedLog.status}
                    </span>
                    <span className="text-zinc-500">{selectedLog.durationMs}ms</span>
                    <span className="text-zinc-400">{selectedLog.timestamp}</span>
                  </div>
                </div>

                {/* Request Payload */}
                {selectedLog.requestPayload !== undefined && (
                  <div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-bold mb-1">
                      Request Payload Sent:
                    </div>
                    <pre className="font-mono text-[11px] p-2.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 overflow-x-auto max-h-36">
                      {typeof selectedLog.requestPayload === "string"
                        ? selectedLog.requestPayload
                        : JSON.stringify(selectedLog.requestPayload, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Verbatim Server Response Content */}
                <div>
                  <ApiResponseViewer
                    data={selectedLog.responseData}
                    status={selectedLog.status}
                    durationMs={selectedLog.durationMs}
                    title="Verbatim Server Response Content"
                    defaultExpanded={true}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
