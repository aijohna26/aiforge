import { memo } from 'react';

export const AuthPanel = memo(() => {
    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-bolt-elements-borderColor">
                <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Authentication</h2>
                <p className="text-xs text-bolt-elements-textTertiary">Configure user access</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="p-4 rounded-lg bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded bg-accent-500/10 text-accent-500">
                            <div className="i-ph:users-three text-xl" />
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Users</h3>
                            <p className="text-xs text-bolt-elements-textTertiary">4 Signups</p>
                        </div>
                    </div>
                    <button className="w-full py-2 px-3 text-xs flex items-center justify-center gap-2 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor rounded hover:bg-bolt-elements-background-depth-3 transition-colors text-bolt-elements-textPrimary">
                        <div className="i-ph:gear" />
                        Auth Settings
                    </button>
                </div>

                <div>
                    <h3 className="text-xs font-medium text-bolt-elements-textSecondary mb-3 uppercase tracking-wider">Providers</h3>
                    <div className="space-y-2">
                        {['Email', 'Google', 'GitHub'].map(provider => (
                            <div key={provider} className="flex items-center justify-between p-2 rounded bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor">
                                <span className="text-sm text-bolt-elements-textPrimary">{provider}</span>
                                <span className="text-[10px] uppercase font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded">Enabled</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});
