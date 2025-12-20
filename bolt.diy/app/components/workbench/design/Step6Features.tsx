import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useStore } from '@nanostores/react';
import { designWizardStore } from '~/lib/stores/designWizard';
import { motion, AnimatePresence } from 'framer-motion';

export interface Integration {
    id: string;
    name: string;
    description: string;
    category: 'backend' | 'auth' | 'ai' | 'payments' | 'analytics' | 'communication' | 'monitoring' | 'design' | 'notifications' | 'automation';
    icon?: string;
    configRequired?: boolean;
    popular?: boolean;
}

export interface SelectedIntegration {
    id: string;
    enabled: boolean;
    config?: Record<string, any>;
}

export interface DataModel {
    id: string;
    name: string;
    description: string;
    fields: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'reference';
        required: boolean;
        description?: string;
        referenceModel?: string;
    }>;
}

interface Step6FeaturesProps {
    selectedIntegrations: SelectedIntegration[];
    dataModels: DataModel[];
    onUpdate: (integrations: SelectedIntegration[], dataModels: DataModel[]) => void;
    onComplete: () => void;
}

const INTEGRATIONS: Integration[] = [
    {
        id: 'supabase',
        name: 'Supabase',
        description: 'Backend (database, realtime sync, jobs, file storage)',
        category: 'backend',
        icon: 'i-ph:database',
        popular: true,
    },
    {
        id: 'supabase-auth',
        name: 'Supabase Auth',
        description: 'User authentication (email, magic link; mobile-friendly)',
        category: 'auth',
        icon: 'i-ph:shield-check',
        popular: true,
    },
    {
        id: 'ai-features',
        name: 'AI Features',
        description: 'Add AI-powered features to your app (uses your configured LLM providers)',
        category: 'ai',
        icon: 'i-ph:brain',
        popular: true,
    },
    {
        id: 'revenuecat',
        name: 'RevenueCat',
        description: 'In-app purchases, subscriptions, and entitlements',
        category: 'payments',
        icon: 'i-ph:credit-card',
    },
    {
        id: 'posthog',
        name: 'PostHog',
        description: 'Product analytics, events, and feature flags',
        category: 'analytics',
        icon: 'i-ph:chart-line',
    },
    {
        id: 'resend',
        name: 'Resend',
        description: 'Transactional email (auth, notifications, system messages)',
        category: 'communication',
        icon: 'i-ph:envelope',
    },
    {
        id: 'sentry',
        name: 'Sentry',
        description: 'Error tracking and crash reporting (mobile + backend)',
        category: 'monitoring',
        icon: 'i-ph:bug',
    },
    {
        id: 'figma',
        name: 'Figma Imports',
        description: 'Design system & token import (variables → AI context)',
        category: 'design',
        icon: 'i-ph:figma-logo',
    },
    {
        id: 'expo-notifications',
        name: 'Expo Notifications',
        description: 'Push notifications (job status, updates)',
        category: 'notifications',
        icon: 'i-ph:bell',
        popular: true,
    },
    {
        id: 'webhooks',
        name: 'Webhooks',
        description: 'Automation and external system triggers',
        category: 'automation',
        icon: 'i-ph:webhooks-logo',
    },
];

const CATEGORY_LABELS = {
    backend: 'Backend & Database',
    auth: 'Authentication',
    ai: 'AI & ML',
    payments: 'Payments & Subscriptions',
    analytics: 'Analytics & Insights',
    communication: 'Communication',
    monitoring: 'Monitoring & Errors',
    design: 'Design Tools',
    notifications: 'Notifications',
    automation: 'Automation',
};

