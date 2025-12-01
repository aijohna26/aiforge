import React, { useState, useEffect } from 'react';
import { Shield, Mail, Github, Chrome, Apple, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeneratedProject } from '@/lib/types';

interface AuthProvidersPanelProps {
    project: GeneratedProject | null;
    onUpdateFile: (path: string, content: string) => Promise<void>;
}

interface AuthProvider {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    enabled: boolean;
}

interface AuthSolution {
    id: 'supabase' | 'clerk' | 'firebase';
    name: string;
    description: string;
    badge?: string;
    icon: React.ReactNode;
    providers: AuthProvider[];
}

export function AuthProvidersPanel({ project, onUpdateFile }: AuthProvidersPanelProps) {
    const [selectedSolution, setSelectedSolution] = useState<'supabase' | 'clerk' | 'firebase'>('supabase');
    const [providers, setProviders] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);

    const authSolutions: AuthSolution[] = [
        {
            id: 'supabase',
            name: 'Supabase Auth',
            description: 'Built-in authentication with your Supabase database. Includes email, magic links, and OAuth providers.',
            badge: 'Recommended',
            icon: <Shield size={24} />,
            providers: [
                { id: 'email', name: 'Email & Password', description: 'Traditional email/password authentication', icon: <Mail size={18} />, enabled: true },
                { id: 'magic-link', name: 'Magic Link', description: 'Passwordless authentication via email', icon: <Mail size={18} />, enabled: false },
                { id: 'google', name: 'Google OAuth', description: 'Sign in with Google account', icon: <Chrome size={18} />, enabled: false },
                { id: 'github', name: 'GitHub OAuth', description: 'Sign in with GitHub account', icon: <Github size={18} />, enabled: false },
                { id: 'apple', name: 'Apple Sign In', description: 'Sign in with Apple (required for iOS App Store)', icon: <Apple size={18} />, enabled: false },
            ]
        },
        {
            id: 'clerk',
            name: 'Clerk',
            description: 'Premium authentication with beautiful pre-built UI components, user management dashboard, and advanced features.',
            icon: <Shield size={24} />,
            providers: [
                { id: 'email', name: 'Email & Password', description: 'Email/password with built-in verification', icon: <Mail size={18} />, enabled: true },
                { id: 'google', name: 'Google OAuth', description: 'Sign in with Google', icon: <Chrome size={18} />, enabled: false },
                { id: 'github', name: 'GitHub OAuth', description: 'Sign in with GitHub', icon: <Github size={18} />, enabled: false },
                { id: 'apple', name: 'Apple Sign In', description: 'Sign in with Apple', icon: <Apple size={18} />, enabled: false },
            ]
        },
        {
            id: 'firebase',
            name: 'Firebase Auth',
            description: 'Google\'s authentication service with generous free tier and wide range of OAuth providers.',
            icon: <Shield size={24} />,
            providers: [
                { id: 'email', name: 'Email & Password', description: 'Email/password authentication', icon: <Mail size={18} />, enabled: true },
                { id: 'google', name: 'Google OAuth', description: 'Sign in with Google', icon: <Chrome size={18} />, enabled: false },
                { id: 'github', name: 'GitHub OAuth', description: 'Sign in with GitHub', icon: <Github size={18} />, enabled: false },
                { id: 'apple', name: 'Apple Sign In', description: 'Sign in with Apple', icon: <Apple size={18} />, enabled: false },
            ]
        }
    ];

    // Load auth settings from database
    useEffect(() => {
        if (project?.id) {
            setIsLoading(true);
            fetch(`/api/projects/${project.id}/settings`, { cache: 'no-store' })
                .then(res => res.json())
                .then(data => {
                    const loadedSettings = data.settings || {};
                    const authSettings = loadedSettings.auth || {};

                    setSelectedSolution(authSettings.solution || 'supabase');
                    setProviders(authSettings.providers || { email: true });
                })
                .catch(e => {
                    console.error('Failed to load auth settings:', e);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [project?.id]);

    const handleSolutionChange = async (solution: 'supabase' | 'clerk' | 'firebase') => {
        setSelectedSolution(solution);
        await saveSettings(solution, providers);
    };

    const handleProviderToggle = async (providerId: string) => {
        const newProviders = { ...providers, [providerId]: !providers[providerId] };
        setProviders(newProviders);
        await saveSettings(selectedSolution, newProviders);
    };

    const saveSettings = async (solution: string, providerSettings: Record<string, boolean>) => {
        if (!project?.id) return;

        try {
            const response = await fetch(`/api/projects/${project.id}/settings`, { cache: 'no-store' });
            const data = await response.json();
            const currentSettings = data.settings || {};

            await fetch(`/api/projects/${project.id}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    settings: {
                        ...currentSettings,
                        auth: {
                            solution,
                            providers: providerSettings
                        }
                    }
                }),
            });
        } catch (e) {
            console.error('Failed to save auth settings:', e);
        }
    };

    const currentSolution = authSolutions.find(s => s.id === selectedSolution);

    return (
        <div className="space-y-8">
            {/* Auth Solution Selection */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Authentication Solution</h2>
                    <p className="text-sm text-gray-400">Choose how users will authenticate in your app.</p>
                </div>

                <div className="space-y-3">
                    {authSolutions.map((solution) => (
                        <div
                            key={solution.id}
                            onClick={() => handleSolutionChange(solution.id)}
                            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedSolution === solution.id
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-[#333] bg-[#1e1e1e] hover:border-[#444]'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${selectedSolution === solution.id ? 'bg-blue-500/20 text-blue-400' : 'bg-[#252525] text-gray-400'
                                    }`}>
                                    {solution.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-white">{solution.name}</h3>
                                        {solution.badge && (
                                            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full">
                                                {solution.badge}
                                            </span>
                                        )}
                                        {selectedSolution === solution.id && (
                                            <CheckCircle2 size={18} className="text-blue-400 ml-auto" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-400">{solution.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Provider Configuration */}
            {currentSolution && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Authentication Providers</h2>
                        <p className="text-sm text-gray-400">Enable the sign-in methods you want to offer to your users.</p>
                    </div>

                    <div className="space-y-3">
                        {currentSolution.providers.map((provider) => (
                            <div
                                key={provider.id}
                                className="flex items-center justify-between p-4 rounded-lg border border-[#333] bg-[#1e1e1e] hover:bg-[#252525] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#252525] text-gray-400">
                                        {provider.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white">{provider.name}</h4>
                                        <p className="text-sm text-gray-400">{provider.description}</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={providers[provider.id] || false}
                                        onChange={() => handleProviderToggle(provider.id)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[#333] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>

                    {/* Info Box */}
                    <div className="flex gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <AlertCircle size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-300">
                            <p className="font-semibold mb-1">Configuration Required</p>
                            <p className="text-blue-400/80">
                                {selectedSolution === 'supabase' && 'Configure OAuth providers in your Supabase dashboard under Authentication → Providers.'}
                                {selectedSolution === 'clerk' && 'You\'ll need to add your Clerk API keys in the Integrations section and configure providers in the Clerk dashboard.'}
                                {selectedSolution === 'firebase' && 'You\'ll need to add your Firebase config in the Integrations section and enable providers in the Firebase console.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
