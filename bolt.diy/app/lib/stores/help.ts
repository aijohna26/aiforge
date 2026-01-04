import { atom } from 'nanostores';

export type HelpSection =
    | 'Docs'
    | 'Tutorials'
    | 'API Reference'
    | 'Forum'
    | 'Discord'
    | 'Twitter'
    | 'Report a Bug'
    | 'Contact Support'
    | 'Live Chat'
    | 'Terms of Service'
    | 'Privacy Policy'
    | string;

export const selectedHelpSection = atom<HelpSection>('Docs');
