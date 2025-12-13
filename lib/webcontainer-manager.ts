import { WebContainer } from '@webcontainer/api';
import type { FileSystemTree } from '@webcontainer/api';

export class WebContainerManager {
    private static instance: WebContainer | null = null;
    private static initPromise: Promise<WebContainer> | null = null;

    static async getInstance(): Promise<WebContainer> {
        if (this.instance) {
            return this.instance;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = WebContainer.boot();
        this.instance = await this.initPromise;
        return this.instance;
    }

    static async mountFiles(files: Array<{ path: string; content: string }>) {
        const container = await this.getInstance();

        // Convert files to WebContainer FileSystemTree format
        const fileTree: FileSystemTree = {};

        files.forEach(file => {
            const parts = file.path.split('/');
            let current: any = fileTree;

            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (!current[part]) {
                    current[part] = {
                        directory: {}
                    };
                }
                current = current[part].directory;
            }

            const filename = parts[parts.length - 1];
            current[filename] = {
                file: {
                    contents: file.content
                }
            };
        });

        await container.mount(fileTree);
        console.log('[WebContainer] Files mounted successfully');
    }

    static async runCommand(command: string, args: string[] = []): Promise<void> {
        const container = await this.getInstance();
        const process = await container.spawn(command, args);

        process.output.pipeTo(new WritableStream({
            write(data) {
                console.log('[WebContainer]', data);
            }
        }));

        const exitCode = await process.exit;
        if (exitCode !== 0) {
            throw new Error(`Command failed with exit code ${exitCode}`);
        }
    }

    static async installDependencies() {
        console.log('[WebContainer] Installing dependencies...');
        await this.runCommand('npm', ['install']);
        console.log('[WebContainer] Dependencies installed');
    }

    static async startMetro(onBundle: (bundleUrl: string) => void) {
        const container = await this.getInstance();

        console.log('[WebContainer] Starting Metro bundler...');
        const process = await container.spawn('npx', ['expo', 'start', '--web']);

        process.output.pipeTo(new WritableStream({
            write(data) {
                const output = data.toString();
                console.log('[Metro]', output);

                // Capture webpack dev server URL
                const match = output.match(/https?:\/\/localhost:\d+/);
                if (match) {
                    onBundle(match[0]);
                }
            }
        }));

        return process;
    }

    static async getServerUrl(): Promise<string> {
        const container = await this.getInstance();
        // WebContainer dev server runs on port 3000 by default
        const url = await container.on('server-ready', (port) => {
            return `http://localhost:${port}`;
        });
        return url as unknown as string;
    }
}
