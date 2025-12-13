'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Loader2, Plus, Folder, Clock, Trash2 } from 'lucide-react';

export default function AppBuildListPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<Id<'sessions'> | null>(null);

  // Get or create session - check localStorage on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('appforge_session_id');

    if (storedSessionId && storedSessionId.match(/^j[a-z0-9]+$/)) {
      // We have a valid session ID
      setSessionId(storedSessionId as Id<'sessions'>);
    } else {
      // No session yet, will create on first project creation
      localStorage.removeItem('appforge_session_id');
      setSessionId(null);
    }
  }, []);

  // Fetch projects for this session
  const projects = useQuery(
    api.projects.list,
    sessionId ? { sessionId } : 'skip'
  );

  const createProject = useMutation(api.projects.create);
  const createAnonymousSession = useMutation(api.sessions.createAnonymousSession);
  const deleteProject = useMutation(api.projects.deleteProject);

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      // Create session if we don't have one
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        activeSessionId = await createAnonymousSession();
        localStorage.setItem('appforge_session_id', activeSessionId);
        setSessionId(activeSessionId);
      }

      // Create the project
      const projectId = await createProject({
        sessionId: activeSessionId,
        name: `My Expo App ${new Date().toLocaleDateString()}`,
        description: 'A new Expo React Native project',
      });

      // Navigate to the editor
      router.push(`/appbuild/${projectId}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: Id<'chats'>) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject({ projectId });
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  // Show loading only while checking for session
  // If no sessionId, we'll show empty state with demo link
  const isLoading = sessionId === null ? false : projects === undefined;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
          <p className="mt-4 text-slate-400">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100">My Projects</h1>
              <p className="mt-2 text-sm text-slate-400">
                Build and manage your Expo React Native apps
              </p>
            </div>
            <button
              onClick={handleCreateProject}
              disabled={isCreating}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  New Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!projects || projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-700 bg-slate-900/50 py-16">
            <Folder className="h-16 w-16 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-300">No projects yet</h3>
            <p className="mt-2 text-sm text-slate-500">
              Get started by creating your first Expo app
            </p>
            <button
              onClick={handleCreateProject}
              disabled={isCreating}
              className="mt-6 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Project
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project._id}
                className="group relative overflow-hidden rounded-lg border border-slate-800 bg-slate-900 transition-all hover:border-slate-700 hover:shadow-lg"
              >
                <button
                  onClick={() => router.push(`/appbuild/${project._id}`)}
                  className="block w-full p-6 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-100 group-hover:text-blue-400">
                        {project.description || 'Untitled Project'}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(project.timestamp)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400">
                      Expo
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300">
                      React Native
                    </span>
                  </div>
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project._id);
                  }}
                  className="absolute right-4 top-4 rounded-lg bg-slate-800 p-2 opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4 text-slate-400 hover:text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demo project card */}
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Folder className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-100">Try the Demo</h3>
              <p className="mt-1 text-sm text-slate-400">
                Explore the code editor with a sample Expo app without creating a project
              </p>
              <button
                onClick={() => router.push('/appbuild/test')}
                className="mt-4 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600"
              >
                Open Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
