import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { E2BRunner } from '~/lib/runtime/e2b-runner';
import { IconButton } from '~/components/ui/IconButton';

interface ServerLogsModalProps {
    onClose: () => void;
}

export const ServerLogsModal = ({ onClose }: ServerLogsModalProps) => {
    const [logs, setLogs] = useState<string>('Loading logs...');
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const logData = await E2BRunner.getLogs();
            setLogs(logData);
        } catch (error) {
            setLogs('Failed to fetch logs.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();

        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor shadow-2xl rounded-lg w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
                    <div className="flex items-center gap-2">
                        <div className="i-ph:terminal-window text-xl text-bolt-elements-textSecondary" />
                        <h2 className="font-semibold text-bolt-elements-textPrimary">Server Logs</h2>
                        {isLoading && <div className="i-ph:spinner animate-spin text-bolt-elements-textTertiary" />}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchLogs}
                            className="p-1 hover:bg-bolt-elements-background-depth-3 rounded text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition"
                            title="Refresh"
                        >
                            <div className="i-ph:arrow-clockwise" />
                        </button>
                        <IconButton icon="i-ph:x" onClick={onClose} size="md" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-[#0a0a0a] p-4 font-mono text-sm">
                    <pre className="whitespace-pre-wrap text-green-400">
                        {logs}
                    </pre>
                    {logs === 'No active sandbox.' && (
                        <div className="mt-4 text-gray-500 text-center">
                            Start the development server to see logs here.
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
