import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import { webcontainerContext, serverStatus, appendTerminalOutput, previewUrl, qrCodeUrl } from './stores';
import type { GeneratedFile } from '@/lib/types';

let webContainerInstance: WebContainer | null = null;

const decoder = new TextDecoder();

const PREVIEW_DEPENDENCIES = {
    expo: '^54.0.0',
    'expo-router': '~6.0.0',
    'expo-status-bar': '~3.0.0',
    react: '19.1.0',
    'react-dom': '19.1.0',
    'react-native': '0.81.4',
    'react-native-web': '~0.21.2',
    'react-native-safe-area-context': '5.1.0',
    'react-native-screens': '~4.6.0',
    'expo-linking': '~7.0.0',
};

const PREVIEW_DEV_DEPENDENCIES = {
    '@types/react': '~19.0.10',
    typescript: '~5.8.3',
};

const REQUIRED_NPM_CONFIG = [
    'legacy-peer-deps=true',
    'strict-peer-dependencies=false',
    'auto-install-peers=true',
    'fund=false',
    'audit=false',
    'engine-strict=false',
];

function buildNpmrc(base?: string) {
    const lines = base
        ? base
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean)
        : [];
    const seen = new Set(lines);
    for (const entry of REQUIRED_NPM_CONFIG) {
        if (!seen.has(entry)) {
            lines.push(entry);
            seen.add(entry);
        }
    }
    return lines.join('\n') + '\n';
}

const DEFAULT_NPMRC = buildNpmrc();

function preparePackageJson(original: string): string {
    try {
        const pkg = JSON.parse(original);
        pkg.private = pkg.private ?? true;

        pkg.scripts = {
            start: 'expo start',
            web: 'expo start --web',
            android: 'expo start --android',
            ios: 'expo start --ios',
            ...(pkg.scripts || {}),
        };

        pkg.dependencies = {
            ...(pkg.dependencies || {}),
            ...PREVIEW_DEPENDENCIES,
        };

        pkg.devDependencies = {
            ...(pkg.devDependencies || {}),
            ...PREVIEW_DEV_DEPENDENCIES,
        };

        return JSON.stringify(pkg, null, 2);
    } catch (error) {
        console.warn('[WebContainer] Failed to parse package.json, using original', error);
        return original;
    }
}

function appendOutput(data: string | Uint8Array) {
    const text = typeof data === 'string' ? data : decoder.decode(data);
    appendTerminalOutput(text);
}

function ensureWebPlatform(original: string): string {
    try {
        const parsed = JSON.parse(original);
        if (parsed?.expo?.platforms) {
            const platforms: string[] = Array.isArray(parsed.expo.platforms)
                ? parsed.expo.platforms
                : [];
            if (!platforms.includes('web')) {
                platforms.push('web');
                parsed.expo.platforms = platforms;
                return JSON.stringify(parsed, null, 2);
            }
        }
    } catch (error) {
        console.warn('[WebContainer] Failed to normalize app.json:', error);
    }
    return original;
}

export async function bootWebContainer() {
    if (webContainerInstance) return webContainerInstance;

    serverStatus.set('booting');
    try {
        webContainerInstance = await WebContainer.boot({
            coep: 'credentialless',
            workdirName: 'project',
            forwardPreviewErrors: true,
        });
        webcontainerContext.set(webContainerInstance);
        serverStatus.set('ready');
        return webContainerInstance;
    } catch (error) {
        serverStatus.set('error');
        console.error('Failed to boot WebContainer:', error);
        throw error;
    }
}

export async function mountProject(files: GeneratedFile[]) {
    const instance = await bootWebContainer();
    serverStatus.set('mounting');

    const tree: FileSystemTree = {};
    let hasNpmrc = false;

    for (const file of files) {
        const parts = file.path.split('/').filter(Boolean);
        let current = tree;
        let fileContents = file.content;
        if (file.path === '.npmrc') {
            hasNpmrc = true;
            fileContents = buildNpmrc(file.content);
        }

        if (file.path === 'app.json') {
            fileContents = ensureWebPlatform(fileContents);
        }

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                // File
                current[part] = {
                    file: {
                        contents: file.path === 'package.json'
                            ? preparePackageJson(file.content)
                            : fileContents
                    }
                };
            } else {
                // Directory
                if (!current[part]) {
                    current[part] = {
                        directory: {}
                    };
                }
                // @ts-ignore - we know it's a directory
                current = current[part].directory;
            }
        }
    }

    if (!hasNpmrc) {
        tree['.npmrc'] = {
            file: {
                contents: DEFAULT_NPMRC
            }
        };
    }

    await instance.mount(tree);
    serverStatus.set('ready');
}

