"use client";

import { useEffect, useRef } from "react";
import { useStore } from '@nanostores/react';
import { terminalOutput, serverStatus } from '@/lib/webcontainer/stores';
import { Loader2 } from "lucide-react";

export function Terminal() {
    const output = useStore(terminalOutput);
    const status = useStore(serverStatus);
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [output]);

    // Basic ANSI-like coloring (very simple for now)
    const renderLine = (line: string, index: number) => {
        let className = "text-slate-300";
        if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail')) {
            className = "text-red-400";
        } else if (line.toLowerCase().includes('warn')) {
            className = "text-yellow-400";
        } else if (line.toLowerCase().includes('success') || line.toLowerCase().includes('done')) {
            className = "text-emerald-400";
        }

        return (
            <div key={index} className={className}>
                {line}
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
                <span className="text-xs font-mono text-slate-400">Terminal Output</span>
                <div className="flex items-center gap-2">
                    {status === 'booting' || status === 'installing' || status === 'starting' ? (
                        <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                    ) : (
                        <span className={`h-2 w-2 rounded-full ${status === 'ready' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                    )}
                    <span className="text-[10px] uppercase text-slate-500">{status}</span>
                </div>
            </div>
            <div
                ref={terminalRef}
                className="flex-1 overflow-y-auto font-mono text-xs whitespace-pre-wrap"
            >
                {output ? (
                    output.split('\n').map((line, i) => renderLine(line, i))
                ) : (
                    <span className="text-slate-500 italic">Waiting for output...</span>
                )}
            </div>
        </div>
    );
}