export function Step6Features({ selectedIntegrations, dataModels, onUpdate, onComplete }: Step6FeaturesProps) {
    const wizardData = useStore(designWizardStore);
    const { step1 } = wizardData;

    const [searchQuery, setSearchQuery] = useState('');
    const [dataModelDescription, setDataModelDescription] = useState('');
    const [isGeneratingModels, setIsGeneratingModels] = useState(false);
    const [suggestedModels, setSuggestedModels] = useState<DataModel[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Filter models from description if needed, but we'll use suggestedModels for the UI cards

    const isSelected = (integrationId: string) => {
        return (selectedIntegrations || []).some(i => i.id === integrationId && i.enabled);
    };

    const toggleIntegration = (integrationId: string) => {
        const integrations = selectedIntegrations || [];
        const existing = integrations.find(i => i.id === integrationId);

        if (existing) {
            onUpdate(
                integrations.map(i =>
                    i.id === integrationId ? { ...i, enabled: !i.enabled } : i
                ),
                dataModels || []
            );
        } else {
            onUpdate([
                ...integrations,
                { id: integrationId, enabled: true },
            ], dataModels || []);
        }
    };

    const selectAll = () => {
        const allIntegrations = INTEGRATIONS.map(integration => ({
            id: integration.id,
            enabled: true,
        }));
        onUpdate(allIntegrations, dataModels || []);
        toast.success('All integrations selected');
    };

    const deselectAll = () => {
        onUpdate([], dataModels || []);
        toast.success('All integrations deselected');
    };

    const selectPopular = () => {
        const popularIntegrations = INTEGRATIONS
            .filter(i => i.popular)
            .map(integration => ({
                id: integration.id,
                enabled: true,
            }));
        onUpdate(popularIntegrations, dataModels || []);
        toast.success('Popular integrations selected');
    };

    const generateModelSuggestions = async () => {
        if (!step1.description) {
            toast.error('App description is missing. Please go back to Step 1.');
            return;
        }

        try {
            setIsGeneratingModels(true);
            setShowSuggestions(true);

            const prompt = `
                Based on this app description: "${step1.description}"
                Primary goal: "${step1.primaryGoal}"
                App Category: "${step1.category}"
                ${step1.dataDescription ? `User emphasized these data entities: "${step1.dataDescription}"` : ""}

                Suggest a set of core data models needed for this mobile application.
                Return ONLY a JSON array of objects with this structure:
                {
                  "id": "model-id",
                  "name": "Model Name",
                  "description": "Short description of what this model represents",
                  "fields": [
                    { "name": "field_name", "type": "string|number|boolean|date|array|object|reference", "required": true, "description": "purpose" }
                  ]
                }
                
                Keep it to the 3-5 most essential models.
            `;

            const response = await fetch('/api/llmcall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system: "You are an expert database architect. Return only valid JSON.",
                    message: prompt,
                    model: 'gpt-4o',
                    provider: { name: 'OpenAI' }
                })
            });

            const result = await response.json();

            if (result.error) throw new Error(result.message);

            // generateText returns an object with a 'text' property
            const content = result.text;
            const cleanContent = content.replace(/```json|```/g, '').trim();
            const models = JSON.parse(cleanContent);

            setSuggestedModels(models);
            toast.success('Generated data model suggestions');
        } catch (error) {
            console.error('Failed to generate models:', error);
            toast.error('Failed to generate suggestions. Please try manual description.');
        } finally {
            setIsGeneratingModels(false);
        }
    };

    const parseManualDescription = async () => {
        if (!dataModelDescription || dataModelDescription.length < 10) {
            toast.error('Please provide a more detailed description first.');
            return;
        }

        try {
            setIsGeneratingModels(true);
            setShowSuggestions(true);

            const prompt = `
                Convert this description of data models into a structured JSON schema:
                "${dataModelDescription}"

                Return ONLY a JSON array of objects with this structure:
                {
                  "name": "Model Name",
                  "description": "Short description",
                  "fields": [
                    { "name": "field_name", "type": "string|number|boolean|date|array|object|reference", "required": true, "description": "purpose" }
                  ]
                }
            `;

            const response = await fetch('/api/llmcall', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system: "You are an expert database architect. Return only valid JSON.",
                    message: prompt,
                    model: 'gpt-4o',
                    provider: { name: 'OpenAI' }
                })
            });

            const result = await response.json();
            if (result.error) throw new Error(result.message);

            const content = result.text;
            const cleanContent = content.replace(/```json|```/g, '').trim();
            const models = JSON.parse(cleanContent);

            setSuggestedModels(models);
            toast.success('Description analyzed and models suggested');
        } catch (error) {
            console.error('Failed to parse description:', error);
            toast.error('Failed to analyze description.');
        } finally {
            setIsGeneratingModels(false);
        }
    };

    const clearAllModels = () => {
        onUpdate(selectedIntegrations || [], []);
        toast.success('Cleared all data models');
    };

    const acceptModel = (model: DataModel) => {
        const currentModels = dataModels || [];
        const exists = currentModels.some(m => m.name === model.name);
        if (exists) {
            toast.warning(`${model.name} is already added.`);
            return;
        }

        onUpdate(selectedIntegrations || [], [...currentModels, { ...model, id: `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }]);
        toast.success(`Added ${model.name} model`);
    };

    const removeModel = (modelId: string) => {
        onUpdate(selectedIntegrations || [], (dataModels || []).filter(m => m.id !== modelId));
    };

    const groupedIntegrations = INTEGRATIONS.reduce((acc, integration) => {
        if (searchQuery && !integration.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !integration.description.toLowerCase().includes(searchQuery.toLowerCase())) {
            return acc;
        }

        if (!acc[integration.category]) {
            acc[integration.category] = [];
        }
        acc[integration.category].push(integration);
        return acc;
    }, {} as Record<string, Integration[]>);

    const selectedCount = (selectedIntegrations || []).filter(i => i.enabled).length;

    return (
        <div className="w-[880px] max-h-[85vh] overflow-y-auto custom-scrollbar bg-[#06080F] border-2 border-[#1E2533] rounded-3xl p-8 pb-60 shadow-2xl pointer-events-auto">
            <div className="mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Step 6: Features</h2>
                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                        Customize your application with powerful integrations, authentication providers, and AI capabilities.
                    </p>
                </div>

                {/* Search and Quick Actions */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
                    <div className="flex-1 relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors">
                            <div className="i-ph:magnifying-glass text-xl" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search integrations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-[#0B101A] border border-[#1E2533] rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={selectPopular}
                            className="flex-1 md:flex-none px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                        >
                            Popular
                        </button>
                        <button
                            onClick={selectAll}
                            className="flex-1 md:flex-none px-6 py-3.5 bg-[#121826] border border-[#1E2533] hover:border-slate-600 text-white rounded-2xl text-sm font-bold transition-all"
                        >
                            Select All
                        </button>
                        <button
                            onClick={deselectAll}
                            className="flex-1 md:flex-none px-6 py-3.5 bg-[#121826] border border-[#1E2533] hover:border-rose-900/50 hover:text-rose-400 text-white rounded-2xl text-sm font-bold transition-all"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Selected Count Indicator */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 mb-10 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/10">
                                <div className="i-ph:check-box-fill text-blue-400 text-3xl" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">
                                    {selectedCount} {selectedCount === 1 ? 'feature' : 'features'} curated
                                </p>
                                <p className="text-blue-400/80 font-medium">
                                    {selectedCount === 0 ? 'Explore integrations to customize your stack' : 'These services will be pre-configured in your project'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrations Grid - Single Column Layout for Thinner View */}
                <div className="grid gap-12 grid-cols-1 items-start">
                    {Object.entries(groupedIntegrations).map(([category, integrations]) => (
                        <div key={category} className="space-y-4">
                            <h3 className="text-xs font-bold mb-4 text-blue-400/80 uppercase tracking-[0.2em]">
                                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {integrations.map((integration) => {
                                    const selected = isSelected(integration.id);
                                    return (
                                        <button
                                            key={integration.id}
                                            onClick={() => toggleIntegration(integration.id)}
                                            className={`relative p-4 rounded-xl border transition-all text-left group overflow-hidden ${selected
                                                ? 'border-blue-500 bg-[#0E1629] shadow-[0_0_25px_rgba(59,130,246,0.1)]'
                                                : 'border-[#1E2533] bg-[#0B101A] hover:border-slate-600 hover:bg-[#0D1421]'
                                                }`}
                                        >
                                            {/* Selection Glow */}
                                            {selected && (
                                                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />
                                            )}

                                            {/* Popular Badge */}
                                            {integration.popular && (
                                                <div className="absolute top-2.5 right-2.5 z-10">
                                                    <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black rounded-md shadow-xl uppercase tracking-wider">
                                                        Popular
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-3 relative z-10">
                                                {/* Icon */}
                                                <div
                                                    className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${selected
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/50'
                                                        : 'bg-[#181E2B] text-slate-500 group-hover:text-blue-400 group-hover:bg-[#1C2538]'
                                                        }`}
                                                >
                                                    <div className={`${integration.icon || 'i-ph:puzzle-piece'} text-xl`} />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 pr-6">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={`font-bold text-sm transition-colors ${selected ? 'text-white' : 'text-slate-100 group-hover:text-white'
                                                            }`}>
                                                            {integration.name}
                                                        </h4>
                                                        {selected && (
                                                            <div className="i-ph:check-circle-fill text-blue-400 text-base animate-in zoom-in-50 duration-300" />
                                                        )}
                                                    </div>
                                                    <p className={`text-[12px] leading-snug transition-colors ${selected ? 'text-blue-100/90' : 'text-slate-400'
                                                        }`}>
                                                        {integration.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty Search State */}
                {Object.keys(groupedIntegrations).length === 0 && (
                    <div className="text-center py-32 rounded-3xl border border-dashed border-[#1E2533] bg-[#0A0E1A]/50">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-[#0B101A] border border-[#1E2533] flex items-center justify-center">
                            <div className="i-ph:warning-circle text-6xl text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No matching integrations</h3>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium">
                            Try adjusting your search terms or filter to find what you're looking for.
                        </p>
                    </div>
                )}

                {/* Data Models Section */}
                <div className="mt-16 pt-16 border-t border-[#1E2533]">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight flex items-center gap-3">
                            <div className="i-ph:database text-cyan-400" />
                            Data Models
                        </h2>
                        <p className="text-slate-400 text-base max-w-3xl leading-relaxed">
                            Describe the data your app will work with. For example: "User has name, email, avatar. Each user can create multiple Exams. Each Exam has title, questions array, created date."
                        </p>
                    </div>

                    <div className="bg-[#0B0F1C] border border-[#1E2533] rounded-2xl p-8">
                        <div className="grid lg:grid-cols-2 gap-12">
                            {/* Input Column */}
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                                        <div className="i-ph:sparkle-duotone text-cyan-400 text-2xl" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-bold text-white mb-2">
                                            AI Model Suggestion
                                        </label>
                                        <p className="text-[13px] text-slate-400 mb-6 leading-relaxed">
                                            Not sure what data models you need? Let AI suggest the core structure based on your app's purpose.
                                        </p>

                                        <button
                                            onClick={generateModelSuggestions}
                                            disabled={isGeneratingModels}
                                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-cyan-900/20 group uppercase tracking-widest active:scale-95 disabled:opacity-50"
                                        >
                                            {isGeneratingModels ? (
                                                <div className="i-ph:circle-notch animate-spin text-xl" />
                                            ) : (
                                                <div className="i-ph:magic-wand-duotone text-xl group-hover:rotate-12 transition-transform" />
                                            )}
                                            {isGeneratingModels ? 'Designing Schema...' : 'Suggest Data Models'}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[#1E2533]/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Manual Description</label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={parseManualDescription}
                                                className="bg-transparent border-none p-0 text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1 transition-colors outline-none"
                                            >
                                                <div className="i-ph:wand text-xs" />
                                                Analyze Description
                                            </button>
                                            <span className="text-[10px] text-slate-600 font-mono tracking-tighter">{dataModelDescription.length} chars</span>
                                        </div>
                                    </div>
                                    <textarea
                                        value={dataModelDescription}
                                        onChange={(e) => setDataModelDescription(e.target.value)}
                                        placeholder="Or describe it yourself... Example: 'Products have name, price, SKU. Orders link a User to multiple Products.'"
                                        rows={4}
                                        className="w-full px-4 py-3 bg-[#06080F] border border-[#1E2533] rounded-xl text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all resize-none text-[13px] leading-relaxed"
                                    />
                                </div>
                            </div>

                            {/* Suggestions Column */}
                            <div className="min-h-[300px] border-l border-[#1E2533] pl-12 hidden lg:block">
                                <AnimatePresence mode="wait">
                                    {!showSuggestions && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="h-full flex flex-col items-center justify-center text-center px-4"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-[#06080F] border border-[#1E2533] flex items-center justify-center mb-4">
                                                <div className="i-ph:database-duotone text-slate-700 text-3xl" />
                                            </div>
                                            <p className="text-slate-500 text-sm font-medium">Click Suggest to generate a schema for {step1.appName || 'your app'}.</p>
                                        </motion.div>
                                    )}

                                    {showSuggestions && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Suggested Models</h4>
                                                {isGeneratingModels && <div className="i-ph:circle-notch animate-spin text-cyan-400" />}
                                            </div>

                                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                                                {suggestedModels.map((model, idx) => {
                                                    const alreadyAdded = (dataModels || []).some(m => m.name === model.name);
                                                    return (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: idx * 0.1 }}
                                                            className={`p-4 rounded-xl border transition-all ${alreadyAdded
                                                                ? 'bg-green-500/5 border-green-500/30'
                                                                : 'bg-[#06080F] border-[#1E2533] hover:border-cyan-500/30'}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-sm font-black text-white">{model.name}</span>
                                                                        {alreadyAdded && <div className="i-ph:check-circle-fill text-green-500 text-xs" />}
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-400 leading-tight mb-3">{model.description}</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {model.fields.slice(0, 4).map((f, i) => (
                                                                            <span key={i} className="text-[9px] font-black text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                                                {f.name}
                                                                            </span>
                                                                        ))}
                                                                        {model.fields.length > 4 && <span className="text-[9px] text-slate-600">+{model.fields.length - 4}</span>}
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    onClick={() => acceptModel(model)}
                                                                    disabled={alreadyAdded}
                                                                    className={`p-2 rounded-lg transition-all ${alreadyAdded
                                                                        ? 'text-green-500 cursor-default'
                                                                        : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
                                                                >
                                                                    <div className={alreadyAdded ? "i-ph:check-bold" : "i-ph:plus-bold"} />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Inventory of added models */}
                        {(dataModels || []).length > 0 && (
                            <div className="mt-12 pt-8 border-t border-[#1E2533]">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Schema Definition</h4>
                                    <button
                                        onClick={clearAllModels}
                                        className="bg-transparent border-none p-0 text-[10px] font-black text-rose-500/60 hover:text-rose-500 uppercase tracking-widest flex items-center gap-1.5 transition-colors outline-none"
                                    >
                                        <div className="i-ph:trash-simple-bold text-xs" />
                                        Clear All
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {(dataModels || []).map((model) => (
                                        <div key={model.id} className="bg-[#0D1421] border border-[#1E2533] rounded-xl p-4 group relative">
                                            <button
                                                onClick={() => removeModel(model.id)}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-600 hover:text-rose-500"
                                            >
                                                <div className="i-ph:minus-circle-bold" />
                                            </button>
                                            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                                                <div className="i-ph:table text-green-400" />
                                            </div>
                                            <span className="block text-xs font-black text-white uppercase tracking-tight truncate">{model.name}</span>
                                            <span className="text-[10px] text-slate-500 font-medium truncate">{model.fields.length} properties</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Example prompt */}
                    <div className="mt-6 pt-6 border-t border-[#1E2533]">
                        <details className="group">
                            <summary className="cursor-pointer text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-2">
                                <div className="i-ph:lightbulb text-base" />
                                Show examples
                                <div className="i-ph:caret-down group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="mt-4 space-y-3 text-xs text-slate-500 leading-relaxed">
                                <div className="bg-[#06080F] rounded-lg p-4 border border-[#1E2533]">
                                    <p className="font-bold text-cyan-400 mb-2">E-commerce App:</p>
                                    <p className="font-mono">Product (name, price, images, stock, category), User (name, email, cart), Order (user, items, total, status, date)</p>
                                </div>
                                <div className="bg-[#06080F] rounded-lg p-4 border border-[#1E2533]">
                                    <p className="font-bold text-cyan-400 mb-2">Social App:</p>
                                    <p className="font-mono">User (username, bio, avatar, followers), Post (author, content, images, likes, comments), Comment (author, post, text, timestamp)</p>
                                </div>
                            </div>
                        </details>
                    </div>
                </div>

            </div>
        </div>
    );
}
