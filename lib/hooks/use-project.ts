"use client";

import { useState, useCallback, useEffect } from "react";
import type { GeneratedFile } from "@/lib/types";
import { fileCache } from "@/lib/file-cache";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  files: GeneratedFile[];
  createdAt: string;
  updatedAt: string;
}

interface UseProjectReturn {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  loadProject: (projectId: string) => Promise<void>;
  listProjects: () => Promise<Project[]>;
  updateFile: (path: string, content: string) => Promise<void>;
  refreshFiles: () => Promise<void>;
  getFile: (path: string) => GeneratedFile | undefined;
  isPending: (path: string) => boolean;
  hasSnapshot: () => boolean;
  rollbackChanges: (snapshotId: string) => Promise<boolean>;
}

export function useProject(): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = useCallback(
    async (name: string, description?: string): Promise<Project | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create project");
        }

        const { project: newProject } = await res.json();

        // Load files for the new project
        const filesRes = await fetch(`/api/projects/${newProject.id}/files`);
        const { files } = await filesRes.json();

        const fullProject: Project = {
          id: newProject.id,
          name: newProject.name,
          description: newProject.description,
          files: files || [],
          createdAt: newProject.created_at,
          updatedAt: newProject.updated_at,
        };

        // Load into cache
        fileCache.loadProject(fullProject.id, fullProject.files);

        setProject(fullProject);
        return fullProject;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch project metadata
      const projectRes = await fetch(`/api/projects/${projectId}`);
      if (!projectRes.ok) {
        throw new Error("Project not found");
      }
      const { project: projectData } = await projectRes.json();

      // Fetch files with content from project_files table
      const filesRes = await fetch(`/api/projects/${projectId}/files`);
      const { files } = await filesRes.json();

      // Files now come with content already included
      const filesWithContent: GeneratedFile[] = (files || []).map((file: any) => ({
        path: file.path,
        content: file.content || "",
        language: file.language,
      }));

      const loadedProject = {
        id: projectData.id,
        name: projectData.name,
        description: projectData.description,
        files: filesWithContent,
        createdAt: projectData.created_at,
        updatedAt: projectData.updated_at,
      };

      // Load into cache for instant access
      fileCache.loadProject(projectId, filesWithContent);

      setProject(loadedProject);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listProjects = useCallback(async (): Promise<Project[]> => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return [];
      const { projects } = await res.json();
      return projects || [];
    } catch {
      return [];
    }
  }, []);

  const updateFile = useCallback(
    async (path: string, content: string) => {
      if (!project) return;

      // OPTIMISTIC UPDATE: Update cache immediately (Bolt.diy style!)
      const updatedFile: GeneratedFile = {
        path,
        content,
        language: path.split('.').pop() || 'typescript',
      };

      // Update cache with debounced database sync
      fileCache.setFile(project.id, updatedFile, async (file) => {
        // Background sync to database
        const res = await fetch(`/api/projects/${project.id}/files`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, content }),
        });

        if (!res.ok) {
          throw new Error("Failed to save file");
        }
      });

      // Update React state immediately
      setProject((prev) => {
        if (!prev) return prev;
        const updatedFiles = prev.files.map((f) =>
          f.path === path ? { ...f, content } : f
        );
        // Add file if it doesn't exist
        if (!updatedFiles.find((f) => f.path === path)) {
          updatedFiles.push({ path, content });
        }
        return { ...prev, files: updatedFiles };
      });
    },
    [project]
  );

  const refreshFiles = useCallback(async () => {
    if (!project) {
      console.log('[useProject] refreshFiles: No project');
      return;
    }

    console.log('[useProject] refreshFiles: Getting files from cache for project:', project.id);
    // Get latest files from cache (not database - cache is source of truth!)
    const cachedFiles = fileCache.getFiles(project.id);
    console.log('[useProject] refreshFiles: Got', cachedFiles.length, 'files from cache');

    // Create new array reference to trigger React re-renders
    const freshFiles = cachedFiles.map(f => ({ ...f }));

    setProject((prev) => {
      console.log('[useProject] refreshFiles: Updating project state with fresh files');
      return prev ? { ...prev, files: freshFiles } : prev;
    });
  }, [project]);

  // Get file from cache (instant read!)
  const getFile = useCallback(
    (path: string): GeneratedFile | undefined => {
      if (!project) return undefined;
      return fileCache.getFile(project.id, path);
    },
    [project]
  );

  // Check if file has pending database writes
  const isPending = useCallback(
    (path: string): boolean => {
      if (!project) return false;
      return fileCache.isPending(project.id, path);
    },
    [project]
  );

  // Check if snapshot exists (for rollback button)
  const hasSnapshot = useCallback((): boolean => {
    if (!project) return false;
    return fileCache.hasSnapshot(project.id);
  }, [project]);

  // Rollback to snapshot (undo AI changes)
  const rollbackChanges = useCallback(async (snapshotId: string): Promise<boolean> => {
    if (!project) return false;

    const success = fileCache.rollback(project.id, snapshotId, async (files) => {
      // Batch sync all restored files to database
      for (const file of files) {
        await fetch(`/api/projects/${project.id}/files/${file.path}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: file.content }),
        });
      }
    });

    if (success) {
      // Refresh project state to reflect rollback
      await refreshFiles();
    }

    return success;
  }, [project, refreshFiles]);

  // Cleanup cache when component unmounts
  useEffect(() => {
    return () => {
      if (project) {
        // Don't clear cache on unmount - keep it for fast navigation
        // fileCache.clearProject(project.id);
      }
    };
  }, [project]);

  return {
    project,
    isLoading,
    error,
    createProject,
    loadProject,
    listProjects,
    updateFile,
    refreshFiles,
    getFile,
    isPending,
    hasSnapshot,
    rollbackChanges,
  };
}
