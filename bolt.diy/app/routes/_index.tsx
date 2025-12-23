import { json, redirect, type MetaFunction, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Form, useNavigate, useSearchParams } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { useStore } from '@nanostores/react';
import { toast } from 'react-toastify';
import { themeStore, toggleTheme } from '~/lib/stores/theme';
import { AuthModal } from '~/components/auth/AuthModal';
import { createClient } from '~/lib/supabase/server';

export const meta: MetaFunction = () => {
  return [
    { title: 'AppForge AI - The Vibe Coding IDE' },
    { name: 'description', content: 'Build apps, games, tools, websites, UI, anything with AI.' }
  ];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const headers = new Headers();
  const supabase = createClient(request, headers);
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return redirect('/dashboard', { headers });
  }

  return json({});
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useStore(themeStore);
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  useEffect(() => {
    const isAuthRequest = searchParams.get('auth') === 'true';
    const isAuthError = searchParams.get('auth_error') === 'true';

    if (isAuthRequest || isAuthError) {
      setIsAuthModalOpen(true);

      // Check for error descriptions in the hash (Supabase often puts them there)
      const hash = window.location.hash;
      if (hash && hash.includes('error_description')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const errorDesc = hashParams.get('error_description');
        if (errorDesc) {
          toast.error(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
        }
      } else if (isAuthError) {
        toast.error('Authentication failed. Please try again.');
      }
    }
  }, [searchParams]);

  // Simple background effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.getElementsByClassName('glow-effect');
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleAuth = () => {
    if (prompt.trim()) {
      localStorage.setItem('bolt_seed_prompt', prompt.trim());
    }
    setIsAuthModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuth();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-gray-900 dark:text-white transition-colors duration-300 overflow-hidden relative selection:bg-accent-500/30 selection:text-white">
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Background Gradients/Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-accent-500 dark:bg-purple-500 opacity-20 blur-[100px] animate-pulse-glow"></div>
        <div className="absolute right-0 top-0 -z-10 h-[300px] w-[300px] translate-x-1/2 translate-y-1/2 rounded-full bg-orange-400 dark:bg-blue-500 opacity-20 blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder */}
          <div className="w-8 h-8 bg-gradient-to-tr from-accent-500 to-orange-400 dark:from-purple-500 dark:to-blue-500 rounded-lg flex items-center justify-center">
            <div className="i-ph:lightning-duotone text-white text-xl" />
          </div>
          <span className="text-xl font-bold tracking-tight">AppForge</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
          <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Docs</a>
          <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Enterprise</a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 bg-transparent hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <div className="i-ph:sun-bold text-lg group-hover:rotate-90 transition-transform duration-500" />
            ) : (
              <div className="i-ph:moon-bold text-lg group-hover:-rotate-12 transition-transform duration-500" />
            )}
          </button>
          <button
            onClick={handleAuth}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all hidden sm:block"
          >
            Open Editor
          </button>
          <button
            onClick={handleAuth}
            className="px-4 py-2 text-sm font-medium bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 border border-black/5 dark:border-white/10 rounded-lg transition-all"
          >
            Start Building
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-500 dark:from-white dark:to-white/60 pb-2 leading-tight">
          Production ready mobile apps in minutes <br className="sm:hidden" />
          <span className="relative inline-block ml-2 group">
            <span className="relative z-10 text-gray-400/50 dark:text-white/30 italic">not months</span>
            <span className="absolute left-[-5%] top-[50%] w-[110%] h-[4px] bg-red-500/80 rounded-full -rotate-3 transition-transform duration-500 group-hover:rotate-1 group-hover:scale-x-110 origin-center z-20 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></span>
            <span className="absolute left-[-2%] top-[48%] w-[105%] h-[2px] bg-red-600/60 rounded-full rotate-2 transition-transform duration-700 group-hover:-rotate-2 group-hover:scale-x-105 origin-center z-20"></span>
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mb-12 leading-relaxed">
          The best way to build <span className="text-blue-600 dark:text-blue-400">IOS</span> and <span className="text-accent-600 dark:text-purple-400">Android</span> apps with AI.
        </p>

        {/* Chat Input */}
        <div className="w-full max-w-3xl relative group glow-effect">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-500 to-orange-400 dark:from-purple-600 dark:to-blue-600 rounded-2xl opacity-10 dark:opacity-20 blur-lg animate-pulse-glow group-hover:opacity-20 dark:group-hover:opacity-40 transition duration-500"></div>
          <form onSubmit={handleSubmit} className="relative flex flex-col bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden focus-within:border-accent-500/50 dark:focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-accent-500/50 dark:focus-within:ring-purple-500/50 transition-all duration-300">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Tell me about the app you want to build"
              className="w-full bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-500 px-6 py-5 min-h-[60px] max-h-[200px] outline-none resize-none"
              rows={1}
              style={{ minHeight: '80px' }}
            />

            <div className="flex items-center justify-between px-4 pb-4">
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="flex items-center justify-center p-2 rounded-lg bg-orange-500 text-white dark:bg-white/10 dark:text-white hover:bg-orange-600 dark:hover:bg-purple-500 dark:hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-orange-500 dark:disabled:hover:bg-white/10"
              >
                <div className="i-ph:arrow-up-bold text-lg" />
              </button>
            </div>
          </form>
        </div>

        {/* Footer/Trust signals */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Simple SVG Placeholders for logos */}
          <div className="flex items-center gap-2 text-gray-900 dark:text-white/50 font-semibold text-sm">
            <div className="i-ph:google-logo-bold text-xl" /> Google
          </div>
          <div className="flex items-center gap-2 text-gray-900 dark:text-white/50 font-semibold text-sm">
            <div className="i-ph:microsoft-logo-bold text-xl" /> Microsoft
          </div>
          <div className="flex items-center gap-2 text-gray-900 dark:text-white/50 font-semibold text-sm">
            <div className="i-ph:amazon-logo-bold text-xl" /> Amazon
          </div>
          <div className="flex items-center gap-2 text-gray-900 dark:text-white/50 font-semibold text-sm">
            <div className="i-ph:meta-logo-bold text-xl" /> Meta
          </div>
        </div>

      </main>
    </div>
  );
}
