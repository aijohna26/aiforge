import React, { useState, useEffect } from 'react';
import { Database, Mail, CreditCard, Search, Cpu, Sparkles, Bot, MessageSquare, Zap } from 'lucide-react';
import { IntegrationCard, IntegrationProps } from './IntegrationCard';
import { GeneratedProject } from '@/lib/types';

interface IntegrationsPanelProps {
    project: GeneratedProject | null;
    onUpdateFile: (path: string, content: string) => Promise<void>;
}

export function IntegrationsPanel({ project, onUpdateFile }: IntegrationsPanelProps) {
    const [connections, setConnections] = useState<Record<string, boolean>>({});
    const [settings, setSettings] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);

    // Load settings from database
    useEffect(() => {
        if (project?.id) {
            setIsLoading(true);
            fetch(`/api/projects/${project.id}/settings`, { cache: 'no-store' })
                .then(res => res.json())
                .then(data => {
                    const loadedSettings = data.settings || {};
                    setSettings(loadedSettings);

                    // Update connections state
                    const newConnections: Record<string, boolean> = {};
                    if (loadedSettings.integrations) {
                        Object.keys(loadedSettings.integrations).forEach(key => {
                            newConnections[key] = loadedSettings.integrations[key].connected;
                        });
                    }
                    setConnections(newConnections);
                })
                .catch(e => {
                    console.error('Failed to load settings:', e);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [project?.id]);

    const saveSettings = async (newSettings: any) => {
        if (!project?.id) return;

        setSettings(newSettings);

        try {
            await fetch(`/api/projects/${project.id}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: newSettings }),
            });
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    };

    const handleConnect = async (id: string, data: Record<string, string>) => {
        console.log(`Connecting ${id}:`, data);
        const newSettings = {
            ...settings,
            integrations: {
                ...settings.integrations,
                [id]: {
                    connected: true,
                    config: data
                }
            }
        };
        setConnections(prev => ({ ...prev, [id]: true }));
        await saveSettings(newSettings);
    };

    const handleDisconnect = async (id: string) => {
        console.log(`Disconnecting ${id}`);
        const newSettings = {
            ...settings,
            integrations: {
                ...settings.integrations,
                [id]: {
                    connected: false,
                    config: {}
                }
            }
        };
        setConnections(prev => ({ ...prev, [id]: false }));
        await saveSettings(newSettings);
    };

    const integrations: Omit<IntegrationProps, 'isConnected' | 'onConnect' | 'onDisconnect'>[] = [
        {
            id: 'supabase',
            name: 'Supabase',
            description: 'Sync up your app with robust and scalable database',
            icon: <Database size={24} />,
            fields: [
                { key: 'url', label: 'Project URL', type: 'text', placeholder: 'https://your-project.supabase.co' },
                { key: 'anonKey', label: 'Anon Key', type: 'password', placeholder: 'your-anon-key' },
            ]
        },
        {
            id: 'resend',
            name: 'Resend',
            description: 'Resend is a developer-friendly platform for sending, receiving, and managing transactional emails.',
            icon: <Mail size={24} />,
            fields: [
                { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 're_123...' },
            ]
        },
        {
            id: 'stripe',
            name: 'Stripe',
            description: 'Stripe is a platform that enables businesses to accept online payments and manage financial operations.',
            icon: <CreditCard size={24} />,
            fields: [
                { key: 'publishableKey', label: 'Stripe Publishable Key', type: 'text', placeholder: 'pk_test_...' },
                { key: 'secretKey', label: 'Stripe Secret Key', type: 'password', placeholder: 'sk_test_...' },
            ]
        },
        {
            id: 'perplexity',
            name: 'Perplexity',
            description: 'Perplexity is an AI-powered search engine that provides concise, accurate answers.',
            icon: <Search size={24} />,
            fields: [
                { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'pplx-...' },
            ]
        },
        {
            id: 'anthropic',
            name: 'Anthropic',
            description: 'Anthropic is an AI research company developing safe, interpretable, and value-aligned models like Claude.',
            icon: <Cpu size={24} />,
            fields: [
                { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...' },
            ]
        },
        {
            id: 'gemini',
            name: 'Gemini',
            description: 'Gemini is a family of AI models developed by Google, designed for versatile tasks.',
            icon: <Sparkles size={24} />,
            fields: [
                { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...' },
            ]
        },
        {
            id: 'openai',
            name: 'OpenAI',
            description: 'OpenAI offers cutting-edge AI models for various applications, including natural language processing.',
            icon: <Bot size={24} />,
            fields: [
                { key: 'apiKey', label: 'OpenAI API Key', type: 'password', placeholder: 'sk-...' },
            ]
        },
        {
            id: 'twilio',
            name: 'Twilio',
            description: 'Add professional SMS messaging capabilities to your app instantly.',
            icon: <MessageSquare size={24} />,
            fields: [
                { key: 'accountSid', label: 'Account SID', type: 'text', placeholder: 'AC...' },
                { key: 'authToken', label: 'Auth Token', type: 'password', placeholder: '...' },
            ]
        },
    ];

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h2 className="text-lg font-medium text-white">Connected Integrations</h2>
                <p className="text-sm text-gray-400">Manage your third-party services and API keys.</p>
            </div>

            <div className="space-y-4">
                {integrations.map((integration) => (
                    <IntegrationCard
                        key={integration.id}
                        {...integration}
                        isConnected={connections[integration.id] || false}
                        onConnect={(data) => handleConnect(integration.id, data)}
                        onDisconnect={() => handleDisconnect(integration.id)}
                    />
                ))}
            </div>
        </div>
    );
}
