import React, { useRef } from 'react';
import type { ThemeType } from '~/utils/theme';
import { BASE_VARIABLES } from '~/utils/theme';

interface PreviewFrameProps {
    html: string;
    id?: string;
    title?: string;
    theme?: ThemeType;
    className?: string;
    isCapturing?: boolean;
}

export const PreviewFrame: React.FC<PreviewFrameProps> = ({ html, id = 'preview', title = 'Preview', theme, className, isCapturing = false }) => {
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
                                    'primary-foreground': 'var(--primary-foreground)',
                                    secondary: 'var(--secondary)',
                                    'secondary-foreground': 'var(--secondary-foreground)',
                                    background: 'var(--background)',
                                    foreground: 'var(--foreground)',
                                    accent: 'var(--accent)',
                                    'accent-foreground': 'var(--accent-foreground)',
                                    muted: 'var(--muted)',
                                    'muted-foreground': 'var(--muted-foreground)',
                                    destructive: 'var(--destructive)',
                                    'destructive-foreground': 'var(--destructive-foreground)',
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
                    ::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.8); border-radius: 3px; }
                    ::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.95); }
                </style>
            </head>
            <body class="bg-background min-h-screen">
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

    if (isCapturing) {
        return (
            <div className={`w-full h-full bg-background relative overflow-hidden ${className || ''}`} style={{ fontFamily: 'var(--font-sans), sans-serif' }}>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    :root {
                        ${BASE_VARIABLES}
                        ${theme?.style || ''}
                    }
                    .capture-root-${id} {
                        background-color: var(--background, transparent);
                        color: var(--foreground, #111827);
                    }
                `}} />
                <div
                    className={`capture-root-${id} h-full w-full bg-background`}
                    dangerouslySetInnerHTML={{ __html: html }}
                    data-tailwind-capture="true"
                />
            </div>
        );
    }

    return (
        <iframe
            ref={iframeRef}
            title={title}
            className={`w-full h-full border-0 ${className || ''}`}
            srcDoc={getFullHtml(html)}
            sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
        />
    );
};
