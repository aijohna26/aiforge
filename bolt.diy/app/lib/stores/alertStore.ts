import { atom } from 'nanostores';

export interface AlertPayload {
    message: string;
    description: string;
}

export const alertStore = atom<AlertPayload | null>(null);

export function showAlert(payload: AlertPayload) {
    alertStore.set(payload);
}

export function hideAlert() {
    alertStore.set(null);
}
