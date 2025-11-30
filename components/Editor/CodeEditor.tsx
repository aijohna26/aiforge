"use client";

import { memo, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { Check, Copy, Download } from "lucide-react";
import type { GeneratedFile } from "@/lib/types";
import { MONACO_TYPE_STUBS } from "@/lib/monaco/type-stubs";

interface CodeEditorProps {
  file: GeneratedFile;
  readOnly?: boolean;
  onChange?: (value: string | undefined) => void;
  isPending?: boolean;
}

function CodeEditorComponent({
  file,
  readOnly = true,
  onChange,
  isPending = false,
}: CodeEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const editorPath = useMemo(() => {
    if (file.path.startsWith("file:///")) return file.path;
    const normalized = file.path.startsWith("/")
      ? file.path.slice(1)
      : file.path;
    return `file:///${normalized}`;
  }, [file.path]);

  const handleChange = (value: string | undefined) => {
    onChange?.(value);
  };

  const handleBeforeMount = (monaco: typeof Monaco) => {
    // Shared compiler options to mimic Expo/React Native projects
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowJs: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      typeRoots: ["node_modules/@types"],
      types: ["node", "react", "react-dom"],
      noEmit: true,
      allowNonTsExtensions: true,
      jsxImportSource: "react",
      reactNamespace: "React",
      noLib: false,
    });

    if (!(window as any).__appforge_monaco_types_loaded) {
      MONACO_TYPE_STUBS.forEach((stub) => {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          stub.content,
          stub.path,
        );
      });
      (window as any).__appforge_monaco_types_loaded = true;
    }
  };

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
          key={file.path}
          height="100%"
          language={file.language ?? "typescript"}
          value={file.content}
          path={editorPath}
          theme="vs-dark"
          onChange={handleChange}
          beforeMount={handleBeforeMount}
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

export const CodeEditor = memo(
  CodeEditorComponent,
  (prev, next) =>
    prev.file.path === next.file.path &&
    prev.file.content === next.file.content &&
    prev.readOnly === next.readOnly &&
    prev.isPending === next.isPending,
);
