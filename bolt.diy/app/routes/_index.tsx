import { json, type MetaFunction } from '@remix-run/cloudflare';
import { Form, useNavigate } from '@remix-run/react';
import { useState, useEffect } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

export const meta: MetaFunction = () => {
  return [
    { title: 'AppForge AI - The Vibe Coding IDE' },
    { name: 'description', content: 'Build apps, games, tools, websites, UI, anything with AI.' }
  ];
};

export const loader = () => json({});

export default function LandingPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate(`/editor?prompt=${encodeURIComponent(prompt)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden relative selection:bg-purple-500/30">
      {/* Background Gradients/Grid */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-purple-500 opacity-20 blur-[100px]"></div>
        <div className="absolute right-0 top-0 -z-10 h-[300px] w-[300px] translate-x-1/2 translate-y-1/2 rounded-full bg-blue-500 opacity-20 blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder */}
          <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <div className="i-ph:lightning-duotone text-white text-xl" />
          </div>
          <span className="text-xl font-bold tracking-tight">AppForge</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors">Docs</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Enterprise</a>
        </div>

        <div className="flex items-center gap-4">
          <a href="/editor" className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block">
            Open Editor
          </a>
          <a href="/editor" className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all">
            Sign in
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-20 pb-32 px-6 text-center max-w-5xl mx-auto">

        {/* Badge */}
        {/* <div className="mb-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
          beta is now live
        </div> */}

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 pb-2">
          Production ready mobile apps in minutes
        </h1>

        {/* Subhead */}
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
          The best way to build <span className="text-blue-400">IOS</span> and <span className="text-purple-400">Android</span> apps with AI.
        </p>

        {/* Chat Input */}
        <div className="w-full max-w-3xl relative group glow-effect">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          <form onSubmit={handleSubmit} className="relative flex flex-col bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden focus-within:border-purple-500/50 focus-within:ring-1 focus-within:ring-purple-500/50 transition-all duration-300">
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
              className="w-full bg-transparent text-lg text-white placeholder-gray-500 px-6 py-5 min-h-[60px] max-h-[200px] outline-none resize-none"
              rows={1}
              style={{ minHeight: '80px' }}
            />

            <div className="flex items-center justify-between px-4 pb-4">
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="flex items-center justify-center p-2 rounded-lg bg-white/10 text-white hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white/10"
              >
                <div className="i-ph:arrow-up-bold text-lg" />
              </button>
            </div>
          </form>
        </div>

        {/* Footer/Trust signals */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          {/* Simple SVG Placeholders for logos */}
          <div className="flex items-center gap-2 text-white/50 font-semibold text-sm">
            <div className="i-ph:google-logo-bold text-xl" /> Google
          </div>
          <div className="flex items-center gap-2 text-white/50 font-semibold text-sm">
            <div className="i-ph:microsoft-logo-bold text-xl" /> Microsoft
          </div>
          <div className="flex items-center gap-2 text-white/50 font-semibold text-sm">
            <div className="i-ph:amazon-logo-bold text-xl" /> Amazon
          </div>
          <div className="flex items-center gap-2 text-white/50 font-semibold text-sm">
            <div className="i-ph:meta-logo-bold text-xl" /> Meta
          </div>
        </div>

      </main>
    </div>
  );
}
