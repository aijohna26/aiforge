import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate, Link } from '@remix-run/react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import { createClient as createServerClient } from '~/lib/supabase/server';
import { createClient as createBrowserClient } from '~/lib/supabase/browser';
import { themeStore, toggleTheme } from '~/lib/stores/theme';
import { classNames } from '~/utils/classNames';

interface Project {
  id: string;
  name: string;
  description: string;
  data?: any;
  status: string;
  created_at: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const headers = new Headers();
  const supabase = createServerClient(request, headers);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ projects: [], user: null });
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Loader error:', error);
  }

  return json({ projects: projects || [], user }, { headers });
}

export default function Dashboard() {
  const { projects: initialProjects, user } = useLoaderData<{ projects: Project[]; user: any }>();
  const [projects, setProjects] = useState<Project[]>(initialProjects as Project[]);
  const navigate = useNavigate();
  const theme = useStore(themeStore);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const supabase = useMemo(() => createBrowserClient(), []);

  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptInput, setPromptInput] = useState('');

  // Handle initial prompt from landing page if it exists
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('bolt_seed_prompt')) {
      console.log('[Dashboard] Found seed prompt, redirecting to chat (design mode)');
      navigate('/chat');
    }
  }, [navigate]);

  const handleCreateNew = () => {
    setIsCreating(true);

    // Clear both possible wizard states
    localStorage.removeItem('appforge_wizard_state');
    localStorage.removeItem('appforge_design_wizard_state');
    localStorage.removeItem('bolt_seed_prompt'); // Clear any pending seed prompts

    // Reset in-memory store as well
    import('~/lib/stores/designWizard').then((m) => m.resetDesignWizard());
    import('~/lib/stores/plan').then((m) => m.resetPlan());

    setIsPromptModalOpen(true);
    setIsCreating(false);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!promptInput.trim()) {
      return;
    }

    localStorage.setItem('bolt_seed_prompt', promptInput.trim());
    setIsPromptModalOpen(false);
    navigate('/chat');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      const response = await fetch('/api/delete-project', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        toast.success('Project deleted');
      } else {
        toast.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Error deleting project');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#080808] text-gray-900 dark:text-white transition-colors duration-500 overflow-x-hidden relative">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-500/10 dark:bg-purple-500/10 blur-[120px] rounded-full animate-pulse-glow" />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 dark:bg-blue-500/10 blur-[120px] rounded-full animate-pulse-glow"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Prompt Modal */}
      <AnimatePresence>
        {isPromptModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPromptModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#111] rounded-[40px] border border-gray-100 dark:border-white/5 shadow-2xl overflow-hidden p-10"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2 uppercase">Craft New Forge</h2>
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Initialization Protocol Engaged
                </p>
              </div>

              <form onSubmit={handlePromptSubmit} className="relative group glow-effect">
                <div className="absolute -inset-1 bg-gradient-to-r from-accent-500 to-orange-400 dark:from-purple-600 dark:to-blue-600 rounded-2xl opacity-10 dark:opacity-20 blur-lg animate-pulse-glow group-hover:opacity-20 dark:group-hover:opacity-40 transition duration-500"></div>
                <div className="relative flex flex-col bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden focus-within:border-accent-500/50 focus-within:ring-1 focus-within:ring-accent-500/50 transition-all duration-300">
                  <textarea
                    autoFocus
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePromptSubmit(e);
                      }
                    }}
                    placeholder="Tell me about the app you want to build"
                    className="w-full bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-500 px-6 py-5 min-h-[120px] outline-none resize-none font-medium"
                  />

                  <div className="flex items-center justify-between px-4 pb-4">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
                      Press Enter to Initialize
                    </div>
                    <button
                      type="submit"
                      disabled={!promptInput.trim()}
                      className="flex items-center justify-center size-10 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-accent-500 dark:hover:bg-accent-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      <div className="i-ph:arrow-up-bold text-lg" />
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-accent-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/20">
            <div className="i-ph:lightning-duotone text-white text-2xl" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic">AppForge</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            to="/chat"
            className="text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Editor
          </Link>

          <button
            onClick={toggleTheme}
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 dark:hover:text-white focus:outline-none"
          >
            {theme === 'dark' ? (
              <div className="i-ph:sun-bold text-lg group-hover:rotate-90 transition-transform duration-500" />
            ) : (
              <div className="i-ph:moon-bold text-lg group-hover:-rotate-12 transition-transform duration-500" />
            )}
          </button>

          <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-500/10 flex items-center justify-center border border-accent-500/20">
                <span className="text-xs font-black text-accent-600 dark:text-purple-400">
                  {user?.email?.[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-bold truncate max-w-[150px] hidden sm:block">{user?.email}</span>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <div className="i-ph:sign-out-bold text-lg" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
              Your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-500 to-orange-500">
                Forge
              </span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl font-medium">
              Industrializing ideas into production-ready mobile applications.
            </p>
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateNew}
            disabled={isCreating}
            className="group relative px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-3xl font-black text-lg shadow-2xl shadow-gray-500/20 dark:shadow-white/10 overflow-hidden flex items-center gap-4 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative z-10">Initialize New Project</span>
            <div className="relative z-10 i-ph:plus-bold text-xl group-hover:rotate-90 transition-transform duration-500" />
          </motion.button>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full py-32 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-white/[0.02] rounded-[40px] border border-gray-100 dark:border-white/[0.05] border-dashed"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                <div className="i-ph:cube-duotone text-gray-300 dark:text-gray-700 text-4xl" />
              </div>
              <h3 className="text-2xl font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-tight">
                Empty Forge
              </h3>
              <p className="text-gray-400 dark:text-gray-600 mb-8 max-w-xs font-bold uppercase text-[10px] tracking-[0.2em]">
                No projects discovered in your workshop yet.
              </p>
              <Button
                onClick={handleCreateNew}
                className="bg-accent-500 text-white font-black px-8 py-4 rounded-2xl scale-110"
              >
                Craft First App
              </Button>
            </motion.div>
          ) : (
            projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                navigate={navigate}
                onDelete={() => handleDeleteProject(project.id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  navigate,
  onDelete,
}: {
  project: Project;
  index: number;
  navigate: any;
  onDelete: () => void;
}) {
  const logoUrl = project.data?.step3?.logo?.url;
  const displayLogoUrl = logoUrl
    ? logoUrl.startsWith('http')
      ? `/api/image-proxy?url=${encodeURIComponent(logoUrl)}`
      : logoUrl
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group relative bg-white dark:bg-[#111] border border-gray-100 dark:border-white/[0.05] rounded-[40px] p-8 cursor-pointer transition-all duration-300 hover:shadow-[0_32px_80px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_32px_80px_rgba(0,0,0,0.4)] hover:border-accent-500/30 overflow-hidden"
      onClick={() => navigate(`/chat/${project.id}`)}
    >
      {/* Gloss Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-start justify-between mb-8">
          <div className="w-16 h-16 rounded-[24px] bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center overflow-hidden border border-gray-100 dark:border-white/10 group-hover:scale-110 transition-transform duration-500">
            {displayLogoUrl ? (
              <img src={displayLogoUrl} alt={project.name} className="w-full h-full object-cover" />
            ) : (
              <div className="i-ph:cube-duotone text-gray-400 dark:text-gray-500 text-3xl" />
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-500/20"
              title="Delete Forge"
            >
              <div className="i-ph:trash-bold text-sm" />
            </button>
            <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-wider border border-green-500/20">
              {project.status || 'Active'}
            </div>
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter group-hover:text-accent-500 transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-bold uppercase text-[9px] tracking-[0.1em] mb-8">
          {project.data?.step1?.category || 'General App'}
        </p>

        <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/[0.05]">
          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <div className="i-ph:git-branch-bold text-sm" /> main
          </span>
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-accent-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
            <div className="i-ph:arrow-right-bold text-sm" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Button({ children, className, ...props }: any) {
  return (
    <button
      className={classNames(
        'px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
