import { WebContainer, type FileSystemTree } from '@webcontainer/api';
import { webcontainerContext, serverStatus, appendTerminalOutput, previewUrl, qrCodeUrl, connectedDevices } from './stores';
import type { GeneratedFile } from '@/lib/types';
import { FilesStore } from '@/lib/stores/files';

let webContainerInstance: WebContainer | null = null;
let filesStoreInstance: FilesStore | null = null;

const decoder = new TextDecoder();
const ANSI_REGEX = /\x1B\[[0-9;]*[A-Za-z]/g;

function stripAnsi(text: string) {
    return text.replace(ANSI_REGEX, '');
}

function sanitizeUrl(url: string) {
    return url.replace(/[),]+$/, '');
}

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
    const clean = stripAnsi(text);

    const expMatch = clean.match(/exp:\/\/[^\s]+/);
    if (expMatch) {
        qrCodeUrl.set(sanitizeUrl(expMatch[0]));
    }

    if (!previewUrl.get()) {
        const webMatch = clean.match(/https?:\/\/[^\s]+/);
        if (webMatch && webMatch[0].includes('19006')) {
            previewUrl.set(sanitizeUrl(webMatch[0]));
        }
    }
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

        // Initialize FilesStore with the WebContainer instance
        if (!filesStoreInstance) {
            filesStoreInstance = new FilesStore(Promise.resolve(webContainerInstance));
            console.log('[WebContainer] FilesStore initialized');
        }

        // Try to restore from snapshot if available
        const snapshotKey = 'wc_filesystem_snapshot';
        const savedSnapshot = localStorage.getItem(snapshotKey);

        if (savedSnapshot) {
            try {
                console.log('[WebContainer] Restoring filesystem from snapshot...');
                const snapshotData = JSON.parse(savedSnapshot);

                // Restore node_modules if it exists in snapshot
                if (snapshotData.nodeModules) {
                    console.log('[WebContainer] Restoring node_modules from snapshot...');
                    // Note: WebContainer doesn't support direct snapshot restore yet
                    // We'll need to use a different approach
                }
            } catch (e) {
                console.warn('[WebContainer] Failed to restore snapshot:', e);
                localStorage.removeItem(snapshotKey);
            }
        }

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

// Helper to generate hash of package.json for cache invalidation
async function getPackageJsonHash(instance: WebContainer): Promise<string> {
    try {
        const content = await instance.fs.readFile('package.json', 'utf-8');
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    } catch {
        return '';
    }
}

// Check if node_modules exists and is valid
async function hasValidNodeModules(instance: WebContainer): Promise<boolean> {
    try {
        const stat = await instance.fs.readdir('node_modules');
        return stat.length > 0;
    } catch {
        return false;
    }
}

