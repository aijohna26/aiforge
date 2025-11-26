'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Folder, Clock, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletBalance } from '@/components/wallet-balance';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects');

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - redirect to home
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewProject = () => {
    router.push('/editor');
  };

  const handleOpenProject = (projectId: string) => {
    router.push(`/editor?projectId=${projectId}`);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Refresh projects list
      fetchProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                AppForge AI
              </p>
              <h1 className="text-3xl font-bold text-white">Your Projects</h1>
            </div>
            <div className="flex items-center gap-4">
              <WalletBalance />
              <Button
                onClick={handleNewProject}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-6 text-center">
            <p className="text-red-400">{error}</p>
            <Button
              onClick={fetchProjects}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-12 text-center">
            <Folder className="mx-auto h-16 w-16 text-slate-600" />
            <h2 className="mt-4 text-xl font-semibold text-white">
              No projects yet
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Get started by creating your first mobile app with AI
            </p>
            <Button
              onClick={handleNewProject}
              className="mt-6 gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative rounded-lg border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700 hover:bg-slate-900 cursor-pointer"
                onClick={() => handleOpenProject(project.id)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <Folder className="h-8 w-8 text-blue-500" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    className="opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                    title="Delete project"
                  >
                    <Trash2 className="h-4 w-4 text-slate-500" />
                  </button>
                </div>

                <h3 className="text-lg font-semibold text-white line-clamp-1">
                  {project.name}
                </h3>

                {project.description && (
                  <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(project.updated_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
