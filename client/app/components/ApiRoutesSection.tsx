"use client";

import React, { useState } from "react";
import { AVAILABLE_API_ROUTES } from "../routes-data";
import { ApiRouteInfo } from "../types";

interface ApiRoutesSectionProps {
  serverUrl: string;
  onSelectRoute?: (route: ApiRouteInfo) => void;
}

export function ApiRoutesSection({ serverUrl, onSelectRoute }: ApiRoutesSectionProps) {
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const categories = ["All", "Chat & Inference", "Documents & Storage", "System"];

  const filteredRoutes = AVAILABLE_API_ROUTES.filter((route) => {
    const matchesCategory = filterCategory === "All" || route.category === filterCategory;
    const matchesSearch =
      route.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.method.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800";
      case "POST":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      case "PUT":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800";
      case "DELETE":
        return "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  const copyCurl = (route: ApiRouteInfo) => {
    const cleanBase = serverUrl.replace(/\/+$/, "");
    let curl = `curl -X ${route.method} "${cleanBase}${route.path.replace(":chatId", "CHAT_ID").replace(":documentId", "DOC_ID")}"`;
    if (route.contentType) {
      curl += ` -H "Content-Type: ${route.contentType}"`;
    }
    if (route.requestBody && route.contentType === "application/json") {
      curl += ` -d '${route.requestBody.replace(/\n/g, "")}'`;
    }
    navigator.clipboard.writeText(curl);
    setCopiedIndex(`curl-${route.path}`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedIndex(`path-${path}`);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Available RAG Server API Routes</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
              {AVAILABLE_API_ROUTES.length} endpoints
            </span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Full specification of endpoints available on the backend server at <code className="font-mono text-zinc-700 dark:text-zinc-300">{serverUrl}</code>
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Filter routes (e.g. upload, chat)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />

          <div className="flex rounded border border-zinc-300 dark:border-zinc-700 overflow-hidden text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 cursor-pointer ${
                  filterCategory === cat
                    ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 font-medium"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-3">
        {filteredRoutes.map((route) => {
          const isExpanded = expandedRoute === route.path;

          return (
            <div
              key={`${route.method}-${route.path}`}
              className="border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 overflow-hidden"
            >
              <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                <div className="flex items-start sm:items-center gap-2.5">
                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border tracking-wide uppercase ${getMethodBadge(
                      route.method
                    )}`}
                  >
                    {route.method}
                  </span>

                  <button
                    type="button"
                    onClick={() => copyPath(route.path)}
                    title="Click to copy endpoint path"
                    className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left"
                  >
                    {route.path}
                    {copiedIndex === `path-${route.path}` && (
                      <span className="ml-1 text-[10px] text-emerald-600 font-sans font-normal">
                        copied!
                      </span>
                    )}
                  </button>

                  <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-800">
                    {route.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto text-xs">
                  {onSelectRoute && (
                    <button
                      type="button"
                      onClick={() => onSelectRoute(route)}
                      className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                    >
                      Use in Dashboard →
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => copyCurl(route)}
                    className="px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px] border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  >
                    {copiedIndex === `curl-${route.path}` ? "✓ cURL Copied" : "Copy cURL"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedRoute(isExpanded ? null : route.path)}
                    className="px-2 py-1 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer text-[11px]"
                  >
                    {isExpanded ? "Hide Details ▲" : "View Details ▼"}
                  </button>
                </div>
              </div>

              {/* Summary Description */}
              <div className="px-3 pb-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                {route.description}
              </div>

              {/* Expanded details: Parameters, schema, response sample */}
              {isExpanded && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3 space-y-3 text-xs">
                  {route.urlParams && (
                    <div>
                      <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold mb-1">
                        URL Parameters
                      </div>
                      <div className="font-mono text-[11px] bg-white dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                        {route.urlParams}
                      </div>
                    </div>
                  )}

                  {route.contentType && (
                    <div>
                      <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold mb-1">
                        Content-Type
                      </div>
                      <div className="font-mono text-[11px] bg-white dark:bg-zinc-950 p-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200">
                        {route.contentType}
                      </div>
                    </div>
                  )}

                  {route.requestBody && (
                    <div>
                      <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold mb-1">
                        Expected Request Body
                      </div>
                      <pre className="font-mono text-[11px] bg-white dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 overflow-x-auto">
                        {route.requestBody}
                      </pre>
                    </div>
                  )}

                  <div>
                    <div className="text-[10px] font-mono uppercase text-zinc-500 font-bold mb-1">
                      Expected API Response Sample
                    </div>
                    <pre className="font-mono text-[11px] bg-zinc-900 text-zinc-100 p-2.5 rounded border border-zinc-800 overflow-x-auto max-h-56">
                      {route.responseSample}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredRoutes.length === 0 && (
          <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-md">
            No API routes match &quot;{searchQuery}&quot; in category &quot;{filterCategory}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}