export async function installDependencies() {
    console.log('[WebContainer] installDependencies called');
    const instance = await bootWebContainer();

    // Get current package.json hash
    const currentHash = await getPackageJsonHash(instance);
    const cachedHash = localStorage.getItem('wc_pkg_hash');
    const hasModules = await hasValidNodeModules(instance);

    console.log('[WebContainer] Package hash:', currentHash, 'Cached:', cachedHash, 'Has modules:', hasModules);

    // Skip installation ONLY if:
    // 1. node_modules exists
    // 2. We have a cached hash (not a new project)
    // 3. The hashes match (same dependencies)
    if (hasModules && cachedHash && currentHash === cachedHash) {
        console.log('[WebContainer] ✅ Using existing dependencies (already installed in this session)');
        appendTerminalOutput('\n✅ Using existing dependencies (already installed)\n');
        serverStatus.set('ready');
        return;
    }

    serverStatus.set('installing');

    // Always clean node_modules if:
    // - Package.json changed (different hash)
    // - No cached hash (new project or first install)
    if (hasModules) {
        console.log('[WebContainer] Cleaning node_modules for fresh install...');
        appendTerminalOutput('\n🔄 Installing dependencies...\n');
        await instance.spawn('rm', ['-rf', 'node_modules', 'package-lock.json']);
    } else {
        console.log('[WebContainer] No node_modules found, installing...');
        appendTerminalOutput('\n📦 Installing dependencies...\n');
    }

    console.log('[WebContainer] Running npm install...');

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

    // Ensure react-native-web is installed for Expo web support
    appendTerminalOutput('\n🔧 Verifying react-native-web dependency...\n');
    const webCheck = await instance.spawn('node', ['-e', "try{require.resolve('react-native-web')}catch(e){process.exit(1)}"]).exit;
    if (webCheck !== 0) {
        appendTerminalOutput('\n⬇️ Installing react-native-web via Expo...\n');
        const expoInstall = await instance.spawn('npx', ['expo', 'install', 'react-native-web']);
        expoInstall.output.pipeTo(new WritableStream({
            write(data) {
                appendOutput(data);
            }
        }));
        const expoExit = await expoInstall.exit;
        if (expoExit !== 0) {
            serverStatus.set('error');
            appendTerminalOutput('\n❌ Failed to install react-native-web\n');
            throw new Error('Failed to install react-native-web');
        }
    }

    // Cache the package.json hash after successful install
    if (currentHash) {
        localStorage.setItem('wc_pkg_hash', currentHash);
        console.log('[WebContainer] Cached package.json hash:', currentHash);
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
        appendTerminalOutput('\n🚀 Starting Expo development server...\n');

        const process = await instance.spawn('npx', ['expo', 'start', '--lan'], {
            env: {
                EXPO_NO_TELEMETRY: '1',
                EXPO_CLI_NON_INTERACTIVE: 'true',
                CI: '0',
                BROWSER: 'none',
            },
        });

        process.output.pipeTo(new WritableStream({
            write(data) {
                const text = typeof data === 'string' ? data : decoder.decode(data);
                appendOutput(text);

                // Track device connections from Metro output
                if (text.includes('Opening on Android') || text.includes('Opening on iOS')) {
                    const currentCount = connectedDevices.get();
                    connectedDevices.set(currentCount + 1);
                    console.log('[WebContainer] Device connected, total:', currentCount + 1);
                }

                // Capture Metro waiting URL (tunnel URL)
                // Format: "› Metro waiting on http://xxxxx.boltexpo.dev"
                const metroMatch = text.match(/Metro waiting on\s+(https?:\/\/[^\s]+)/);
                if (metroMatch) {
                    const tunnelUrl = metroMatch[1];
                    console.log('[WebContainer] Tunnel URL captured:', tunnelUrl);

                    // Set both preview URL and QR code URL to the tunnel URL
                    previewUrl.set(tunnelUrl);
                    qrCodeUrl.set(tunnelUrl);
                    serverStatus.set('ready');
                    appendTerminalOutput(`\n✅ Tunnel ready: ${tunnelUrl}\n`);
                    appendTerminalOutput(`\n📱 Scan QR code above to connect your device\n`);
                }

                // Capture "Web preview ready" confirmation
                if (text.includes('Web preview ready')) {
                    const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
                    if (urlMatch) {
                        const webUrl = urlMatch[1];
                        console.log('[WebContainer] Web preview URL:', webUrl);
                        previewUrl.set(webUrl);
                        serverStatus.set('ready');
                    }
                }

                // Also capture any exp:// URLs if present
                const expMatch = text.match(/(exp:\/\/[^\s)]+)/);
                if (expMatch) {
                    const expUrl = expMatch[1];
                    console.log('[WebContainer] Expo URL captured:', expUrl);
                    qrCodeUrl.set(expUrl);
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

export function getFilesStore(): FilesStore {
    if (!filesStoreInstance) {
        throw new Error('[WebContainer] FilesStore not initialized. Call bootWebContainer first.');
    }
    return filesStoreInstance;
}

export async function writeFile(path: string, content: string) {
    console.log('[WebContainer] writeFile called for:', path);
    const store = getFilesStore();
    await store.saveFile(path, content);
    console.log('[WebContainer] File written via FilesStore:', path);
}

// Trigger Metro bundler reload via HTTP endpoint
async function triggerMetroReload() {
    try {
        const url = previewUrl.get();
        if (!url) {
            console.log('[WebContainer] No preview URL available for reload');
            return;
        }

        // Extract base URL (remove path)
        const baseUrl = new URL(url);
        const metroUrl = `${baseUrl.protocol}//${baseUrl.host}`;

        // Metro's reload endpoint
        const reloadEndpoint = `${metroUrl}/reload`;

        console.log('[WebContainer] Triggering Metro reload:', reloadEndpoint);

        // Use fetch with a short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        await fetch(reloadEndpoint, {
            method: 'POST',
            signal: controller.signal,
        }).catch(() => {
            // Ignore fetch errors - Metro might not have this endpoint
        });

        clearTimeout(timeoutId);
        console.log('[WebContainer] Metro reload triggered');
    } catch (e) {
        // Silently fail - this is a best-effort optimization
        console.log('[WebContainer] Metro reload not available:', e);
    }
}
