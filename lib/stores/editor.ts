import { atom } from 'nanostores';

// Locked files (prevent edits during AI generation)
export const lockedFiles = atom<Set<string>>(new Set());

// Terminal output buffer
export const terminalOutput = atom<string>('');

// Server status
export type ServerStatus = 'idle' | 'booting' | 'mounting' | 'installing' | 'starting' | 'ready' | 'error';
export const serverStatus = atom<ServerStatus>('idle');
