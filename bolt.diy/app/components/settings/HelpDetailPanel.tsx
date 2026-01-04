import { useStore } from '@nanostores/react';
import { memo } from 'react';
import { selectedHelpSection } from '~/lib/stores/help';

export const HelpDetailPanel = memo(() => {
    const section = useStore(selectedHelpSection);

    return (
        <div className="h-full w-full bg-bolt-elements-background-depth-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-bolt-elements-borderColor flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">{section}</h2>
                    <p className="text-sm text-bolt-elements-textSecondary mt-1">
                        View information about {section}.
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-8 text-center">
                        <div className="w-16 h-16 mx-auto bg-bolt-elements-background-depth-3 rounded-full flex items-center justify-center mb-4">
                            <div className="i-ph:info text-3xl text-bolt-elements-textSecondary" />
                        </div>
                        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">
                            {section} Information
                        </h3>
                        <p className="text-bolt-elements-textSecondary max-w-md mx-auto mb-6">
                            This is the detailed view for {section}. The content for this help section is coming soon.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
});
