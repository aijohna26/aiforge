import { memo } from 'react';
import { useStore } from '@nanostores/react';
import { selectedHelpSection, type HelpSection } from '~/lib/stores/help';
import { classNames } from '~/utils/classNames';

export const HelpPanel = memo(() => {
    const sections = [
        {
            title: 'Documentation',
            items: [
                { icon: 'i-ph:book', label: 'Docs' },
                { icon: 'i-ph:video', label: 'Tutorials' },
                { icon: 'i-ph:code', label: 'API Reference' }
            ]
        },
        {
            title: 'Community',
            items: [
                { icon: 'i-ph:users', label: 'Forum' },
                { icon: 'i-ph:discord-logo', label: 'Discord' },
                { icon: 'i-ph:twitter-logo', label: 'Twitter' }
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: 'i-ph:bug', label: 'Report a Bug' },
                { icon: 'i-ph:lifebuoy', label: 'Contact Support' },
                { icon: 'i-ph:chats', label: 'Live Chat' }
            ]
        },
        {
            title: 'Legal',
            items: [
                { icon: 'i-ph:file-text', label: 'Terms of Service' },
                { icon: 'i-ph:shield', label: 'Privacy Policy' }
            ]
        }
    ];

    const activeSection = useStore(selectedHelpSection);

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-bolt-elements-borderColor flex items-center gap-2">
                <div className="i-ph:question text-lg text-bolt-elements-textSecondary" />
                <h2 className="text-sm font-semibold text-bolt-elements-textPrimary">Help & Support</h2>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                {sections.map((section, idx) => (
                    <div key={idx} className="mb-6 px-4">
                        <h3 className="text-xs font-semibold text-bolt-elements-textTertiary mb-2 uppercase tracking-wide">{section.title}</h3>
                        <div className="space-y-1">
                            {section.items.map(item => (
                                <button
                                    key={item.label}
                                    onClick={() => selectedHelpSection.set(item.label as HelpSection)}
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
