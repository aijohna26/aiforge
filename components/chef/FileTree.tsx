'use client';

import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { classNames } from '@/lib/utils/classNames';
import { diffLines, type Change } from 'diff';
import { CaretRightIcon, CaretDownIcon, FileIcon } from '@radix-ui/react-icons';

const NODE_PADDING_LEFT = 8;
const DEFAULT_HIDDEN_FILES = [/\/node_modules\//, /\/\.next/, /\/\.expo/, /\/dist\//];
const DEFAULT_COLLAPSED_FOLDERS = new Set(['/node_modules', '/.next', '/.expo', '/dist']);

export interface FileMap {
  [path: string]: {
    type: 'file' | 'folder';
    content?: string;
  };
}

export interface FileHistory {
  originalContent?: string;
  versions: Array<{ content: string; timestamp: number }>;
}

interface Props {
  files?: FileMap;
  selectedFile?: string;
  onFileSelect?: (filePath: string) => void;
  rootFolder?: string;
  hideRoot?: boolean;
  collapsed?: boolean;
  allowFolderSelection?: boolean;
  hiddenFiles?: Array<string | RegExp>;
  unsavedFiles?: Set<string>;
  fileHistory?: Record<string, FileHistory>;
  className?: string;
}

export const FileTree = memo(
  ({
    files = {},
    onFileSelect,
    selectedFile,
    rootFolder,
    hideRoot = false,
    collapsed = false,
    allowFolderSelection = false,
    hiddenFiles,
    className,
    unsavedFiles,
    fileHistory = {},
  }: Props) => {
    const computedHiddenFiles = useMemo(() => [...DEFAULT_HIDDEN_FILES, ...(hiddenFiles ?? [])], [hiddenFiles]);

    const fileList = useMemo(() => {
      return buildFileList(files, rootFolder, hideRoot, computedHiddenFiles);
    }, [files, rootFolder, hideRoot, computedHiddenFiles]);

    const [collapsedFolders, setCollapsedFolders] = useState(() => {
      const allFolders = fileList.filter((item) => item.kind === 'folder').map((item) => item.fullPath);
      if (collapsed) {
        return new Set(allFolders);
      }
      return new Set(allFolders.filter((folder) => DEFAULT_COLLAPSED_FOLDERS.has(folder)));
    });

    useEffect(() => {
      if (collapsed) {
        setCollapsedFolders(new Set(fileList.filter((item) => item.kind === 'folder').map((item) => item.fullPath)));
        return;
      }

      setCollapsedFolders((prevCollapsed) => {
        const newCollapsed = new Set<string>();

        for (const folder of fileList) {
          if (folder.kind === 'folder' && prevCollapsed.has(folder.fullPath)) {
            newCollapsed.add(folder.fullPath);
          }
        }

        return newCollapsed;
      });
    }, [fileList, collapsed]);

    const filteredFileList = useMemo(() => {
      const list = [];

      let lastDepth = Number.MAX_SAFE_INTEGER;

      for (const fileOrFolder of fileList) {
        const depth = fileOrFolder.depth;

        // if the depth is equal we reached the end of the collapsed group
        if (lastDepth === depth) {
          lastDepth = Number.MAX_SAFE_INTEGER;
        }

        // ignore collapsed folders
        if (collapsedFolders.has(fileOrFolder.fullPath)) {
          lastDepth = Math.min(lastDepth, depth);
        }

        // ignore files and folders below the last collapsed folder
        if (lastDepth < depth) {
          continue;
        }

        list.push(fileOrFolder);
      }

      return list;
    }, [fileList, collapsedFolders]);

    const toggleCollapseState = (fullPath: string) => {
      setCollapsedFolders((prevSet) => {
        const newSet = new Set(prevSet);

        if (newSet.has(fullPath)) {
          newSet.delete(fullPath);
        } else {
          newSet.add(fullPath);
        }

        return newSet;
      });
    };

    return (
      <div className={classNames('text-sm', className, 'overflow-y-auto')}>
        {filteredFileList.map((fileOrFolder) => {
          return (
            <FileOrFolder
              key={fileOrFolder.id}
              fileOrFolder={fileOrFolder}
              rootFolder={rootFolder}
              selectedFile={selectedFile}
              unsavedFiles={unsavedFiles}
              fileHistory={fileHistory}
              onFileSelect={onFileSelect}
              allowFolderSelection={allowFolderSelection}
              collapsedFolders={collapsedFolders}
              toggleCollapseState={toggleCollapseState}
            />
          );
        })}
      </div>
    );
  },
);
FileTree.displayName = 'FileTree';

interface FileOrFolderProps {
  fileOrFolder: FileNode | FolderNode;
  rootFolder?: string;
  selectedFile?: string;
  unsavedFiles?: Set<string>;
  fileHistory?: Record<string, FileHistory>;
  onFileSelect?: (filePath: string) => void;
  allowFolderSelection?: boolean;
  collapsedFolders: Set<string>;
  toggleCollapseState: (fullPath: string) => void;
}

function FileOrFolder({
  fileOrFolder,
  selectedFile,
  unsavedFiles,
  fileHistory,
  onFileSelect,
  allowFolderSelection,
  collapsedFolders,
  toggleCollapseState,
}: FileOrFolderProps) {
  const onFileClick = useCallback(() => {
    onFileSelect?.(fileOrFolder.fullPath);
  }, [fileOrFolder.fullPath, onFileSelect]);

  const onFolderClick = useCallback(() => {
    toggleCollapseState(fileOrFolder.fullPath);
  }, [fileOrFolder.fullPath, toggleCollapseState]);

  switch (fileOrFolder.kind) {
    case 'file': {
      return (
        <File
          key={fileOrFolder.id}
          selected={selectedFile === fileOrFolder.fullPath}
          file={fileOrFolder}
          unsavedChanges={unsavedFiles?.has(fileOrFolder.fullPath)}
          fileHistory={fileHistory}
          onClick={onFileClick}
        />
      );
    }
    case 'folder': {
      return (
        <Folder
          key={fileOrFolder.id}
          folder={fileOrFolder}
          selected={allowFolderSelection && selectedFile === fileOrFolder.fullPath}
          collapsed={collapsedFolders.has(fileOrFolder.fullPath)}
          onClick={onFolderClick}
        />
      );
    }
    default: {
      return undefined;
    }
  }
}

interface FolderProps {
  folder: FolderNode;
  collapsed: boolean;
  selected?: boolean;
  onClick: () => void;
}

function Folder({ folder, collapsed, selected = false, onClick }: FolderProps) {
  return (
    <NodeButton
      className={classNames('group', {
        'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800': !selected,
        'bg-blue-600 text-white': selected,
      })}
      depth={folder.depth}
      icon={collapsed ? <CaretRightIcon /> : <CaretDownIcon />}
      onClick={onClick}
    >
      {folder.name}
    </NodeButton>
  );
}

interface FileProps {
  file: FileNode;
  selected: boolean;
  unsavedChanges?: boolean;
  fileHistory?: Record<string, FileHistory>;
  onClick: () => void;
}

function File({
  file: { depth, name, fullPath },
  onClick,
  selected,
  unsavedChanges = false,
  fileHistory = {},
}: FileProps) {
  const fileModifications = fileHistory[fullPath];

  // Calculate added and removed lines from the most recent changes
  const { additions, deletions } = useMemo(() => {
    if (!fileModifications?.originalContent) {
      return { additions: 0, deletions: 0 };
    }

    const normalizedOriginal = fileModifications.originalContent.replace(/\r\n/g, '\n');
    const normalizedCurrent =
      fileModifications.versions[fileModifications.versions.length - 1]?.content.replace(/\r\n/g, '\n') || '';

    if (normalizedOriginal === normalizedCurrent) {
      return { additions: 0, deletions: 0 };
    }

    const changes = diffLines(normalizedOriginal, normalizedCurrent, {
      newlineIsToken: false,
      ignoreWhitespace: true,
      ignoreCase: false,
    });

    return changes.reduce(
      (acc: { additions: number; deletions: number }, change: Change) => {
        if (change.added) {
          acc.additions += change.value.split('\n').length;
        }

        if (change.removed) {
          acc.deletions += change.value.split('\n').length;
        }

        return acc;
      },
      { additions: 0, deletions: 0 },
    );
  }, [fileModifications]);

  const showStats = additions > 0 || deletions > 0;

  return (
    <NodeButton
      className={classNames('group', {
        'bg-transparent hover:bg-slate-800 text-slate-400': !selected,
        'bg-blue-600 text-white': selected,
      })}
      depth={depth}
      icon={
        <FileIcon
          className={classNames({
            'group-hover:text-slate-200': !selected,
          })}
        />
      }
      onClick={onClick}
    >
      <div
        className={classNames('flex items-center', {
          'group-hover:text-slate-200': !selected,
        })}
      >
        <div className="flex-1 truncate pr-2">{name}</div>
        <div className="flex items-center gap-1">
          {showStats && (
            <div className="flex items-center gap-1 text-xs">
              {additions > 0 && <span className="text-green-500">+{additions}</span>}
              {deletions > 0 && <span className="text-red-500">-{deletions}</span>}
            </div>
          )}
          {unsavedChanges && <div className="size-1.5 rounded-full bg-orange-500" />}
        </div>
      </div>
    </NodeButton>
  );
}

interface ButtonProps {
  depth: number;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

function NodeButton({ depth, icon, onClick, className, children }: ButtonProps) {
  return (
    <button
      className={classNames(
        'flex items-center gap-1.5 w-full pr-2 border-2 border-transparent py-0.5',
        className,
      )}
      style={{ paddingLeft: `${6 + depth * NODE_PADDING_LEFT}px` }}
      onClick={() => onClick?.()}
    >
      <div className="shrink-0">{icon}</div>
      <div className="w-full truncate text-left">{children}</div>
    </button>
  );
}

type Node = FileNode | FolderNode;

interface BaseNode {
  id: number;
  depth: number;
  name: string;
  fullPath: string;
}

interface FileNode extends BaseNode {
  kind: 'file';
}

interface FolderNode extends BaseNode {
  kind: 'folder';
}

function buildFileList(
  files: FileMap,
  rootFolder = '/',
  hideRoot: boolean,
  hiddenFiles: Array<string | RegExp>,
): Node[] {
  const folderPaths = new Set<string>();
  const fileList: Node[] = [];

  let defaultDepth = 0;

  if (rootFolder === '/' && !hideRoot) {
    defaultDepth = 1;
    fileList.push({ kind: 'folder', name: '/', depth: 0, id: 0, fullPath: '/' });
  }

  for (const [filePath, dirent] of Object.entries(files)) {
    const segments = filePath.split('/').filter((segment) => segment);
    const fileName = segments.at(-1);

    if (!fileName || isHiddenFile(filePath, fileName, hiddenFiles)) {
      continue;
    }

    let currentPath = '';

    let i = 0;
    let depth = 0;

    while (i < segments.length) {
      const name = segments[i];
      const fullPath = (currentPath += `/${name}`);

      if (!fullPath.startsWith(rootFolder) || (hideRoot && fullPath === rootFolder)) {
        i++;
        continue;
      }

      if (i === segments.length - 1 && dirent?.type === 'file') {
        fileList.push({
          kind: 'file',
          id: fileList.length,
          name,
          fullPath,
          depth: depth + defaultDepth,
        });
      } else if (!folderPaths.has(fullPath)) {
        folderPaths.add(fullPath);

        fileList.push({
          kind: 'folder',
          id: fileList.length,
          name,
          fullPath,
          depth: depth + defaultDepth,
        });
      }

      i++;
      depth++;
    }
  }

  return sortFileList(rootFolder, fileList, hideRoot);
}

function isHiddenFile(filePath: string, fileName: string, hiddenFiles: Array<string | RegExp>) {
  return hiddenFiles.some((pathOrRegex) => {
    if (typeof pathOrRegex === 'string') {
      return fileName === pathOrRegex;
    }

    return pathOrRegex.test(filePath);
  });
}

function sortFileList(rootFolder: string, nodeList: Node[], hideRoot: boolean): Node[] {
  const nodeMap = new Map<string, Node>();
  const childrenMap = new Map<string, Node[]>();

  // pre-sort nodes by name and type
  nodeList.sort((a, b) => compareNodes(a, b));

  for (const node of nodeList) {
    nodeMap.set(node.fullPath, node);

    const parentPath = node.fullPath.slice(0, node.fullPath.lastIndexOf('/'));

    if (parentPath !== rootFolder.slice(0, rootFolder.lastIndexOf('/'))) {
      if (!childrenMap.has(parentPath)) {
        childrenMap.set(parentPath, []);
      }

      childrenMap.get(parentPath)?.push(node);
    }
  }

  const sortedList: Node[] = [];

  const depthFirstTraversal = (path: string): void => {
    const node = nodeMap.get(path);

    if (node) {
      sortedList.push(node);
    }

    const children = childrenMap.get(path);

    if (children) {
      for (const child of children) {
        if (child.kind === 'folder') {
          depthFirstTraversal(child.fullPath);
        } else {
          sortedList.push(child);
        }
      }
    }
  };

  if (hideRoot) {
    // if root is hidden, start traversal from its immediate children
    const rootChildren = childrenMap.get(rootFolder) || [];

    for (const child of rootChildren) {
      depthFirstTraversal(child.fullPath);
    }
  } else {
    depthFirstTraversal(rootFolder);
  }

  return sortedList;
}

function compareNodes(a: Node, b: Node): number {
  if (a.kind !== b.kind) {
    return a.kind === 'folder' ? -1 : 1;
  }

  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
}
