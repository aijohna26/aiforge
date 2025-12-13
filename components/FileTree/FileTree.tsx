"use client";

import { useMemo, useState } from "react";
import { ChevronRight, FileText, Folder, FolderOpen, Search, Lock } from "lucide-react";
import type { GeneratedFile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { isCoreFile } from "@/lib/templates/react-native-base";
import clsx from "clsx";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

function buildFileTree(files: GeneratedFile[]): FileNode[] {
  const root: FileNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split("/").filter(Boolean);
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;
      let existing = currentLevel.find((node) => node.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        currentLevel.push(existing);
      }

      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    });
  });

  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        }
        return a.type === "folder" ? -1 : 1;
      })
      .map((node) => {
        if (node.children) {
          return { ...node, children: sortNodes(node.children) };
        }
        return node;
      });
  };

  return sortNodes(Object.values(root));
}

interface FileTreeProps {
  files: GeneratedFile[];
  onFileSelect: (path: string) => void;
  selectedFile?: string | null;
  editedFiles?: Set<string>;
  addedFiles?: Set<string>;
  modifiedFiles?: Set<string>;
}

import { useStore } from '@nanostores/react';
import { lockedFiles } from '@/lib/stores/editor';

// ... (imports)

// ... (interfaces)

export function FileTree({
  files,
  onFileSelect,
  selectedFile,
  editedFiles,
  addedFiles,
  modifiedFiles,
}: FileTreeProps) {
  const tree = useMemo(() => buildFileTree(files), [files]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    buildInitialExpandedPaths(files)
  );
  const locked = useStore(lockedFiles);

  const togglePath = (path: string) => {
    const next = new Set(expandedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setExpandedPaths(next);
  };

  // ... (rest of FileTree logic)

  return (
    <div className="flex h-full flex-col border-r border-slate-800 bg-slate-950/80">
      {/* ... header ... */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {tree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            expandedPaths={expandedPaths}
            onToggle={togglePath}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            editedFiles={editedFiles}
            addedFiles={addedFiles}
            modifiedFiles={modifiedFiles}
            lockedFiles={locked}
          />
        ))}
      </div>
    </div>
  );
}

function buildInitialExpandedPaths(files: GeneratedFile[]) {
  const paths = new Set<string>(["/"]);
  files.forEach((file) => {
    const parts = file.path.split("/").filter(Boolean);
    let current = "";
    for (let i = 0; i < parts.length - 1; i += 1) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      paths.add(current);
    }
  });
  return paths;
}

interface FileTreeNodeProps {
  node: FileNode;
  level: number;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onFileSelect: (path: string) => void;
  selectedFile?: string | null;
  editedFiles?: Set<string>;
  addedFiles?: Set<string>;
  modifiedFiles?: Set<string>;
  lockedFiles?: Set<string>;
}

function FileTreeNode({
  node,
  level,
  expandedPaths,
  onToggle,
  onFileSelect,
  selectedFile,
  editedFiles,
  addedFiles,
  modifiedFiles,
  lockedFiles,
}: FileTreeNodeProps) {
  const isEdited = node.type === "file" && editedFiles?.has(node.path);
  const isCore = node.type === "file" && isCoreFile(node.path);
  const isAdded = node.type === "file" && addedFiles?.has(node.path);
  const isModified = node.type === "file" && modifiedFiles?.has(node.path);
  const isLocked = node.type === "file" && lockedFiles?.has(node.path);

  const Icon =
    node.type === "folder"
      ? expandedPaths.has(node.path)
        ? FolderOpen
        : Folder
      : FileText;

  const padding = `${level * 12 + 8}px`;

  const handleClick = () => {
    if (node.type === "folder") {
      onToggle(node.path);
    } else {
      if (!isLocked) {
        onFileSelect(node.path);
      }
    }
  };

  return (
    <div>
      <button
        className={clsx(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-sm text-slate-200 transition hover:bg-slate-900/70",
          selectedFile === node.path && "bg-slate-900 text-white",
          isLocked && "opacity-50 cursor-not-allowed"
        )}
        style={{ paddingLeft: padding }}
        onClick={handleClick}
        disabled={isLocked}
        title={isCore ? "Core template file (managed by AppForge)" : isLocked ? "File is being modified by AI" : undefined}
      >
        {node.type === "folder" && (
          <ChevronRight
            className={clsx(
              "h-4 w-4 text-slate-500 transition",
              expandedPaths.has(node.path) && "rotate-90"
            )}
          />
        )}
        <Icon className={clsx("h-4 w-4", isEdited ? "text-amber-400" : isCore ? "text-blue-400" : "text-slate-400")} />
        <span className={clsx("truncate text-sm", isEdited && "text-amber-300", isCore && "text-blue-300")}>
          {node.name}
        </span>
        {isAdded && (
          <span className="ml-auto rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">NEW</span>
        )}
        {!isAdded && isModified && (
          <span className="ml-auto rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">MOD</span>
        )}
        {isCore && (
          <Lock className="ml-auto h-3 w-3 text-blue-400/60" />
        )}
        {isLocked && !isCore && (
          <Lock className="ml-auto h-3 w-3 text-amber-400 animate-pulse" />
        )}
        {isEdited && !isCore && !isAdded && !isModified && !isLocked && (
          <span className="ml-auto h-2 w-2 rounded-full bg-amber-400" />
        )}
      </button>

      {node.type === "folder" &&
        expandedPaths.has(node.path) &&
        node.children?.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            level={level + 1}
            expandedPaths={expandedPaths}
            onToggle={onToggle}
            onFileSelect={onFileSelect}
            selectedFile={selectedFile}
            editedFiles={editedFiles}
            addedFiles={addedFiles}
            modifiedFiles={modifiedFiles}
            lockedFiles={lockedFiles}
          />
        ))}
    </div>
  );
}
