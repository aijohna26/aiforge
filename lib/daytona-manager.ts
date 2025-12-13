import { Daytona, Sandbox } from '@daytonaio/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';


export interface SandboxConfig {
    projectId: string;
    userId: string;
    files: Array<{ path: string; content: string }>;
}

export interface SandboxInstance {
    id: string;
    url: string;
    tunnelUrl: string | null;
    previewToken: string | null;
    status: 'creating' | 'running' | 'stopping' | 'error';
    createdAt: number;
    expiresAt: number;
}

class DaytonaManager {
    private client: Daytona;
    private sandboxes = new Map<string, SandboxInstance>();
    private activeSandboxes = new Map<string, Sandbox>();

    constructor() {
        const apiKey = process.env.DAYTONA_API_KEY;
        if (!apiKey) {
            throw new Error('DAYTONA_API_KEY environment variable is required');
        }

        this.client = new Daytona({ apiKey });
    }

    async createSandbox(config: SandboxConfig, timeoutMinutes: number = 10): Promise<SandboxInstance> {
        console.log(`[Daytona] Creating sandbox for project ${config.projectId}...`);

        try {
            // Create sandbox with unique name to avoid conflicts
            const uniqueName = `${config.projectId}-${Date.now()}`;
            // @ts-ignore - public property might not be in type definition yet
            const sandbox = await this.client.create({
                name: uniqueName,
                language: 'javascript',
                image: 'node:20',
                public: true, // Make sandbox public for preview access
            });
            console.log(`[Daytona] Sandbox created: ${sandbox.id}`);


            // Define workspace directory
            const WORK_DIR = '/home/daytona/workspace';
            // Ensure workspace exists (idempotent)
            await sandbox.process.executeCommand(`mkdir -p ${WORK_DIR}`);

            // Create a temporary directory for uploads
            const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'daytona-upload-'));

            try {
                // Write project files
                for (const file of config.files) {
                    // Create remote directory if needed
                    // Ensure we use posix paths for the remote sandbox
                    const remotePath = path.posix.join(WORK_DIR, file.path);
                    const remoteDir = path.posix.dirname(remotePath);

                    if (remoteDir !== '.' && remoteDir !== '/') {
                        await sandbox.process.executeCommand(`mkdir -p "${remoteDir}"`);
                    }

                    // Upload file using Buffer
                    // @ts-ignore - uploadFile supports Buffer in this SDK version
                    await sandbox.fs.uploadFile(Buffer.from(file.content), remotePath);
                }
                console.log(`[Daytona] Files uploaded successfully`);
            } finally {
                // Cleanup temp dir (if we used it, but we aren't anymore)
                await fs.promises.rm(tempDir, { recursive: true, force: true });
            }

            // Create session first
            const sessionId = `expo-${config.projectId}`;
            console.log(`[Daytona] Creating Expo session: ${sessionId}`);
            await sandbox.process.createSession(sessionId);

            // Run setup and execution in background
            // 1. Install dependencies
            // 2. Start Expo web server (React Native Web)
            console.log(`[Daytona] Starting background setup (install + expo web)...`);

            const setupCommand = [
                `cd ${WORK_DIR}`,
                'npm install --legacy-peer-deps',
                // Start Expo web on port 8081
                'npx expo start --web --port 8081 > expo-web.log 2>&1'
            ].join(' && ');

            // Execute as one long async command
            await sandbox.process.executeSessionCommand(sessionId, {
                command: `(${setupCommand}) &`,
                async: true,
            });

            // Get preview URL - poll until ready
            let tunnelUrl = 'initializing';
            let previewToken: string | null = null;

            // Start background task to get preview URL when ready
            this.pollForPreviewUrl(sandbox, config.projectId, 8081).catch(err => {
                console.error('[Daytona] Preview URL polling failed:', err);
            });

            console.log(`[Daytona] Sandbox created, preview URL will be available shortly...`);

            const instance: SandboxInstance = {
                id: sandbox.id,
                url: `http://localhost:8081`, // Placeholder
                tunnelUrl,
                previewToken,
                status: 'running',
                createdAt: Date.now(),
                expiresAt: Date.now() + timeoutMinutes * 60 * 1000,
            };

            this.sandboxes.set(config.projectId, instance);
            this.activeSandboxes.set(config.projectId, sandbox);
            console.log(`[Daytona] Stored sandbox in map with projectId: ${config.projectId}`);
            console.log(`[Daytona] Total sandboxes in memory: ${this.sandboxes.size}`);

            // Schedule auto-cleanup
            setTimeout(() => {
                this.destroySandbox(config.projectId);
            }, timeoutMinutes * 60 * 1000);

