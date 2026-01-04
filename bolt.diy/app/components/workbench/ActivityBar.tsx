import { memo } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';

export type SidebarViewType = 'chat' | 'settings' | 'help' | 'user';

interface ActivityBarProps {
    activeView: SidebarViewType;
    onViewChange: (view: SidebarViewType) => void;
}

export const ActivityBar = memo(({ activeView, onViewChange }: ActivityBarProps) => {
    const items: { view: SidebarViewType; icon: string; label: string }[] = [
        { view: 'chat', icon: 'i-ph:chat-circle-dots', label: 'Chat' },
        { view: 'settings', icon: 'i-ph:gear', label: 'Project Settings' },
        { view: 'help', icon: 'i-ph:question', label: 'Help' },
    ];

    return (
        <div className="w-12 flex flex-col items-center border-r border-bolt-elements-borderColor py-4 gap-4 bg-bolt-elements-background-depth-1 z-10 text-bolt-elements-textSecondary">
            {items.map((item) => (
                <IconButton
                    key={item.view}
                    icon={item.icon}
                    title={item.label}
                    size="xl"
                    onClick={() => onViewChange(item.view)}
                    className={classNames(
                        'transition-colors',
                        activeView === item.view
                            ? 'text-bolt-elements-item-contentAccent bg-bolt-elements-item-backgroundAccent'
                            : 'hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
                    )}
                />
            ))}
            <div className="flex-1" />
            <IconButton
                icon="i-ph:user-gear"
                title="User Settings"
                size="xl"
                onClick={() => onViewChange('user')}
                className={classNames(
                    'transition-colors',
                    activeView === 'user'
                        ? 'text-bolt-elements-item-contentAccent bg-bolt-elements-item-backgroundAccent'
                        : 'hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3',
                )}
            />
        </div>
    );
});
