import { memo } from 'react';
import { useStore } from '@nanostores/react';
import { selectedSettingSection, type SettingSection } from '~/lib/stores/settings';
import { classNames } from '~/utils/classNames';

export const SettingsPanel = memo(() => {
    const activeSection = useStore(selectedSettingSection);

    const sections = [
        {
            title: 'Authentication',
            items: [
                { icon: 'i-ph:users', label: 'Identity Providers' },
                { icon: 'i-ph:shield-check', label: 'Security Rules' }
            ]
        },
        {
            title: 'Database',
            items: [
                { icon: 'i-ph:database', label: 'Schema Design' },
                { icon: 'i-ph:table', label: 'Data Browser' }
            ]
        },
        {
            title: 'Backend',
            items: [
                { icon: 'i-ph:lightning', label: 'Edge Functions' },
                { icon: 'i-ph:globe', label: 'API Routes' },
                { icon: 'i-ph:lock-key', label: 'Environment Secrets' }
            ]
        },
        {
            title: 'Mobile Services',
            items: [
                { icon: 'i-ph:bell-ringing', label: 'Push Notifications' },
                { icon: 'i-ph:link', label: 'Deep Linking' }
            ]
        },
        {
            title: 'Payments',
            items: [
                { icon: 'i-ph:credit-card', label: 'Payment Gateways' },
                { icon: 'i-ph:receipt', label: 'Subscription Plans' }
            ]
        },
        {
            title: 'Monitoring',
            items: [
                { icon: 'i-ph:chart-line-up', label: 'Analytics' },
                { icon: 'i-ph:bug-beetle', label: 'Crash Reporting' },
                { icon: 'i-ph:terminal-window', label: 'Real-time Logs' }
            ]
        },
        {
            title: 'Mobile App Settings',
            items: [
                { icon: 'i-ph:device-mobile', label: 'App Info & Branding' },
                { icon: 'i-ph:image', label: 'Assets & Media' }
            ]
        },
        {
            title: 'Publishing',
            items: [
                { icon: 'i-ph:apple-logo', label: 'App Store Connect' },
                { icon: 'i-ph:android-logo', label: 'Google Play Console' },
                { icon: 'i-ph:cloud-arrow-up', label: 'OTA Updates' }
            ]
        }
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-bolt-elements-borderColor flex items-center gap-2">
                <div className="i-ph:gear text-lg text-bolt-elements-textSecondary" />
                <h2 className="text-sm font-semibold text-bolt-elements-textPrimary">Project Settings</h2>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                {sections.map((section, idx) => (
                    <div key={idx} className="mb-6 px-4">
                        <h3 className="text-xs font-semibold text-bolt-elements-textTertiary mb-2 uppercase tracking-wide">{section.title}</h3>
                        <div className="space-y-1">
                            {section.items.map(item => (
                                <button
                                    key={item.label}
                                    onClick={() => selectedSettingSection.set(item.label as SettingSection)}
                                    className={classNames(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left group border",
                                        activeSection === item.label
                                            ? "bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent border-bolt-elements-item-contentAccent/20"
                                            : "text-bolt-elements-textPrimary bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 border-transparent hover:border-bolt-elements-borderColor"
                                    )}
                                >
                                    <div className={`${item.icon} text-lg transition-colors ${activeSection === item.label ? 'text-bolt-elements-item-contentAccent' : 'text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary'}`} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
