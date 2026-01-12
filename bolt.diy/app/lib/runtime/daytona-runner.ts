import { createScopedLogger } from '~/utils/logger';
import { validatePackageJson } from './package-json-validator';

const logger = createScopedLogger('DaytonaRunner');

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function withRetry<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return withRetry(operation, retries - 1);
        }
        throw error;
    }
}

export class DaytonaRunner {
    static sandboxId: string | null = null;
    static templateId: string = 'typescript'; // Default from Daytona docs
    private static activeOperations: Set<Promise<any>> = new Set();
    static activeUrl: string | null = null;
    static activeToken: string | null = null;

    // CRITICAL: Sandbox initialization lock to prevent multiple parallel sandbox creations
    private static sandboxInitPromise: Promise<void> | null = null;

    static async waitForAllOperations() {
        if (this.activeOperations.size > 0) {
            logger.info(`[Daytona] Waiting for ${this.activeOperations.size} active operations to complete...`);
            await Promise.all(Array.from(this.activeOperations));
            logger.info('[Daytona] All operations completed');
        }
    }

    // CRITICAL: Ensure sandbox is initialized before any operation
    // This prevents the race condition where multiple calls create multiple sandboxes
    private static async ensureSandboxInitialized() {
        // If sandbox already exists, return immediately
        if (this.sandboxId) {
            return;
        }

        // If initialization is already in progress, wait for it
        if (this.sandboxInitPromise) {
            logger.info('[Daytona] Waiting for ongoing sandbox initialization...');
            await this.sandboxInitPromise;
            return;
        }

        // Start sandbox initialization
        logger.info('[Daytona] Starting sandbox initialization...');
        this.sandboxInitPromise = (async () => {
            try {
                // Make a dummy request to trigger sandbox creation on server
                const response = await fetch('/api/daytona/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        command: 'echo "Initializing Daytona sandbox"',
                        sandboxId: null, // Force creation
                    }),
                });

                const result = await response.json();

                if (result.sandboxId) {
                    this.sandboxId = result.sandboxId;
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('daytona_sandbox_id', result.sandboxId);
                    }
                    logger.info(`[Daytona] Sandbox initialized: ${result.sandboxId}`);
                } else if (result.error) {
                    throw new Error(result.error);
                }
            } finally {
                // Clear the promise so future calls can retry if needed
                this.sandboxInitPromise = null;
            }
        })();

        await this.sandboxInitPromise;
    }

    static async executeShell(
        command: string,
        callbacks: { onStdout?: (data: string) => void; onStderr?: (data: string) => void },
    ) {
        logger.info(`[Daytona Client] Requesting execution: ${command}`);

        // CRITICAL: Ensure sandbox exists before executing command
        await this.ensureSandboxInitialized();

        try {
            const response = await withRetry(async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 300000);

                try {
                    const res = await fetch('/api/daytona/execute', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            command,
                            sandboxId: this.sandboxId,
                            template: this.templateId,
                        }),
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || `Server returned ${res.status}`);
                    }
                    return res;
                } catch (err) {
                    clearTimeout(timeoutId);
                    throw err;
                }
            });

            const result = await response.json();

            if (result.error) throw new Error(result.error);

            if ((result.stdout || result.stderr) && callbacks.onStdout) {
                const combinedOutput = (result.stdout || '') + (result.stderr || '');
                callbacks.onStdout(combinedOutput);
            }

            if (result.sandboxId) {
                this.sandboxId = result.sandboxId;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('daytona_sandbox_id', result.sandboxId);
                }
            }
            if (result.url) {
                this.activeUrl = result.url;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('daytona_preview_url', result.url);
                }
            }
            if (result.token) {
                this.activeToken = result.token;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('daytona_preview_token', result.token);
                }
            }

            return {
                exitCode: result.exitCode ?? 0,
                output: (result.stdout || '') + (result.stderr || ''),
                url: result.url,
                token: result.token,
            };
        } catch (err: any) {
            logger.error('Daytona API Request Failed', err);
            if (err.message?.includes('Sandbox not found')) {
                this.sandboxId = null;
                this.activeUrl = null;
                this.activeToken = null;
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('daytona_sandbox_id');
                    localStorage.removeItem('daytona_preview_url');
                    localStorage.removeItem('daytona_preview_token');
                }
            }
            throw err;
        }
    }

    // Initialize from localStorage if available
    static {
        if (typeof window !== 'undefined') {
            const storedId = localStorage.getItem('daytona_sandbox_id');
            if (storedId) {
                this.sandboxId = storedId;
                logger.info(`[Daytona Client] Restored sandbox ID from localStorage: ${storedId}`);
            }
            const storedUrl = localStorage.getItem('daytona_preview_url');
            if (storedUrl) {
                this.activeUrl = storedUrl;
                logger.info(`[Daytona Client] Restored preview URL from localStorage: ${storedUrl}`);
            }
            const storedToken = localStorage.getItem('daytona_preview_token');
            if (storedToken) {
                this.activeToken = storedToken;
                logger.info('[Daytona Client] Restored preview token from localStorage');
            }
        }
    }

    static getPreviewUrl() {
        // Assuming Daytona follows similar proxy pattern or returns a direct URL
        // If result.url is returned, use it. Otherwise, construct one?
        // Daytona URLs might be dynamic.
        return this.activeUrl;
    }

    static getPreviewToken() {
        return this.activeToken;
    }

    static applyPreviewToken(url?: string | null, token?: string | null) {
        if (!url || !token) {
            return url || null;
        }
        try {
            const previewUrl = new URL(url);
            if (!previewUrl.searchParams.has('DAYTONA_SANDBOX_AUTH_KEY')) {
                previewUrl.searchParams.set('DAYTONA_SANDBOX_AUTH_KEY', token);
            }
            return previewUrl.toString();
        } catch {
            return url;
        }
    }

    static async writeFile(path: string, content: string, encoding?: 'base64') {
        const validatedContent = validatePackageJson(path, content, true);
        logger.info(`[Daytona Client] Requesting file write: ${path}`);

        // CRITICAL: Ensure sandbox exists before writing file
        await this.ensureSandboxInitialized();

        const operationPromise = (async () => {
            try {
                const response = await withRetry(async () => {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);

                    try {
                        const res = await fetch('/api/daytona/execute', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                file: path,
                                content: validatedContent,
                                encoding,
                                sandboxId: this.sandboxId,
                                template: this.templateId,
                            }),
                            signal: controller.signal,
                        });
                        clearTimeout(timeoutId);

                        if (!res.ok) {
                            const errData = await res.json().catch(() => ({}));
                            throw new Error(errData.error || `Server returned ${res.status}`);
                        }
                        return res;
                    } catch (err) {
                        clearTimeout(timeoutId);
                        throw err;
                    }
                });

                const result = await response.json();
                if (result.sandboxId) {
                    this.sandboxId = result.sandboxId;
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('daytona_sandbox_id', result.sandboxId);
                    }
                }
            } catch (err: any) {
                logger.error('Daytona File Write Failed', err);
                throw err;
            }
        })();

        this.activeOperations.add(operationPromise);
        try {
            await operationPromise;
        } finally {
            this.activeOperations.delete(operationPromise);
        }
    }
}
