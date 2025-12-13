import { Sandbox } from 'e2b';

export interface SandboxConfig {
    projectId: string;
    userId: string;
    files: Array<{ path: string; content: string }>;
}

export interface SandboxInstance {
    id: string;
    url: string;
    status: 'creating' | 'running' | 'stopping' | 'error';
    createdAt: number;
    expiresAt: number;
    logs: Array<{ timestamp: number; message: string; type: 'stdout' | 'stderr' | 'info' }>;
}

class E2BManager {
    private sandboxes = new Map<string, SandboxInstance>();
    private activeSandboxes = new Map<string, Sandbox>();
    private creationLocks = new Map<string, Promise<SandboxInstance>>();
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.E2B_API_KEY || '';
        if (!this.apiKey) {
            console.warn('[E2B] No API key found. Sandboxes will not work.');
        }
    }

    async createSandbox(config: SandboxConfig, timeoutMinutes: number = 10): Promise<SandboxInstance> {
        const projectId = config.projectId;

        // Check if there's already a creation in progress
        const existingLock = this.creationLocks.get(projectId);
        if (existingLock) {
            console.log(`[E2B] Sandbox creation already in progress for ${projectId}, waiting...`);
            return existingLock;
        }

        // Create a new lock promise
        const creationPromise = this.doCreateSandbox(config, timeoutMinutes);
        this.creationLocks.set(projectId, creationPromise);

        try {
            const result = await creationPromise;
            return result;
        } finally {
            // Remove lock when done
            this.creationLocks.delete(projectId);
        }
    }

    private async doCreateSandbox(config: SandboxConfig, timeoutMinutes: number): Promise<SandboxInstance> {
        console.log(`[E2B] Creating sandbox for project ${config.projectId}...`);
        console.log(`[E2B] Config received - files count:`, config.files ? config.files.length : 'undefined');
        console.log(`[E2B] Config files array:`, config.files);

        // Destroy existing sandbox if any
        const existing = await this.getSandbox(config.projectId);
        if (existing) {
            console.log(`[E2B] Destroying existing sandbox before creating new one...`);
            await this.destroySandbox(config.projectId);
        }

        try {
            // Create E2B sandbox with Node.js environment
            const sandbox = await Sandbox.create('base', {
                apiKey: this.apiKey,
                timeoutMs: timeoutMinutes * 60 * 1000,
            });

            console.log(`[E2B] Sandbox created: ${sandbox.sandboxId}`);
            console.log(`[E2B] About to upload ${config.files.length} files...`);
            console.log(`[E2B] Files to upload:`, config.files.map(f => f.path));

            // Write all files to the sandbox
            // E2B automatically creates parent directories
            console.log(`[E2B] Writing ${config.files.length} files to sandbox...`);
            for (const file of config.files) {
                try {
                    const filePath = `/home/user/${file.path}`;
                    console.log(`[E2B] Writing file: ${filePath} (${file.content.length} bytes)`);
                    await sandbox.files.write(filePath, file.content);
                    console.log(`[E2B] ✓ Written: ${filePath}`);
                } catch (error) {
                    console.error(`[E2B] Failed to write file ${file.path}:`, error);
                    throw new Error(`Failed to write file ${file.path}: ${error}`);
                }
            }

            console.log(`[E2B] All files written successfully`);

            // Verify files exist
            try {
                const lsResult = await sandbox.commands.run('ls -la /home/user');
                console.log(`[E2B] Directory listing after upload:\n${lsResult.stdout}`);

                // Check if package.json exists (critical file)
                const packageCheck = await sandbox.commands.run('test -f /home/user/package.json && echo "EXISTS" || echo "MISSING"');
                console.log(`[E2B] package.json check: ${packageCheck.stdout.trim()}`);

                if (packageCheck.stdout.trim() === 'MISSING') {
                    throw new Error('package.json was not uploaded successfully');
                }
            } catch (error) {
                console.error('[E2B] File verification failed:', error);
                throw error;
            }

            // Install dependencies and start Expo dev server IN BACKGROUND
            // Don't wait - return immediately with placeholder URL
            console.log(`[E2B] Starting background installation and Expo server...`);

            // Get the preview URL immediately (even though server isn't ready yet)
            const expoPort = 3000;
            const url = `https://${sandbox.getHost(expoPort)}`;
            console.log(`[E2B] Preview URL (will be ready soon): ${url}`);

            const instance: SandboxInstance = {
                id: sandbox.sandboxId,
                url, // Set real URL immediately
                status: 'running',
                createdAt: Date.now(),
                expiresAt: Date.now() + timeoutMinutes * 60 * 1000,
                logs: [],
            };

            this.sandboxes.set(config.projectId, instance);
            this.activeSandboxes.set(config.projectId, sandbox);

            console.log(`[E2B] Stored sandbox in map with projectId: ${config.projectId}`);
            console.log(`[E2B] Total sandboxes in memory: ${this.sandboxes.size}`);

            // Start Expo in background - don't await
            this.startExpoInBackground(sandbox, config.projectId, url, timeoutMinutes).catch(err => {
                console.error('[E2B] Background Expo start failed:', err);
            });

            console.log(`[E2B] Returning instance with URL: ${instance.url}`);
            return instance;

        } catch (error) {
            console.error('[E2B] Sandbox creation failed:', error);
            throw error;
        }
    }

    async getSandbox(projectId: string): Promise<SandboxInstance | null> {
        return this.sandboxes.get(projectId) || null;
    }

    getActiveSandbox(projectId: string): Sandbox | null {
        return this.activeSandboxes.get(projectId) || null;
    }

    async destroySandbox(projectId: string): Promise<void> {
        const instance = this.sandboxes.get(projectId);
        if (!instance) {
            console.log(`[E2B] No sandbox found for ${projectId} to destroy`);
            return;
        }

        try {
            const sandbox = this.activeSandboxes.get(projectId);
            if (sandbox) {
                try {
                    console.log(`[E2B] Killing sandbox ${sandbox.sandboxId}...`);
                    await sandbox.kill();
                    console.log(`[E2B] Sandbox ${sandbox.sandboxId} killed successfully`);
                } catch (error: any) {
                    // Ignore if already killed
                    if (!error.message?.includes('not found') && error.status !== 404) {
                        console.error(`[E2B] Failed to kill sandbox:`, error);
                    } else {
                        console.log(`[E2B] Sandbox ${sandbox.sandboxId} already terminated`);
                    }
                }
                this.activeSandboxes.delete(projectId);
            }

            this.sandboxes.delete(projectId);
            console.log(`[E2B] Sandbox instance data cleared for ${projectId}`);
        } catch (error) {
            console.error('[E2B] Failed to clean up sandbox data:', error);
        }
    }

    private async startExpoInBackground(sandbox: Sandbox, projectId: string, finalUrl: string, timeoutMinutes: number) {
        try {
            const runId = Date.now().toString().slice(-4);
            console.log(`[E2B] Background [${runId}]: Starting npm install and Expo for ${projectId}...`);

            // First, verify files are there
            const lsTest = await sandbox.commands.run('ls -la /home/user');
            console.log('[E2B] Background: Files in /home/user:', lsTest.stdout);

            // 1. Run yarn install SYNCHRONOUSLY (await it)
            // This ensures dependencies are installed before we try to start the server
            console.log('[E2B] Background: Running yarn install (this may take 1-2 mins)...');
            const installStart = Date.now();

            const npmInstall = await sandbox.commands.run(
                'cd /home/user && yarn install',
                {
                    timeoutMs: 5 * 60 * 1000, // 5 minutes timeout for install
                    onStdout: (data) => {
                        const msg = `[yarn install] ${data.trim()}`;
                        console.log(`[E2B] ${msg}`);
                        this.addLog(projectId, msg, 'stdout');
                    },
                    onStderr: (data) => {
                        const msg = `[yarn install] ${data.trim()}`;
                        console.log(`[E2B] ${msg}`);
                        this.addLog(projectId, msg, 'stderr');
                    }
                }
            );

            console.log(`[E2B] Background: yarn install finished in ${(Date.now() - installStart) / 1000}s`);
            console.log('[E2B] Background: yarn install exit code:', npmInstall.exitCode);

            if (npmInstall.exitCode !== 0) {
                console.error('[E2B] Background: yarn install FAILED!');
                return;
            }

            // 2. Start Expo in background (like bolt.diy - no --web flag for mobile support)
            console.log('[E2B] Background: Starting Expo server with tunnel for mobile preview...');
            await sandbox.commands.run(
                'cd /home/user && EXPO_NO_TELEMETRY=1 npx expo start --tunnel',
                {
                    background: true,
                    onStdout: (data) => {
                        if (data.includes('Web is waiting') || data.includes('Metro waiting') || data.includes('Listening on') || data.includes('exp://')) {
                            console.log('[E2B] Background: Expo is ready! Output:', data.trim());
                        }
                        this.addLog(projectId, `[Expo] ${data.trim()}`, 'stdout');
                    },
                    onStderr: (data) => {
                        console.log(`[E2B] Expo stderr: ${data.trim()}`);
                        this.addLog(projectId, `[Expo] ${data.trim()}`, 'stderr');
                    }
                }
            );

            console.log('[E2B] Background: Expo process started in background');
            console.log(`[E2B] Background: Preview should be available at ${finalUrl} shortly`);

            // Schedule auto-cleanup
            setTimeout(() => {
                this.destroySandbox(projectId);
            }, timeoutMinutes * 60 * 1000);

        } catch (error) {
            console.error(`[E2B] Background: Failed to start Expo for ${projectId}:`, error);
        }
    }

    async extendTimeout(projectId: string, additionalMinutes: number): Promise<void> {
        const instance = this.sandboxes.get(projectId);
        if (!instance) {
            throw new Error('Sandbox not found');
        }

        instance.expiresAt += additionalMinutes * 60 * 1000;
        console.log(`[E2B] Extended timeout for ${projectId} by ${additionalMinutes} minutes`);
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
    private addLog(projectId: string, message: string, type: 'stdout' | 'stderr' | 'info') {
        const instance = this.sandboxes.get(projectId);
        if (instance) {
            instance.logs.push({
                timestamp: Date.now(),
                message,
                type
            });
        }
    }
}

// Singleton instance that survives hot module reloading
const globalForE2B = globalThis as unknown as {
    e2bManager: E2BManager | undefined;
};

export const e2bManager = globalForE2B.e2bManager ?? new E2BManager();

// Preserve the instance across HMR
if (process.env.NODE_ENV !== 'production') {
    globalForE2B.e2bManager = e2bManager;
}
