import React, { useRef } from 'react';
import type { ThemeType } from '~/utils/theme';
import { BASE_VARIABLES } from '~/utils/theme';

interface PreviewFrameProps {
    html: string;
    title?: string;
    theme?: ThemeType;
    className?: string;
}

export const PreviewFrame: React.FC<PreviewFrameProps> = ({ html, title = 'Preview', theme, className }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Function to construct the full HTML document with Tailwind
    const getFullHtml = (content: string) => {
        // Use local proxy to bypass COEP/CORP issues with cdn.tailwindcss.com
        const tailwindUrl = `/api/image-proxy?url=${encodeURIComponent('https://cdn.tailwindcss.com')}`;

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="${tailwindUrl}"></script>
                <script>
                    tailwind.config = {
                        theme: {
                            extend: {
                                colors: {
                                    primary: 'var(--primary)',
                                    secondary: 'var(--secondary)',
                                    background: 'var(--background)',
                                    foreground: 'var(--foreground)',
                                    accent: 'var(--accent)',
                                    muted: 'var(--muted)',
                                    destructive: 'var(--destructive)',
                                    border: 'var(--border)',
                                    input: 'var(--input)',
                                    ring: 'var(--ring)',
                                    card: 'var(--card)',
                                    'card-foreground': 'var(--card-foreground)',
                                    popover: 'var(--popover)',
                                    'popover-foreground': 'var(--popover-foreground)'
                                },
                                borderRadius: {
                                    lg: 'var(--radius)',
                                    md: 'calc(var(--radius) - 2px)',
                                    sm: 'calc(var(--radius) - 4px)'
                                }
                            }
                        }
                    }
                </script>
                <style>
                    :root {
                        ${BASE_VARIABLES}
                        ${theme?.style || ''}
                    }
                    body { 
                        margin: 0; 
                        padding: 0; 
                        overflow-x: hidden; 
                        background-color: var(--background, white); 
                        color: var(--foreground, #111827);
                        font-family: var(--font-sans), sans-serif;
                    }
                    ::-webkit-scrollbar { width: 6px; height: 6px; }
                    ::-webkit-scrollbar-track { background: transparent; }
                    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                </style>
            </head>
            <body class="bg-white min-h-screen">
                <div id="root" class="h-full w-full">${content}</div>
                <script>
                    // Error catching
                    window.onerror = function(message, source, lineno, colno, error) {
                        window.parent.postMessage({ type: 'preview-error', message }, '*');
                    };
                </script>
            </body>
            </html>
        `;
    };

    return (
        <iframe
            ref={iframeRef}
            title={title}
            className={`w-full h-full border-0 ${className || ''}`}
            srcDoc={getFullHtml(html)}
            sandbox="allow-scripts allow-popups allow-forms"
        />
    );
};
