'use client';

import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Share, Save, RotateCcw } from "lucide-react";
import { AiChatPanel } from "@/components/Chat/AiChatPanel";
import { FileTree } from "@/components/FileTree/FileTree";
import { CodeEditor } from "@/components/Editor/CodeEditor";
import { MobilePreview } from "@/components/Preview/MobilePreview";
import type { GeneratedProject, GeneratedFile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useProject } from "@/lib/hooks/use-project";

export default function EditorPage() {
  const searchParams = useSearchParams();
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
      return {
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
  const [selection, setSelection] = useState<{
    projectKey?: string;
    path: string | null;
  }>({ projectKey: undefined, path: null });

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
      // Update file cache instantly + debounced DB sync
      updateFile(currentSelectedPath, value);
      // No need to track unsaved changes - instant sync!
    } else {
      // For local projects, use old manual save flow
      setEditedFiles(prev => {
        const newMap = new Map(prev);
        newMap.set(currentSelectedPath, value);
        return newMap;
      });
      setHasUnsavedChanges(true);
    }
  }, [currentSelectedPath, backendProject, projectId, updateFile]);

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
  }, [project, backendProject, editedFiles, updateFile]);

  const handleDiscardChanges = useCallback(() => {
    setEditedFiles(new Map());
    setHasUnsavedChanges(false);
  }, []);

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
    }
  }, [loadProject]);

  // Handle files changed by AI command
  const handleFilesChanged = useCallback(() => {
    if (backendProject) {
      refreshFiles();
    }
  }, [backendProject, refreshFiles]);

  // Reset edited files when project changes
  useEffect(() => {
    setEditedFiles(new Map());
    setHasUnsavedChanges(false);
  }, [backendProject?.id]);

  return (
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
          />
        </div>
        <div className="grid grid-cols-[260px_1fr] border-r border-slate-800 overflow-hidden">
          <FileTree
            key={projectKey}
            files={project?.files ?? []}
            onFileSelect={handleFileSelect}
            selectedFile={currentSelectedPath}
            editedFiles={new Set(editedFiles.keys())}
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
          <MobilePreview project={project} />
        </div>
      </div>
    </div>
  );
}
