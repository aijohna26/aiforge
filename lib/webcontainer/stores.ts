import { atom } from 'nanostores';
import type { WebContainer } from '@webcontainer/api';

// WebContainer instance
export const webcontainerContext = atom<WebContainer | null>(null);

// Terminal output buffer
export const terminalOutput = atom<string>('');

// Preview URL for the iframe
export const previewUrl = atom<string | null>(null);

// QR Code URL for Expo Go
export const qrCodeUrl = atom<string | null>(null);

// Server status
export type ServerStatus = 'idle' | 'booting' | 'mounting' | 'installing' | 'starting' | 'ready' | 'error';
export const serverStatus = atom<ServerStatus>('idle');

// Locked files (prevent edits during AI generation)
export const lockedFiles = atom<Set<string>>(new Set());

// Helper to append to terminal output
export function appendTerminalOutput(data: string) {
    const current = terminalOutput.get();
    // Keep last 10000 characters to avoid memory issues
    const newOutput = (current + data).slice(-10000);
    terminalOutput.set(newOutput);
}

// Helper to clear terminal
export function clearTerminal() {
    terminalOutput.set('');
}
