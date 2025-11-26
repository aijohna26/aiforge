"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Check, Copy, Download } from "lucide-react";
import type { GeneratedFile } from "@/lib/types";

interface CodeEditorProps {
  file: GeneratedFile;
  readOnly?: boolean;
  onChange?: (value: string | undefined) => void;
  isPending?: boolean;
}

export function CodeEditor({
  file,
  readOnly = true,
  onChange,
  isPending = false,
}: CodeEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.path.split("/").pop() ?? "file.tsx";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-mono">{file.path}</span>
          {isPending && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              Saving...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-slate-800 px-3 py-1 text-xs text-slate-200 transition hover:bg-slate-800"
          >
            {copied ? (
              <span className="flex items-center gap-1 text-emerald-300">
                <Check className="h-3 w-3" />
                Copied
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="h-3 w-3" />
                Copy
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-lg border border-slate-800 px-3 py-1 text-xs text-slate-200 transition hover:bg-slate-800"
          >
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              Download
            </span>
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950">
            <div className="space-y-2 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              <p className="text-xs text-slate-400">Loading editor</p>
            </div>
          </div>
        )}
        <Editor
          height="100%"
          language={file.language ?? "typescript"}
          value={file.content}
          theme="vs-dark"
          onChange={onChange}
          onMount={() => setIsLoading(false)}
          options={{
            readOnly,
            minimap: { enabled: false },
            automaticLayout: true,
            fontSize: 14,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            padding: { top: 16 },
            formatOnPaste: !readOnly,
            formatOnType: !readOnly,
            quickSuggestions: !readOnly,
            wordWrap: "on",
          }}
        />
      </div>
    </div>
  );
}
