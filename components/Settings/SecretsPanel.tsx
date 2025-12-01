import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeneratedProject } from '@/lib/types';

interface SecretsPanelProps {
    project: GeneratedProject | null;
    onUpdateFile: (path: string, content: string) => Promise<void>;
}

interface Secret {
    name: string;
    value: string;
    createdAt: string;
}

export function SecretsPanel({ project, onUpdateFile }: SecretsPanelProps) {
    const [secrets, setSecrets] = useState<Secret[]>([]);
    const [newSecrets, setNewSecrets] = useState<Array<{ name: string; value: string }>>([{ name: '', value: '' }]);
    const [isLoading, setIsLoading] = useState(false);

    // Load secrets from database
    useEffect(() => {
        if (project?.id) {
            setIsLoading(true);
            fetch(`/api/projects/${project.id}/settings`, { cache: 'no-store' })
                .then(res => res.json())
                .then(data => {
                    const loadedSettings = data.settings || {};
                    setSecrets(loadedSettings.secrets || []);
                })
                .catch(e => {
                    console.error('Failed to load secrets:', e);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [project?.id]);

    const handleAddAnother = () => {
        setNewSecrets([...newSecrets, { name: '', value: '' }]);
    };

    const handleRemoveNew = (index: number) => {
        setNewSecrets(newSecrets.filter((_, i) => i !== index));
    };

    const handleNewSecretChange = (index: number, field: 'name' | 'value', value: string) => {
        const updated = [...newSecrets];
        updated[index][field] = value;
        setNewSecrets(updated);
    };

    const handleSave = async () => {
        if (!project?.id) return;

        // Filter out empty secrets
        const validSecrets = newSecrets.filter(s => s.name.trim() && s.value.trim());
        if (validSecrets.length === 0) return;

        const newSecretsWithDate = validSecrets.map(s => ({
            ...s,
            createdAt: new Date().toISOString()
        }));

        const updatedSecrets = [...secrets, ...newSecretsWithDate];

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
                        secrets: updatedSecrets
                    }
                }),
            });

            setSecrets(updatedSecrets);
            setNewSecrets([{ name: '', value: '' }]);
        } catch (e) {
            console.error('Failed to save secrets:', e);
        }
    };

    const handleDeleteSecret = async (index: number) => {
        if (!project?.id) return;

        const updatedSecrets = secrets.filter((_, i) => i !== index);

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
                        secrets: updatedSecrets
                    }
                }),
            });

            setSecrets(updatedSecrets);
        } catch (e) {
            console.error('Failed to delete secret:', e);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="space-y-8">
            {/* Add New Secret Section */}
            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Add New Secret</h2>
                    <p className="text-sm text-gray-400">Secrets securely save sensitive information like API keys.</p>
                </div>

                <div className="space-y-3">
                    {newSecrets.map((secret, index) => (
                        <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-start">
                            <div className="space-y-1">
                                {index === 0 && <label className="text-sm font-medium text-white">Name</label>}
                                <input
                                    type="text"
                                    placeholder="SECRET_NAME"
                                    value={secret.name}
                                    onChange={(e) => handleNewSecretChange(index, 'name', e.target.value)}
                                    className="w-full rounded-md border border-[#333] bg-[#1e1e1e] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-1">
                                {index === 0 && <label className="text-sm font-medium text-white">Value</label>}
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={secret.value}
                                    onChange={(e) => handleNewSecretChange(index, 'value', e.target.value)}
                                    className="w-full rounded-md border border-[#333] bg-[#1e1e1e] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className={index === 0 ? "pt-6" : ""}>
                                {newSecrets.length > 1 && (
                                    <button
                                        onClick={() => handleRemoveNew(index)}
                                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleAddAnother}
                        className="text-gray-300 hover:text-white hover:bg-[#2a2a2a] gap-2"
                    >
                        <Plus size={16} />
                        Add Another
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        className="bg-blue-600 text-white hover:bg-blue-500 font-semibold"
                    >
                        Save
                    </Button>
                </div>
            </div>

            {/* Saved Secrets Section */}
            {secrets.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">Saved Secrets</h2>

                    <div className="border border-[#333] rounded-lg overflow-hidden bg-[#1e1e1e]">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#333] bg-[#252525]">
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Name</th>
                                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Created</th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {secrets.map((secret, index) => (
                                    <tr key={index} className="border-b border-[#333] last:border-b-0 hover:bg-[#252525] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-white font-mono">{secret.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-400">
                                            {formatDate(secret.createdAt)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleDeleteSecret(index)}
                                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