            console.log(`[Daytona] Sandbox ready, tunnel URL: ${tunnelUrl} (will update when available)`);
            return instance;

        } catch (error) {
            console.error('[Daytona] Sandbox creation failed:', error);
            throw error;
        }
    }

    async getSandbox(projectId: string): Promise<SandboxInstance | null> {
        return this.sandboxes.get(projectId) || null;
    }

    updateSandbox(projectId: string, updates: Partial<Pick<SandboxInstance, 'tunnelUrl' | 'previewToken'>>) {
        const current = this.sandboxes.get(projectId);
        if (!current) return;
        this.sandboxes.set(projectId, { ...current, ...updates });
    }

    getActiveSandbox(projectId: string): Sandbox | null {
        return this.activeSandboxes.get(projectId) || null;
    }

    async destroySandbox(projectId: string): Promise<void> {
        const instance = this.sandboxes.get(projectId);
        if (!instance) {
            return;
        }

        // The outer try/catch handles general errors during the destruction process.
        // The inner try/catch specifically handles the sandbox.delete() call.
        try {
            const sandbox = this.activeSandboxes.get(projectId);
            if (sandbox) {
                try {
                    console.log(`[Daytona] Destroying sandbox ${sandbox.id}...`);
                    await sandbox.delete();
                    console.log(`[Daytona] Sandbox ${sandbox.id} destroyed`);
                } catch (error: any) {
                    // Ignore if sandbox not found (already deleted) or conflict (concurrent operation)
                    if (error.message?.includes('not found') || error.status === 404 || error.code === 404 || error.status === 409 || error.statusCode === 409) {
                        console.log(`[Daytona] Sandbox ${sandbox.id} was already deleted or being modified.`);
                    } else {
                        console.error(`[Daytona] Failed to destroy sandbox:`, error);
                    }
                }
                this.activeSandboxes.delete(projectId);
            }

            this.sandboxes.delete(projectId);
            // This log is for the overall destruction process, after internal maps are cleared.
            console.log(`[Daytona] Sandbox instance data cleared for ${projectId}`);
        } catch (error) {
            console.error('[Daytona] Failed to clean up sandbox data:', error);
        }
    }

    async extendTimeout(projectId: string, additionalMinutes: number): Promise<void> {
        const instance = this.sandboxes.get(projectId);
        if (!instance) {
            throw new Error('Sandbox not found');
        }

        instance.expiresAt += additionalMinutes * 60 * 1000;
        console.log(`[Daytona] Extended timeout for ${projectId} by ${additionalMinutes} minutes`);
    }

    async findExistingSandbox(projectId: string): Promise<Sandbox | null> {
        try {
            const result = await this.client.list();
            let sandboxes: any[] = [];

            if (Array.isArray(result)) {
                sandboxes = result;
            } else {
                // Handle the wrapped response structure
                const arrayKey = Object.keys(result).find(key => Array.isArray((result as any)[key]));
                if (arrayKey) {
                    sandboxes = (result as any)[arrayKey];
                }
            }

            const found = sandboxes.find((s: any) => s.name === projectId || s.id === projectId);
            return found || null;
        } catch (error) {
            console.error('[Daytona] Error listing sandboxes:', error);
            return null;
        }
    }

    getTimeoutForPlan(plan: 'free' | 'pro' | 'business'): number {
        switch (plan) {
            case 'free':
                return 10; // 10 minutes
            case 'pro':
                return 30; // 30 minutes
            case 'business':
                return 60; // 60 minutes
            default:
                return 10;
        }
    }

    /**
     * Poll for preview URL until it's ready
     * Daytona preview links take time to provision
     */
    private async pollForPreviewUrl(sandbox: Sandbox, projectId: string, port: number): Promise<void> {
        const maxAttempts = 60; // Try for up to 3 minutes (60 * 3s)
        let attempts = 0;

        const poll = async () => {
            attempts++;
            console.log(`[Daytona] Polling for preview URL attempt ${attempts}/${maxAttempts}`);

            try {
                const previewInfo = await sandbox.getPreviewLink(port);
                const url = previewInfo.url;
                const token = previewInfo.token || null;

                // Check if we got a real URL (not "initializing" or similar placeholder)
                if (url && url.startsWith('http') && !url.includes('localhost') && url !== 'initializing' && url !== 'pending') {
                    console.log(`[Daytona] Preview URL ready: ${url}`);
                    this.updateSandbox(projectId, { tunnelUrl: url, previewToken: token });
                    return;
                }

                console.log(`[Daytona] Preview URL not ready yet (got: ${url}), retrying...`);
            } catch (error) {
                console.error(`[Daytona] Error getting preview link:`, error);
            }

            // Continue polling if not ready and under max attempts
            if (attempts < maxAttempts) {
                setTimeout(() => poll(), 3000); // Poll every 3 seconds
            } else {
                console.error(`[Daytona] Failed to get preview URL after ${maxAttempts} attempts`);
            }
        };

        poll();
    }
}

// Singleton instance that survives hot module reloading
// Store in globalThis to prevent HMR from clearing the state
const globalForDaytona = globalThis as unknown as {
    daytonaManager: DaytonaManager | undefined;
};

export const daytonaManager = globalForDaytona.daytonaManager ?? new DaytonaManager();

// Preserve the instance across HMR
if (process.env.NODE_ENV !== 'production') {
    globalForDaytona.daytonaManager = daytonaManager;
}
