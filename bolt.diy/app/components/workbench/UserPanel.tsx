import { memo } from 'react';

export const UserPanel = memo(() => {
    const sections = [
        {
            title: 'Account Settings',
            items: [
                { icon: 'i-ph:user-circle', label: 'Profile' }
            ]
        },
        {
            title: 'Subscription',
            items: [
                { icon: 'i-ph:crown', label: 'Manage Subscription' },
                { icon: 'i-ph:credit-card', label: 'Top-up Credit' }
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: 'i-ph:bell', label: 'Notifications' },
                { icon: 'i-ph:paint-brush', label: 'Appearance' }
            ]
        }
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-bolt-elements-borderColor flex items-center gap-2">
                <div className="i-ph:user-gear text-lg text-bolt-elements-textSecondary" />
                <h2 className="text-sm font-semibold text-bolt-elements-textPrimary">User Settings</h2>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                {sections.map((section, idx) => (
                    <div key={idx} className="mb-6 px-4">
                        <h3 className="text-xs font-semibold text-bolt-elements-textTertiary mb-2 uppercase tracking-wide">{section.title}</h3>
                        <div className="space-y-1">
                            {section.items.map(item => (
                                <button key={item.label} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-bolt-elements-textPrimary bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3 border border-transparent hover:border-bolt-elements-borderColor transition-all text-left group">
                                    <div className={`${item.icon} text-lg text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary transition-colors`} />
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
