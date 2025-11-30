"use client";

import { useMemo, useState } from "react";
import { diffLines } from "@/lib/utils/diff-lines";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiffViewerProps {
  fileName: string;
  before: string;
  after: string;
  onClose: () => void;
}

export function DiffViewer({ fileName, before, after, onClose }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  const lineMetadata = useMemo(() => {
    const beforeDiff: Record<number, "removed" | "changed" | null> = {};
    const afterDiff: Record<number, "added" | "changed" | null> = {};

    const diff = diffLines(before, after);
    let beforeIndex = 0;
    let afterIndex = 0;

    diff.forEach((part) => {
      const value = part.value.endsWith("\n") ? part.value.slice(0, -1) : part.value;
      const lines = value.length ? value.split("\n") : [""];

      if (part.removed) {
        lines.forEach(() => {
          beforeDiff[beforeIndex] = "removed";
          beforeIndex += 1;
        });
      } else if (part.added) {
        lines.forEach(() => {
          afterDiff[afterIndex] = "added";
          afterIndex += 1;
        });
      } else {
        lines.forEach(() => {
          beforeIndex += 1;
          afterIndex += 1;
        });
      }
    });

    return { beforeDiff, afterDiff };
  }, [before, after]);

  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-7xl flex-col rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Code Changes</h2>
            <p className="text-sm text-slate-400">{fileName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-slate-700 bg-slate-800 p-1">
              <button
                onClick={() => setViewMode("split")}
                className={`px-3 py-1.5 text-sm transition ${
                  viewMode === "split"
                    ? "rounded bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Split View
              </button>
              <button
                onClick={() => setViewMode("unified")}
                className={`px-3 py-1.5 text-sm transition ${
                  viewMode === "unified"
                    ? "rounded bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Unified
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-auto">
          {viewMode === "split" ? (
            <div className="grid h-full grid-cols-2">
              {/* Before */}
              <div className="border-r border-slate-700 bg-slate-950">
                <div className="sticky top-0 border-b border-slate-700 bg-slate-900 px-4 py-2">
                  <p className="text-sm font-medium text-slate-300">Before (Original)</p>
                </div>
                <pre className="p-4 text-sm text-slate-300">
                  {beforeLines.map((line, i) => (
                    <div
                      key={i}
                      className={`flex hover:bg-slate-800/50 ${
                        lineMetadata.beforeDiff[i]
                          ? lineMetadata.beforeDiff[i] === "removed"
                            ? "bg-red-950/30 text-red-200"
                            : "bg-amber-900/30 text-amber-200"
                          : ""
                      }`}
                    >
                      <span className="mr-4 w-8 select-none text-right text-slate-500">
                        {lineMetadata.beforeDiff[i] === "removed" ? "-" : " "}
                        {i + 1}
                      </span>
                      <span className="flex-1">{line || " "}</span>
                    </div>
                  ))}
                </pre>
              </div>

              {/* After */}
              <div className="bg-slate-950">
                <div className="sticky top-0 border-b border-slate-700 bg-slate-900 px-4 py-2">
                  <p className="text-sm font-medium text-emerald-400">After (AI Changes)</p>
                </div>
                <pre className="p-4 text-sm text-slate-300">
                  {afterLines.map((line, i) => (
                    <div
                      key={i}
                      className={`flex hover:bg-slate-800/50 ${
                        lineMetadata.afterDiff[i]
                          ? lineMetadata.afterDiff[i] === "added"
                            ? "bg-emerald-950/30 text-emerald-200"
                            : "bg-amber-900/30 text-amber-200"
                          : ""
                      }`}
                    >
                      <span className="mr-4 w-8 select-none text-right text-slate-500">
                        {lineMetadata.afterDiff[i] === "added" ? "+" : " "}
                        {i + 1}
                      </span>
                      <span className="flex-1">{line || " "}</span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          ) : (
            /* Unified View */
            <div className="bg-slate-950">
              <div className="sticky top-0 border-b border-slate-700 bg-slate-900 px-4 py-2">
                <p className="text-sm font-medium text-slate-300">Unified Diff</p>
              </div>
              <pre className="p-4 text-sm text-slate-300">
                {diffLines(before, after).map((part, index) => {
                  const value = part.value.endsWith("\n") ? part.value.slice(0, -1) : part.value;
                  const lines = value.length ? value.split("\n") : [""];
                  return lines.map((l, i) => (
                    <div
                      key={`${index}-${i}`}
                      className={`flex ${
                        part.added
                          ? "bg-emerald-950/30 text-emerald-300"
                          : part.removed
                          ? "bg-red-950/30 text-red-300"
                          : ""
                      }`}
                    >
                      <span className="mr-4 w-8 select-none text-right">
                        {part.added ? "+" : part.removed ? "-" : " "}
                      </span>
                      <span className="flex-1">{l || " "}</span>
                    </div>
                  ));
                })}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            <span className="text-emerald-400">
                +{Object.values(lineMetadata.afterDiff).filter((v) => v === "added").length} additions
            </span>
            {" • "}
            <span className="text-red-400">
                -{Object.values(lineMetadata.beforeDiff).filter((v) => v === "removed").length} deletions
            </span>
          </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
