'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/dashboard");
      }
    };
    checkAuth();
  }, [router]);

  const handleBuild = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Header with auth links */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <span className="text-lg font-bold">AppForge</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Sign In
            </Link>
            <Link href="/login?signup=true">
              <Button size="sm" className="gap-2">
                Sign Up
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-200">
            <Sparkles className="h-3 w-3 text-blue-300" />
            Phase 1 · Monaco Editor Ready
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Build mobile apps with AI, faster.
          </h1>
          <p className="text-lg text-slate-300">
            AppForge turns one prompt into working mobile app projects. Describe
            the experience, watch the files populate, and ship with confidence.
          </p>
          <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2">
            <ValuePill title="Stability first" description="Battle-tested tech stack" />
            <ValuePill title="Free tier" description="Preview builds before paying" />
            <ValuePill
              title="One editor forever"
              description="Pro editing experience from day one"
            />
            <ValuePill
              title="Deployment ready"
              description="Guided export for iOS & Android"
            />
          </div>
        </div>

        <div className="flex-1 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-blue-500/20 backdrop-blur">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-200">
              Describe your app
            </label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ex: Build a habit tracker with streaks, offline mode, and push reminders."
              rows={6}
              className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
            />
            <p className="text-xs text-slate-400">
              Press Enter or click build to start. AI will generate Expo code,
              populate the file tree, and show the preview instructions.
            </p>
            <Button onClick={handleBuild} className="w-full gap-2" size="lg">
              Launch the builder
              <ArrowRight className="h-4 w-4" />
            </Button>
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4 text-sm text-slate-300">
              <div className="flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Phase 1 Success Criteria
              </div>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li>✓ AI chat with instant responses</li>
                <li>✓ Code viewer with copy & download</li>
                <li>✓ File tree + mobile preview frame</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <section className="border-t border-white/5 bg-black/30 px-4 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1 text-xs tracking-[0.2em] text-slate-300">
            <Zap className="h-3 w-3" />
            Build now
          </p>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Prompt → Build → Preview → Deploy
          </h2>
          <p className="mt-4 text-base text-slate-400">
            AppForge pairs AI generation with a dedicated workspace so you can
            iterate on mobile concepts, review the files, and prepare the build
            without exposing your playbook.
          </p>
        </div>
      </section>
    </div>
  );
}

interface ValuePillProps {
  title: string;
  description: string;
}

function ValuePill({ title, description }: ValuePillProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );
}
