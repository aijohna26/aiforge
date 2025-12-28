import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useStore } from '@nanostores/react';
import { designWizardStore } from '~/lib/stores/designWizard';
import { motion, AnimatePresence } from 'framer-motion';

export interface Integration {
  id: string;
  name: string;
  description: string;
  category:
    | 'backend'
    | 'auth'
    | 'ai'
    | 'payments'
    | 'analytics'
    | 'communication'
    | 'monitoring'
    | 'design'
    | 'notifications'
    | 'automation';
  icon?: string;
  configRequired?: boolean;
  popular?: boolean;
}

export interface SelectedIntegration {
  id: string;
  enabled: boolean;
  config?: Record<string, any>;
}

interface Step6FeaturesProps {
  selectedIntegrations: SelectedIntegration[];
  onUpdate: (integrations: SelectedIntegration[]) => void;
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

export function Step6Features({ selectedIntegrations, onUpdate, onComplete }: Step6FeaturesProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const isSelected = (integrationId: string) => {
    return (selectedIntegrations || []).some((i) => i.id === integrationId && i.enabled);
  };

  const toggleIntegration = (integrationId: string) => {
    const integrations = selectedIntegrations || [];
    const existing = integrations.find((i) => i.id === integrationId);

    if (existing) {
      onUpdate(integrations.map((i) => (i.id === integrationId ? { ...i, enabled: !i.enabled } : i)));
    } else {
      onUpdate([...integrations, { id: integrationId, enabled: true }]);
    }
  };

  const selectAll = () => {
    const allIntegrations = INTEGRATIONS.map((integration) => ({
      id: integration.id,
      enabled: true,
    }));
    onUpdate(allIntegrations);
    toast.success('All integrations selected');
  };

  const deselectAll = () => {
    onUpdate([]);
    toast.success('All integrations deselected');
  };

  const selectPopular = () => {
    const popularIntegrations = INTEGRATIONS.filter((i) => i.popular).map((integration) => ({
      id: integration.id,
      enabled: true,
    }));
    onUpdate(popularIntegrations);
    toast.success('Popular integrations selected');
  };

  const groupedIntegrations = INTEGRATIONS.reduce(
    (acc, integration) => {
      if (
        searchQuery &&
        !integration.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !integration.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return acc;
      }

      if (!acc[integration.category]) {
        acc[integration.category] = [];
      }

      acc[integration.category].push(integration);

      return acc;
    },
    {} as Record<string, Integration[]>,
  );

  const selectedCount = (selectedIntegrations || []).filter((i) => i.enabled).length;

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
                  {selectedCount === 0
                    ? 'Explore integrations to customize your stack'
                    : 'These services will be pre-configured in your project'}
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
                      className={`relative p-4 rounded-xl border transition-all text-left group overflow-hidden ${
                        selected
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
                          className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                            selected
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/50'
                              : 'bg-[#181E2B] text-slate-500 group-hover:text-blue-400 group-hover:bg-[#1C2538]'
                          }`}
                        >
                          <div className={`${integration.icon || 'i-ph:puzzle-piece'} text-xl`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2 mb-1">
                            <h4
                              className={`font-bold text-sm transition-colors ${
                                selected ? 'text-white' : 'text-slate-100 group-hover:text-white'
                              }`}
                            >
                              {integration.name}
                            </h4>
                            {selected && (
                              <div className="i-ph:check-circle-fill text-blue-400 text-base animate-in zoom-in-50 duration-300" />
                            )}
                          </div>
                          <p
                            className={`text-[12px] leading-snug transition-colors ${
                              selected ? 'text-blue-100/90' : 'text-slate-400'
                            }`}
                          >
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
      </div>
    </div>
  );
}
