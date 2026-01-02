import { createScopedLogger } from '~/utils/logger';
import { validatePackageJson } from './package-json-validator';

const logger = createScopedLogger('E2BRunner');

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function withRetry<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return withRetry(operation, retries - 1);
        }
        throw error;
    }
}

export class E2BRunner {
    static sandboxId: string | null = null;
    static templateId: string = 'base'; // Use base template - we write all files ourselves
    private static activeOperations: Set<Promise<any>> = new Set();

    static async waitForAllOperations() {
        if (this.activeOperations.size > 0) {
            logger.info(`[E2B] Waiting for ${this.activeOperations.size} active operations to complete...`);
            await Promise.all(Array.from(this.activeOperations));
            logger.info('[E2B] All operations completed');
        }
    }

    static async executeShell(command: string, callbacks: { onStdout?: (data: string) => void; onStderr?: (data: string) => void }) {
        logger.info(`[E2B Client] Requesting execution: ${command} (Sandbox: ${this.sandboxId}, Template: ${this.templateId})`);

        // Call the API route
        try {
            const response = await withRetry(async () => {
                const controller = new AbortController();
                // 5 minute timeout for shell commands to allow npm install
                const timeoutId = setTimeout(() => controller.abort(), 300000);

                try {
                    const res = await fetch('/api/e2b/execute', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            command,
                            sandboxId: this.sandboxId,
                            template: this.templateId
                        }),
                        signal: controller.signal
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

            // Send captured output to the terminal via callbacks
            if ((result.stdout || result.stderr) && callbacks.onStdout) {
                const combinedOutput = (result.stdout || '') + (result.stderr || '');
                callbacks.onStdout(combinedOutput);
            }

            if (result.sandboxId) {
                this.sandboxId = result.sandboxId;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('e2b_sandbox_id', result.sandboxId);
                }
            }
            if (result.url) {
                this.activeUrl = result.url;
                if (typeof window !== 'undefined') {
                    localStorage.setItem('e2b_preview_url', result.url);
                }
            }

            return {
                exitCode: result.exitCode ?? 0,
                output: (result.stdout || '') + (result.stderr || ''),
                url: result.url
            };
        } catch (err: any) {
            logger.error('E2B API Request Failed', err);
            // Only reset if we are sure it's a dead sandbox and not a transient error
            if (err.message?.includes('Sandbox not found') || err.message?.includes('not running')) {
                this.sandboxId = null;
                this.activeUrl = null;
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('e2b_sandbox_id');
                    localStorage.removeItem('e2b_preview_url');
                }
            }
            throw err;
        }
    }

    static activeUrl: string | null = null;

    // Initialize from localStorage if available
    static {
        if (typeof window !== 'undefined') {
            const storedId = localStorage.getItem('e2b_sandbox_id');
            if (storedId) {
                this.sandboxId = storedId;
                logger.info(`[E2B Client] Restored sandbox ID from localStorage: ${storedId}`);
            }
            const storedUrl = localStorage.getItem('e2b_preview_url');
            if (storedUrl) {
                this.activeUrl = storedUrl;
                logger.info(`[E2B Client] Restored preview URL from localStorage: ${storedUrl}`);
            }
        }
    }

    static getPreviewUrl() {
        return this.activeUrl || (this.sandboxId ? `/api/proxy?url=${encodeURIComponent(`https://${this.sandboxId}-8081.e2b.dev`)}` : null);
    }

    static async writeFile(path: string, content: string, encoding?: 'base64') {
        // Validate and auto-fix package.json before writing (uses shared validator)
        const validatedContent = validatePackageJson(path, content);
        logger.info(`[E2B Client] Requesting file write: ${path}${encoding ? ' (binary)' : ''} (Sandbox: ${this.sandboxId})`);

        // Track this operation
        const operationPromise = (async () => {
            try {
                const response = await withRetry(async () => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

                try {
                    const res = await fetch('/api/e2b/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            file: path,
                            content: validatedContent,
                            encoding,
                            sandboxId: this.sandboxId,
                            template: this.templateId
                        }),
                        signal: controller.signal
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
                        localStorage.setItem('e2b_sandbox_id', result.sandboxId);
                    }
                }
            } catch (err: any) {
                logger.error('E2B File Write Failed', err);
                // Only reset if we are sure it's a dead sandbox and not a transient error
                if (err.message?.includes('Sandbox not found') || err.message?.includes('not running')) {
                    this.sandboxId = null;
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('e2b_sandbox_id');
                    }
                }
                throw err;
            }
        })();

        // Track and return the operation
        this.activeOperations.add(operationPromise);
        try {
            await operationPromise;
        } finally {
            this.activeOperations.delete(operationPromise);
        }
    }
}
