import { memo } from 'react';

export const DatabasePanel = memo(() => {
    const tables = [
        { name: 'calendar_events', rows: 0 },
        { name: 'calendars', rows: 0 },
        { name: 'call_logs', rows: 0 },
        { name: 'profiles', rows: 0 },
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-bolt-elements-borderColor">
                <h2 className="text-lg font-semibold text-bolt-elements-textPrimary">Database</h2>
                <p className="text-xs text-bolt-elements-textTertiary">View and edit data</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-between items-center text-xs text-bolt-elements-textSecondary mb-2">
                    <span>{tables.length} Tables</span>
                </div>
                <div className="space-y-2">
                    {tables.map((table) => (
                        <div
                            key={table.name}
                            className="group flex items-center justify-between p-3 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 hover:bg-bolt-elements-background-depth-2 hover:border-bolt-elements-borderColorActive transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <div className="i-ph:table text-bolt-elements-textSecondary group-hover:text-bolt-elements-textPrimary" />
                                <span className="text-sm text-bolt-elements-textPrimary font-medium">{table.name}</span>
                            </div>
                            <span className="text-xs text-bolt-elements-textTertiary">{table.rows} rows</span>
                        </div>
                    ))}
                </div>
                <button className="w-full mt-4 py-2 text-xs font-medium text-bolt-elements-textSecondary bg-bolt-elements-background-depth-2 rounded hover:bg-bolt-elements-background-depth-3 transition-colors">
                    View all tables
                </button>
            </div>
        </div>
    );
});
