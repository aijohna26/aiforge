"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from '@nanostores/react';
import { terminalOutput, serverStatus } from '@/lib/stores/editor';
import { Loader2 } from "lucide-react";

export function Terminal() {
    const output = useStore(terminalOutput);
    const status = useStore(serverStatus);
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<any>(null);
    const fitAddonRef = useRef<any>(null);
    const lastOutputRef = useRef<string>('');
    const [mounted, setMounted] = useState(false);

    // Initialize xterm
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !terminalRef.current) return;

        let term: any;
        let fitAddon: any;

        const initTerminal = async () => {
            // Dynamically import xterm only on client-side
            const { Terminal: XTerm } = await import('@xterm/xterm');
            const { FitAddon } = await import('@xterm/addon-fit');
            await import('@xterm/xterm/css/xterm.css');

            term = new XTerm({
                theme: {
                    background: '#020617',
                    foreground: '#cbd5e1',
                    cursor: '#cbd5e1',
                    black: '#1e293b',
                    red: '#f87171',
                    green: '#34d399',
                    yellow: '#fbbf24',
                    blue: '#60a5fa',
                    magenta: '#c084fc',
                    cyan: '#22d3ee',
                    white: '#cbd5e1',
                    brightBlack: '#475569',
                    brightRed: '#fca5a5',
                    brightGreen: '#6ee7b7',
                    brightYellow: '#fcd34d',
                    brightBlue: '#93c5fd',
                    brightMagenta: '#d8b4fe',
                    brightCyan: '#67e8f9',
                    brightWhite: '#f1f5f9',
                },
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12,
                lineHeight: 1.4,
                cursorBlink: false,
                disableStdin: true,
                convertEol: true,
                scrollback: 10000,
            });

            fitAddon = new FitAddon();
            term.loadAddon(fitAddon);

            if (terminalRef.current) {
                term.open(terminalRef.current);
                fitAddon.fit();
            }

            xtermRef.current = term;
            fitAddonRef.current = fitAddon;

            // Handle window resize
            const handleResize = () => {
                if (fitAddon) {
                    fitAddon.fit();
                }
            };
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                if (term) {
                    term.dispose();
                }
                xtermRef.current = null;
                fitAddonRef.current = null;
            };
        };

        initTerminal();
    }, [mounted]);

    // Update terminal output
    useEffect(() => {
        if (!xtermRef.current || !output) return;

        // Only write new content
        if (output !== lastOutputRef.current) {
            const newContent = output.slice(lastOutputRef.current.length);
            if (newContent) {
                xtermRef.current.write(newContent);
            }
            lastOutputRef.current = output;
        }
    }, [output]);

    // Fit terminal on mount and when container size changes
    useEffect(() => {
        const observer = new ResizeObserver(() => {
            if (fitAddonRef.current) {
                fitAddonRef.current.fit();
            }
        });

        if (terminalRef.current) {
            observer.observe(terminalRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className="w-full h-full bg-slate-950 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 bg-slate-900/50">
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
            <div ref={terminalRef} className="flex-1 overflow-hidden p-2" />
        </div>
    );
}
