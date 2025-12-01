import React, { useState } from 'react';
import { X, Settings, Key, User, Smartphone, Share2, Database, Box, CreditCard, Search, MessageSquare, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegrationsPanel } from './IntegrationsPanel';
import { SecretsPanel } from './SecretsPanel';
import { AuthProvidersPanel } from './AuthProvidersPanel';
import { GeneratedProject } from '@/lib/types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: GeneratedProject | null;
    onUpdateFile: (path: string, content: string) => Promise<void>;
}

type SettingsTab = 'custom-instructions' | 'assets' | 'secrets' | 'auth-providers' | 'branding' | 'social-share' | 'integrations';

export function SettingsModal({ isOpen, onClose, project, onUpdateFile }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('integrations');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="flex h-[85vh] w-[90vw] max-w-6xl overflow-hidden rounded-xl bg-[#1e1e1e] shadow-2xl border border-[#333]">
                {/* Sidebar */}
                <div className="w-64 border-r border-[#333] bg-[#1a1a1a] flex flex-col">
                    <div className="p-4 border-b border-[#333]">
                        <h2 className="text-lg font-semibold text-white">Settings</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto py-4">
                        <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Settings</div>
                        <SidebarItem
                            icon={<MessageSquare size={16} />}
                            label="Custom Instructions"
                            isActive={activeTab === 'custom-instructions'}
                            onClick={() => setActiveTab('custom-instructions')}
                        />

                        <div className="mt-6 px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">General Settings</div>
                        <SidebarItem
                            icon={<Box size={16} />}
                            label="Assets"
                            isActive={activeTab === 'assets'}
                            onClick={() => setActiveTab('assets')}
                        />

                        <div className="mt-6 px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">API Settings</div>
                        <SidebarItem
                            icon={<Key size={16} />}
                            label="Secrets"
                            isActive={activeTab === 'secrets'}
                            onClick={() => setActiveTab('secrets')}
                        />
                        <SidebarItem
                            icon={<Database size={16} />}
                            label="Integrations"
                            isActive={activeTab === 'integrations'}
                            onClick={() => setActiveTab('integrations')}
                        />

                        <div className="mt-6 px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">User Auth Settings</div>
                        <SidebarItem
                            icon={<User size={16} />}
                            label="Auth Providers"
                            isActive={activeTab === 'auth-providers'}
                            onClick={() => setActiveTab('auth-providers')}
                        />

                        <div className="mt-6 px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile App Settings</div>
                        <SidebarItem
                            icon={<Smartphone size={16} />}
                            label="Branding & Icons"
                            isActive={activeTab === 'branding'}
                            onClick={() => setActiveTab('branding')}
                        />

                        <div className="mt-6 px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Share Settings</div>
                        <SidebarItem
                            icon={<Share2 size={16} />}
                            label="Social Share"
                            isActive={activeTab === 'social-share'}
                            onClick={() => setActiveTab('social-share')}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
                        <h1 className="text-xl font-semibold text-white">
                            {activeTab === 'integrations' ? 'Integrations' : activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </h1>
                        <Button variant="ghost" onClick={onClose} className="h-10 w-10 p-0 text-gray-400 hover:text-white hover:bg-[#333]">
                            <X size={20} />
                        </Button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'integrations' ? (
                            <IntegrationsPanel project={project} onUpdateFile={onUpdateFile} />
                        ) : activeTab === 'secrets' ? (
                            <SecretsPanel project={project} onUpdateFile={onUpdateFile} />
                        ) : activeTab === 'auth-providers' ? (
                            <AuthProvidersPanel project={project} onUpdateFile={onUpdateFile} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <Settings size={48} className="mb-4 opacity-20" />
                                <p>This section is under construction.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isActive
                ? 'bg-[#333] text-white border-r-2 border-blue-500'
                : 'text-gray-400 hover:bg-[#252525] hover:text-white'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
