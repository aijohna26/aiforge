'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles, Clock, Trash2, Loader2, CheckCircle2, Circle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletBalance } from '@/components/wallet-balance';

interface DesignSession {
    id: string;
    session_name: string;
    status: 'draft' | 'completed' | 'generating';
    current_stage: number;
    app_name: string;
    app_description: string | null;
    app_category: string | null;
    selected_package: string | null;
    package_cost: number | null;
    ai_config: {
        enabled: boolean;
        provider: string;
        model: string;
    } | null;
    logo_url: string | null;
    total_screens_generated: number;
    credits_used: number;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}

const STAGE_LABELS = [
    'Not Started',
    'App Info & Branding',
    'Style & References',
    'Logo Generation',
    'Key Screens',
    'Additional Screens',
    'Review & Generate',
];

const STATUS_CONFIG = {
    draft: {
        label: 'Draft',
        color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
        icon: Circle,
    },
    generating: {
        label: 'Generating',
        color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
        icon: Loader2,
    },
    completed: {
        label: 'Completed',
        color: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
        icon: CheckCircle2,
    },
};

export default function DesignSessionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<DesignSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/design-sessions');

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/');
                    return;
                }
                throw new Error('Failed to fetch design sessions');
            }

            const data = await response.json();
            setSessions(data.sessions || []);
        } catch (err) {
            console.error('Failed to fetch design sessions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load design sessions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewSession = () => {
        router.push('/wizard');
    };

    const handleResumeSession = (sessionId: string) => {
        router.push(`/wizard?sessionId=${sessionId}`);
    };

    const handleDeleteSession = async (sessionId: string, sessionName: string) => {
        if (!confirm(`Are you sure you want to delete "${sessionName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/design-sessions/${sessionId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete design session');
            }

            fetchSessions();
        } catch (err) {
            console.error('Failed to delete design session:', err);
            alert('Failed to delete design session');
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
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    const getProgressPercentage = (stage: number) => {
        return Math.round((stage / 6) * 100);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="mx-auto max-w-7xl px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                                AppForge AI
                            </p>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Design Sessions</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <WalletBalance />
                            <Button
                                onClick={handleNewSession}
                                className="gap-2 bg-blue-600 hover:bg-blue-700"
                                size="lg"
                            >
                                <Plus className="h-5 w-5" />
                                New Design Session
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
                    <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 text-center">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                        <Button
                            onClick={fetchSessions}
                            variant="outline"
                            className="mt-4"
                        >
                            Try Again
                        </Button>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-12 text-center">
                        <Sparkles className="mx-auto h-16 w-16 text-blue-500" />
                        <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
                            No design sessions yet
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Start your first design wizard session to create beautiful app mockups and assets
                        </p>
                        <Button
                            onClick={handleNewSession}
                            className="mt-6 gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Start Your First Design Session
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {sessions.map((session) => {
                            const StatusIcon = STATUS_CONFIG[session.status].icon;
                            const progressPercent = getProgressPercentage(session.current_stage);

                            return (
                                <div
                                    key={session.id}
                                    className="group relative rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden transition hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg"
                                >
                                    {/* Progress Bar */}
                                    <div className="h-1 bg-slate-100 dark:bg-slate-800">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>

                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="h-5 w-5 text-blue-500" />
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${STATUS_CONFIG[session.status].color}`}>
                                                        <StatusIcon className={`h-3 w-3 ${session.status === 'generating' ? 'animate-spin' : ''}`} />
                                                        {STATUS_CONFIG[session.status].label}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">
                                                    {session.app_name || session.session_name}
                                                </h3>
                                                {session.app_description && (
                                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                                        {session.app_description}
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(session.id, session.app_name || session.session_name);
                                                }}
                                                className="opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                                                title="Delete session"
                                            >
                                                <Trash2 className="h-4 w-4 text-slate-400" />
                                            </button>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-3 mb-4">
                                            {/* Stage Progress */}
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">Stage {session.current_stage}/6</span>
                                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                                    {STAGE_LABELS[session.current_stage] || 'Not Started'}
                                                </span>
                                            </div>

                                            {/* Category & Package */}
                                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                                {session.app_category && (
                                                    <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                                                        {session.app_category}
                                                    </span>
                                                )}
                                                {session.selected_package && (
                                                    <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                                                        {session.selected_package}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Assets */}
                                            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                                                {session.logo_url && (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                        Logo
                                                    </div>
                                                )}
                                                {session.total_screens_generated > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                        {session.total_screens_generated} screen{session.total_screens_generated !== 1 ? 's' : ''}
                                                    </div>
                                                )}
                                                {session.ai_config?.enabled && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-purple-500">🤖</span>
                                                        AI
                                                    </div>
                                                )}
                                            </div>

                                            {/* Credits */}
                                            {session.package_cost !== null && (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">Package Cost</span>
                                                    <span className="font-semibold text-slate-900 dark:text-white">
                                                        {session.package_cost} credits
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Clock className="h-3.5 w-3.5" />
                                                {formatDate(session.updated_at)}
                                            </div>

                                            <Button
                                                onClick={() => handleResumeSession(session.id)}
                                                size="sm"
                                                className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Play className="h-3.5 w-3.5" />
                                                {session.status === 'completed' ? 'View' : 'Resume'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
