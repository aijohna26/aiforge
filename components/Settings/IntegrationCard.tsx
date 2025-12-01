import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface IntegrationField {
    key: string;
    label: string;
    type: 'text' | 'password';
    placeholder?: string;
    description?: string;
}

export interface IntegrationProps {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    isConnected: boolean;
    fields: IntegrationField[];
    onConnect: (data: Record<string, string>) => void;
    onDisconnect: () => void;
}

export function IntegrationCard({
    name,
    description,
    icon,
    isConnected,
    fields,
    onConnect,
    onDisconnect
}: IntegrationProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    const handleConnect = () => {
        onConnect(formValues);
        setIsExpanded(false);
    };

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="mb-4 rounded-lg border border-[#333] bg-[#252525] overflow-hidden transition-all duration-200">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#2a2a2a]"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e1e1e] border border-[#333] text-gray-300">
                        {icon}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">{name}</h3>
                            {isConnected && (
                                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            )}
                        </div>
                        <p className="text-sm text-gray-400">{description}</p>
                    </div>
                </div>
                <div className="text-gray-500">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-[#333] bg-[#1e1e1e] p-4">
                    {isConnected ? (
                        <div className="space-y-4">
                            <div className="rounded-md bg-green-500/10 border border-green-500/20 p-3 flex items-center gap-2 text-green-400 text-sm">
                                <CheckCircle2 size={16} />
                                <span>Successfully connected to {name}</span>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDisconnect();
                                    }}
                                    className="bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20 font-semibold"
                                >
                                    Disconnect
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {fields.map((field) => (
                                <div key={field.key} className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">{field.label}</label>
                                    <div className="relative">
                                        <input
                                            type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                                            className="w-full rounded-md border border-[#333] bg-[#252525] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder={field.placeholder}
                                            value={formValues[field.key] || ''}
                                            onChange={(e) => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        />
                                        {field.type === 'password' && (
                                            <button
                                                type="button"
                                                onClick={() => toggleSecret(field.key)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                            >
                                                {showSecrets[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        )}
                                    </div>
                                    {field.description && (
                                        <p className="text-xs text-gray-500">{field.description}</p>
                                    )}
                                </div>
                            ))}

                            <div className="flex items-center justify-between pt-2">
                                <a href="#" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                    How to get {name} keys? <ExternalLink size={12} />
                                </a>
                                <Button
                                    onClick={handleConnect}
                                    variant="primary"
                                    className="bg-blue-600 text-white hover:bg-blue-500 font-semibold"
                                >
                                    Save & Connect
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
