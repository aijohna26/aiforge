'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Share, Save, RotateCcw, Eye, Settings } from "lucide-react";
import { SettingsModal } from "@/components/Settings/SettingsModal";
import { AiChatPanel } from "@/components/Chat/AiChatPanel";
import { FileTree } from "@/components/FileTree/FileTree";
import { CodeEditor } from "@/components/Editor/CodeEditor";
import { MobilePreview } from "@/components/Preview/MobilePreview";
import { DiffViewer } from "@/components/DiffViewer/DiffViewer";
import { writeFile } from "@/lib/webcontainer";
import { lockedFiles } from "@/lib/webcontainer/stores";
import type { GeneratedProject, GeneratedFile } from "@/lib/types";
import type { FileDiff } from "@/lib/hooks/use-ai-command";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/hooks/use-project";
import { fileCache } from "@/lib/file-cache";

export default function EditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlProjectId = searchParams.get('projectId');

  // Local in-memory project (for initial generation without persistence)
  const [localProject, setLocalProject] = useState<GeneratedProject | null>(null);

  // Persisted project from backend
  const {
    project: backendProject,
    loadProject,
    updateFile,
    refreshFiles,
    getFile,
    isPending,
    hasSnapshot,
    rollbackChanges,
  } = useProject();

  // Load project if projectId is in URL
  useEffect(() => {
    if (urlProjectId) {
      loadProject(urlProjectId);
    }
  }, [urlProjectId, loadProject]);

  // Use backend project if available, otherwise local
  const project = useMemo(() => {
    if (backendProject) {
      console.log('[EditorPage] Project memo recalculating, files count:', backendProject.files.length);
      console.log('[EditorPage] First file preview:', backendProject.files[0]?.content.substring(0, 100));
      return {
        id: backendProject.id,
        projectName: backendProject.name,
        description: backendProject.description || "",
        files: backendProject.files,
      } as GeneratedProject;
    }
    return localProject;
  }, [backendProject, localProject]);

  const projectId = backendProject?.id || null;

  const [editedFiles, setEditedFiles] = useState<Map<string, string>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [snapshotAvailable, setSnapshotAvailable] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diffFile, setDiffFile] = useState<{ path: string; before: string; after: string } | null>(null);
  const [selection, setSelection] = useState<{
    projectKey?: string;
    path: string | null;
  }>({ projectKey: undefined, path: null });
  const [recentDiffs, setRecentDiffs] = useState<Record<string, FileDiff>>({});
  const [previewVersion, setPreviewVersion] = useState(0);
  const previewSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [addedFiles, setAddedFiles] = useState<Set<string>>(new Set());
  const [modifiedFiles, setModifiedFiles] = useState<Set<string>>(new Set());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const schedulePreviewSync = useCallback(() => {
    if (previewSyncTimer.current) {
      clearTimeout(previewSyncTimer.current);
    }
    previewSyncTimer.current = setTimeout(() => {
      setPreviewVersion((v) => v + 1);
      previewSyncTimer.current = null;
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (previewSyncTimer.current) {
        clearTimeout(previewSyncTimer.current);
      }
    };
  }, []);

  const projectKey = project?.projectName ?? "no-project";
  const defaultFile = project?.files?.[0]?.path ?? null;

  const currentSelectedPath =
    selection.projectKey === projectKey
      ? selection.path ?? defaultFile
      : defaultFile;

  // Get file - from cache if backend project exists, otherwise from local state
  const activeFile = useMemo(() => {
    if (!currentSelectedPath || !project) return undefined;

    // For backend projects, try cache first (instant!), fallback to project state
    if (backendProject && projectId) {
      const cachedFile = getFile(currentSelectedPath);
      if (cachedFile) return cachedFile;
    }

    // For local projects or fallback, use project state
    const originalFile = project.files?.find((file) => file.path === currentSelectedPath);
    if (!originalFile) return undefined;

    const editedContent = editedFiles.get(currentSelectedPath);
    if (editedContent !== undefined) {
      return { ...originalFile, content: editedContent };
    }
    return originalFile;
  }, [project, currentSelectedPath, editedFiles, backendProject, projectId, getFile]);

  const handleFileSelect = (path: string) => {
    if (!project) return;
    setSelection({ projectKey, path });
  };

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (!currentSelectedPath || value === undefined) return;

    // OPTIMISTIC UPDATE: If backend project, update cache immediately (Bolt.diy style!)
    if (backendProject && projectId) {
      console.log('[EditorPage] Code changed for:', currentSelectedPath);
      // Update file cache instantly + debounced DB sync
      updateFile(currentSelectedPath, value);

      // Write directly to WebContainer for HMR (sub-20s updates)
      writeFile(currentSelectedPath, value).catch(err =>
        console.error('[EditorPage] Failed to write to WebContainer:', err)
      );

      // No need to schedulePreviewSync() as HMR handles it
      // No need to track unsaved changes - instant sync!
    } else {
      // For local projects, use old manual save flow
      setEditedFiles(prev => {
        const newMap = new Map(prev);
        newMap.set(currentSelectedPath, value);
        return newMap;
      });
      setHasUnsavedChanges(true);
      schedulePreviewSync();
    }
  }, [currentSelectedPath, backendProject, projectId, updateFile, schedulePreviewSync]);

  // Apply changes - save to backend if project exists, otherwise update local state
  const handleApplyChanges = useCallback(async () => {
    if (!project || editedFiles.size === 0) return;

    if (backendProject) {
      // Save each edited file to backend
      for (const [path, content] of editedFiles.entries()) {
        await updateFile(path, content);
      }
    } else {
      // Update local project state
      const updatedFiles = project.files.map((file): GeneratedFile => {
        const editedContent = editedFiles.get(file.path);
        if (editedContent !== undefined) {
          return { ...file, content: editedContent };
        }
        return file;
      });
      setLocalProject({ ...project, files: updatedFiles });
    }

    setEditedFiles(new Map());
    setHasUnsavedChanges(false);
    schedulePreviewSync();
  }, [project, backendProject, editedFiles, updateFile, schedulePreviewSync]);

  const handleDiscardChanges = useCallback(() => {
    setEditedFiles(new Map());
    setHasUnsavedChanges(false);
  }, []);

  const forcePreviewSync = useCallback(() => {
    setPreviewVersion((v) => v + 1);
  }, []);

  const handleShowManualDiff = useCallback(() => {
    if (!project || !currentSelectedPath) {
      alert('Select a file to view the diff.');
      return;
    }

    const originalFile = project.files.find((file) => file.path === currentSelectedPath);
    const editedContent = editedFiles.get(currentSelectedPath);

    if (!originalFile || editedContent === undefined) {
      alert('No pending edits for the selected file.');
      return;
    }

    setDiffFile({
      path: currentSelectedPath,
      before: originalFile.content,
      after: editedContent,
    });
    setShowDiff(true);
  }, [project, currentSelectedPath, editedFiles]);

  const handleRollback = useCallback(async () => {
    if (!backendProject) return;

    const confirmed = confirm(
      'Are you sure you want to undo all AI changes? This will restore the project to the state before the last AI edit.'
    );

    if (!confirmed) return;

    console.log('[EditorPage] Starting rollback...');
    // This is for the old global rollback - we'll need to update this to use snapshotId
    // const success = await rollbackChanges();
    // if (success) {
    //   setSnapshotAvailable(false); // Hide button after rollback
    //   console.log('[EditorPage] Rollback successful');
    //   alert('Successfully rolled back AI changes!');
    // } else {
    //   console.log('[EditorPage] No snapshot found for rollback');
    //   alert('No backup found to rollback to.');
    // }
  }, [backendProject]);

  // Per-message rollback handler for chat messages
  const handleChatRollback = useCallback(async (snapshotId: string) => {
    if (!backendProject) return;

    const confirmed = confirm(
      'Are you sure you want to undo these AI changes? This will restore the files to the state before this edit.'
    );

    if (!confirmed) return;

    console.log('[EditorPage] Starting rollback for snapshot:', snapshotId);
    const success = await rollbackChanges(snapshotId);
    if (success) {
      console.log('[EditorPage] Rollback successful');
      alert('Successfully rolled back changes!');
    } else {
      console.log('[EditorPage] Snapshot not found');
      alert('Could not rollback - snapshot not found.');
    }
  }, [backendProject, rollbackChanges]);

  const handleViewChanges = useCallback(() => {
    if (!projectId || !currentSelectedPath) return;

    // Get snapshot from cache
    const snapshot = fileCache.getSnapshot(projectId);
    if (!snapshot) {
      alert('No changes to view');
      return;
    }

    // Get before/after versions
    const snapshotData = (fileCache as any).snapshots.get(projectId);
    if (!snapshotData) return;

    const beforeFile = snapshotData.files.get(currentSelectedPath);
    const afterFile = getFile(currentSelectedPath);

    if (!beforeFile || !afterFile) {
      alert('Could not load file versions');
      return;
    }

    setDiffFile({
      path: currentSelectedPath,
      before: beforeFile.content,
      after: afterFile.content,
    });
    setShowDiff(true);
  }, [projectId, currentSelectedPath, getFile]);

  const hasManualDiff =
    currentSelectedPath !== null && editedFiles.has(currentSelectedPath);
  const hasAiDiff =
    currentSelectedPath !== null &&
    Boolean(recentDiffs[currentSelectedPath ?? ""]);

  const handleShowDiff = useCallback(() => {
    if (hasManualDiff) {
      handleShowManualDiff();
      return;
    }

    if (hasAiDiff && currentSelectedPath) {
      const diff = recentDiffs[currentSelectedPath];
      if (diff) {
        setDiffFile({
          path: diff.path,
          before: diff.before,
          after: diff.after,
        });
        setShowDiff(true);
        return;
      }
    }

    if (backendProject && snapshotAvailable) {
      handleViewChanges();
      return;
    }

    alert("No diffs available for the selected file.");
  }, [
    hasManualDiff,
    hasAiDiff,
    recentDiffs,
    currentSelectedPath,
    handleShowManualDiff,
    backendProject,
    snapshotAvailable,
    handleViewChanges,
  ]);

  const handleExport = useCallback(async () => {
    if (!projectId) {
      alert('Please save your project before exporting');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/export`);

      if (!response.ok) {
        throw new Error('Failed to export project');
      }

      // Download the ZIP file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.projectName || 'project'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export project');
    }
  }, [projectId, project?.projectName]);

  // Handle initial project generation
  const handleProjectGenerated = useCallback((newProject: GeneratedProject, projectId?: string | null) => {
    console.log('[EditorPage] Project generated:', { projectName: newProject.projectName, projectId });
    setLocalProject(newProject);
    setEditedFiles(new Map());
    setHasUnsavedChanges(false);
    setSelection({ projectKey: newProject.projectName, path: null });

    // If projectId was returned, load it from backend so we can use AI commands
    if (projectId) {
      console.log('[EditorPage] Loading persisted project:', projectId);
      loadProject(projectId);
      router.replace(`/editor?projectId=${projectId}`);
    }
  }, [loadProject, router]);

  // Handle files changed by AI command
  const handleFilesChanged = useCallback(async (filesCreated?: string[], diffs?: Record<string, FileDiff>) => {
    console.log('[EditorPage] handleFilesChanged called with:', filesCreated);
    if (!project) {
      console.log('[EditorPage] No project, skipping file sync');
      return;
    }

    try {
      // Fetch latest project data to get new content
      const [projectResponse, filesResponse] = await Promise.all([
        fetch(`/api/projects/${project.id}`, { cache: 'no-store' }).then(res => res.json()),
        fetch(`/api/projects/${project.id}/files`, { cache: 'no-store' }).then(res => res.json()),
      ]);
      const updatedProjectData = projectResponse.project ?? projectResponse;
      const latestFiles: GeneratedFile[] = filesResponse.files ?? [];

      console.log('[EditorPage] Fetched', latestFiles.length, 'files from backend');

      // Get FilesStore instance
      const { getFilesStore } = await import('@/lib/webcontainer');
      const filesStore = getFilesStore();

      // Write ALL files to WebContainer via FilesStore
      // This ensures complete sync and is more reliable than tracking individual changes
      console.log('[EditorPage] Syncing all files to WebContainer via FilesStore');

      for (const file of latestFiles) {
        await filesStore.saveFile(file.path, file.content);
      }

      console.log('[EditorPage] All files synced to WebContainer');
    } catch (error) {
      console.error('[EditorPage] Failed to sync files:', error);
    }

    // Update UI state
    if (backendProject) {
      await refreshFiles();
    } else {
      setLocalProject(updatedProjectData);
    }

    if (backendProject) {
      const snapshotExists = hasSnapshot();
      console.log('[EditorPage] Checking for snapshot:', snapshotExists);
      setSnapshotAvailable(snapshotExists);
    }

    // Track added and modified files
    if (filesCreated && filesCreated.length > 0) {
      const currentFiles = new Set(project.files.map(f => f.path) || []);
      const added = new Set<string>();
      const modified = new Set<string>();

      filesCreated.forEach(path => {
        if (currentFiles.has(path)) {
          modified.add(path);
        } else {
          added.add(path);
        }
      });

      setAddedFiles(added);
      setModifiedFiles(modified);

      // Clear badges after 10 seconds
      setTimeout(() => {
        setAddedFiles(new Set());
        setModifiedFiles(new Set());
      }, 10000);
    }
  }, [project, backendProject, refreshFiles, schedulePreviewSync, hasSnapshot, setSnapshotAvailable, setAddedFiles, setModifiedFiles]);

  // Reset edited files when project changes and check for snapshots
  useEffect(() => {
    setEditedFiles(new Map());
    setHasUnsavedChanges(false);

    // Check if snapshot exists when project loads
    if (backendProject) {
      const snapshotExists = hasSnapshot();
      console.log('[EditorPage] Project loaded, snapshot exists:', snapshotExists);
      setSnapshotAvailable(snapshotExists);
    }
  }, [backendProject?.id, hasSnapshot, backendProject]);

  // Ensure preview reloads after initial project load (e.g., page refresh)
  useEffect(() => {
    if (project) {
      console.log('[EditorPage] Project changed, scheduling preview sync');
      schedulePreviewSync();
    }
  }, [project?.id, schedulePreviewSync]);

  const handleCommandStart = useCallback(() => {
    if (!project) return;
    const allPaths = new Set(project.files.map(f => f.path));
    lockedFiles.set(allPaths);
  }, [project]);

  const handleCommandEnd = useCallback(() => {
    lockedFiles.set(new Set());
  }, []);

  return (
    <>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        project={project}
        onUpdateFile={updateFile}
      />
      {/* Diff Viewer Modal */}
      {showDiff && diffFile && (
        <DiffViewer
          fileName={diffFile.path}
          before={diffFile.before}
          after={diffFile.after}
          onClose={() => setShowDiff(false)}
        />
      )}

      <div className="flex h-screen flex-col bg-slate-950 text-white overflow-hidden">
        <header className="flex-shrink-0 flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="text-slate-400 hover:text-white"
            >
              ← Back
            </Button>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                AppForge AI
              </p>
              <h1 className="text-2xl font-bold text-white">
                {project?.projectName ?? "Editor"}
              </h1>
              {project?.description && (
                <p className="text-xs text-slate-400">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Unsaved changes indicator and actions */}
            {hasUnsavedChanges && (
              <>
                <span className="text-sm text-amber-400">
                  {editedFiles.size} unsaved change{editedFiles.size > 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardChanges}
                  className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <RotateCcw className="h-4 w-4" />
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyChanges}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  Apply Changes
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowDiff}
              disabled={
                !hasManualDiff &&
                !hasAiDiff &&
                !(backendProject && snapshotAvailable)
              }
              className="gap-2 border-blue-700 text-blue-400 hover:bg-blue-950/50 disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              Show Diff
            </Button>
            {backendProject && snapshotAvailable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRollback}
                className="gap-2 border-amber-700 text-amber-400 hover:bg-amber-950/50"
              >
                <RotateCcw className="h-4 w-4" />
                Undo AI Changes
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExport}
              disabled={!projectId}
            >
              <Download className="h-4 w-4" />
              Export Code
            </Button>
            <Button className="gap-2">
              <Share className="h-4 w-4" />
              Launch
            </Button>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-[320px_1fr_400px] overflow-hidden">
          <div className="overflow-hidden">
            <AiChatPanel
              projectId={projectId}
              onProjectGenerated={handleProjectGenerated}
              onFilesChanged={handleFilesChanged}
              onDiffAvailable={(diffs) => setRecentDiffs(diffs)}
              onRollback={handleChatRollback}
              onPreviewSyncRequested={forcePreviewSync}
              onCommandStart={handleCommandStart}
              onCommandEnd={handleCommandEnd}
            />
          </div>
          <div className="grid grid-cols-[260px_1fr] border-r border-slate-800 overflow-hidden">
            <FileTree
              key={projectKey}
              files={project?.files ?? []}
              onFileSelect={handleFileSelect}
              selectedFile={currentSelectedPath}
              editedFiles={new Set(editedFiles.keys())}
              addedFiles={addedFiles}
              modifiedFiles={modifiedFiles}
            />
            <div className="bg-slate-950 overflow-hidden">
              {activeFile ? (
                <CodeEditor
                  file={activeFile}
                  readOnly={false}
                  onChange={handleCodeChange}
                  isPending={projectId && currentSelectedPath ? isPending(currentSelectedPath) : false}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                  <p className="text-lg font-semibold">No file selected</p>
                  <p className="text-sm text-slate-400">
                    Generate an app and click a file from the tree to preview the
                    code.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="overflow-hidden">
            <MobilePreview project={project} previewVersion={previewVersion} />
          </div>
        </div>
      </div>
    </>
  );
}
