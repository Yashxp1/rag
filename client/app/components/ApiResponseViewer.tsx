"use client";

import React, { useState } from "react";

interface ApiResponseViewerProps {
  data: unknown;
  status?: number;
  durationMs?: number;
  title?: string;
  defaultExpanded?: boolean;
}

export function ApiResponseViewer({
  data,
  status,
  durationMs,
  title = "API Response Content",
  defaultExpanded = true,
}: ApiResponseViewerProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"both" | "formatted" | "raw">("both");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (data === null || data === undefined) {
    return null;
  }

  const jsonString = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (code?: number) => {
    if (!code) return "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    if (code >= 200 && code < 300) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
    if (code >= 400 && code < 500) return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800";
    return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800";
  };

  // Extract common top-level fields for fast scanning
  const parsedObj = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 text-xs overflow-hidden mt-3 shadow-xs">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 hover:text-zinc-600 dark:hover:text-zinc-400 cursor-pointer"
          >
            <span className="font-mono text-[10px]">{isExpanded ? "▼" : "▶"}</span>
            <span>{title}</span>
          </button>

          {status !== undefined && (
            <span
              className={`font-mono px-1.5 py-0.5 rounded border text-[11px] font-semibold ${getStatusColor(
                status
              )}`}
            >
              {status === 0 ? "ERR" : status}
            </span>
          )}

          {durationMs !== undefined && (
            <span className="text-[11px] font-mono text-zinc-500">
              {durationMs}ms
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode("both")}
              className={`px-2 py-0.5 ${
                viewMode === "both"
                  ? "bg-zinc-200 dark:bg-zinc-700 font-semibold"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setViewMode("formatted")}
              className={`px-2 py-0.5 ${
                viewMode === "formatted"
                  ? "bg-zinc-200 dark:bg-zinc-700 font-semibold"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Parsed
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`px-2 py-0.5 ${
                viewMode === "raw"
                  ? "bg-zinc-200 dark:bg-zinc-700 font-semibold"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              JSON
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] cursor-pointer"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Structured Key Values if parsed object */}
          {(viewMode === "both" || viewMode === "formatted") && parsedObj && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded border border-zinc-200 dark:border-zinc-800/80">
              {Object.entries(parsedObj).map(([key, val]) => {
                if (typeof val === "object" && val !== null) {
                  return (
                    <div key={key} className="col-span-full">
                      <span className="font-mono text-zinc-500 uppercase text-[10px] tracking-wider block">
                        {key}:
                      </span>
                      <pre className="mt-1 p-2 rounded bg-zinc-100 dark:bg-zinc-900 font-mono text-[11px] overflow-x-auto text-zinc-800 dark:text-zinc-200 max-h-40">
                        {JSON.stringify(val, null, 2)}
                      </pre>
                    </div>
                  );
                }
                return (
                  <div key={key} className="overflow-hidden">
                    <span className="font-mono text-zinc-500 uppercase text-[10px] tracking-wider block">
                      {key}
                    </span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 font-medium break-all">
                      {String(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Raw JSON */}
          {(viewMode === "both" || viewMode === "raw" || !parsedObj) && (
            <div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                Complete Raw Response:
              </div>
              <pre className="p-2.5 rounded bg-zinc-900 text-zinc-100 font-mono text-[11px] overflow-x-auto leading-relaxed border border-zinc-800 max-h-80 select-text">
                {jsonString}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