export async function installDependencies() {
    console.log('[WebContainer] installDependencies called');
    const instance = await bootWebContainer();
    serverStatus.set('installing');

    // Force clean install to fix corrupted dependencies
    console.log('[WebContainer] Removing node_modules...');
    await instance.spawn('rm', ['-rf', 'node_modules', 'package-lock.json']);

    console.log('[WebContainer] Running npm install...');
    appendTerminalOutput('\n📦 Installing dependencies...\n');

    const process = await instance.spawn('npm', ['install', '--legacy-peer-deps', '--no-audit', '--no-fund'], {
        env: {
            NPM_CONFIG_ENGINE_STRICT: 'false',
            npm_config_engine_strict: 'false',
        }
    });

    process.output.pipeTo(new WritableStream({
        write(data) {
            appendOutput(data);
        }
    }));

    console.log('[WebContainer] Waiting for npm install to complete...');
    const exitCode = await process.exit;
    console.log('[WebContainer] npm install exited with code:', exitCode);

    if (exitCode !== 0) {
        serverStatus.set('error');
        appendTerminalOutput(`\n❌ npm install failed with exit code ${exitCode}\n`);
        throw new Error('Installation failed');
    }

    console.log('[WebContainer] installDependencies completed successfully');
    appendTerminalOutput('\n✅ Dependencies installed successfully\n');
    serverStatus.set('ready');
}

export async function startDevServer() {
    console.log('[WebContainer] startDevServer called');
    const instance = await bootWebContainer();
    console.log('[WebContainer] WebContainer instance ready');

    serverStatus.set('starting');
    previewUrl.set(null);
    qrCodeUrl.set(null);

    // Listen for server-ready events (WebContainer auto-starts servers)
    instance.on('server-ready', async (port, url) => {
        console.log('[WebContainer] Server ready event:', port, url);

        // Only handle the main Metro bundler port
        if (port !== 8081) {
            console.log('[WebContainer] Ignoring port:', port);
            return;
        }

        // Wait for Metro to finish initial bundling (5 seconds)
        console.log('[WebContainer] Waiting for Metro to finish initial bundle...');
        appendTerminalOutput('\n⏳ Waiting for Metro bundler to be ready...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('[WebContainer] Setting preview URL:', url);
        previewUrl.set(url);
        serverStatus.set('ready');
        appendTerminalOutput(`\n✅ Preview ready on port ${port}\n`);


    });

    // Trigger server start by running npx expo start directly
    // This ensures we bind to 0.0.0.0 and use the correct port
    // We use localhost as 0.0.0.0 is not allowed by Expo CLI
    try {
        console.log('[WebContainer] Running npx expo start...');
        appendTerminalOutput('\n🚀 Starting development server...\n');

        const process = await instance.spawn('npx', ['expo', 'start', '--web'], {
            env: {
                EXPO_NO_TELEMETRY: '1',
                BROWSER: 'none',
            },
        });

        process.output.pipeTo(new WritableStream({
            write(data) {
                const text = typeof data === 'string' ? data : decoder.decode(data);
                appendOutput(text);

                // Capture the exp:// URL from Expo output for QR code
                // Format: "› Metro waiting on exp://xxxxx.local-credentialless.webcontainer-api.io"
                const expMatch = text.match(/Metro waiting on (exp:\/\/[^\s]+)/);
                if (expMatch) {
                    const expUrl = expMatch[1];
                    console.log('[WebContainer] Expo URL captured:', expUrl);
                    qrCodeUrl.set(expUrl);
                    appendTerminalOutput(`\n📱 Scan QR code with Expo Go: ${expUrl}\n`);
                }

                // Capture the web URL from Expo output
                // Format: "› Web is waiting on http://xxxxx.local-credentialless.webcontainer-api.io"
                const webMatch = text.match(/Web is waiting on (https?:\/\/[^\s]+)/);
                if (webMatch) {
                    const webUrl = webMatch[1];
                    console.log('[WebContainer] Web URL captured:', webUrl);
                    previewUrl.set(webUrl);
                    serverStatus.set('ready');
                    appendTerminalOutput(`\n✅ Web preview ready: ${webUrl}\n`);
                }
            }
        }));

        process.exit.then(code => {
            console.log('[WebContainer] npm start exited with code:', code);
            if (code !== 0) {
                serverStatus.set('error');
                appendTerminalOutput(`\n❌ Dev server exited with code ${code}\n`);
            }
        }).catch(err => {
            console.error('[WebContainer] npm start error:', err);
            serverStatus.set('error');
            appendTerminalOutput(`\n❌ Dev server crashed: ${err instanceof Error ? err.message : String(err)}\n`);
        });
    } catch (err) {
        console.error('[WebContainer] Failed to start dev server:', err);
        serverStatus.set('error');
        appendTerminalOutput(`\n❌ Failed to start server: ${err instanceof Error ? err.message : String(err)}\n`);
        throw err;
    }
}

export async function writeFile(path: string, content: string) {
    const instance = await bootWebContainer();
    await instance.fs.writeFile(path, content);
}
