import { atom } from 'nanostores';

export const expoUrlAtom = atom<string | null>(null);
export const webPreviewReadyAtom = atom<boolean>(false);
