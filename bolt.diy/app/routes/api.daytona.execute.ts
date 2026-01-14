import { json } from '@remix-run/cloudflare';
import type { ActionFunctionArgs } from '@remix-run/cloudflare';
// @ts-ignore - SDK types might not be perfectly resolved in this environment yet
import { Daytona } from '@daytonaio/sdk';
import * as fs from 'node:fs';
import * as path from 'node:path';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { command, file, content, encoding, sandboxId: requestSandboxId } = await request.json<any>();
    const apiKey = process.env.DAYTONA_API_KEY;

    if (!apiKey) {
        return json({ error: 'DAYTONA_API_KEY not configured on server' }, { status: 500 });
    }

    let sandbox;
    let sandboxId = requestSandboxId;

    try {
        const daytona = new Daytona({ apiKey });

        // CRITICAL: Try to reuse existing sandbox OR cleanup old ones to prevent CPU limit
        // This ensures only 1 sandbox exists per user
        if (!sandboxId) {
            try {
                console.log('[Daytona API] Checking for existing sandboxes...');
                const paginatedResult = await daytona.list();
                const sandboxes = paginatedResult.items || [];

                if (sandboxes.length > 0) {
                    // Try to reuse the most recent sandbox
                    const mostRecent = sandboxes[0];
                    console.log(`[Daytona API] Found ${sandboxes.length} existing sandbox(es)`);

                    try {
                        sandbox = await daytona.get(mostRecent.id);
                        sandboxId = mostRecent.id;
                        console.log(`[Daytona API] ✅ Reusing existing sandbox: ${sandboxId}`);

                        // CRITICAL: Ensure sandbox is running
                        try {
                            if (mostRecent.state === 'stopped') {
                                console.log(`[Daytona API] 🔄 Sandbox ${sandboxId} is stopped. Starting it...`);
                                await daytona.start(sandboxId);
                                // Re-fetch to get updated state/IP
                                sandbox = await daytona.get(sandboxId);
                                if ((sandbox.state as string) !== 'running') {
                                    throw new Error(`Sandbox state is ${sandbox.state} after start`);
                                }
                            }
                        } catch (startErr) {
                            console.warn(`[Daytona API] ⚠️ Failed to start stopped sandbox ${sandboxId}. Deleting to create new one.`);
                            await daytona.delete(sandboxId);
                            sandboxId = null;
                            sandbox = null;
                            throw new Error('Force new sandbox creation'); // Break out to catch block
                        }

                        // CRITICAL: Check default workdir
                        try {
                            const pwd = await sandbox.process.executeCommand('pwd', '/home/user');
                            console.log(`[Daytona ${sandboxId}] PWD: ${pwd.result}`);
                        } catch (e) { }

                        // CRITICAL: Verify package.json exists, if not, re-sync template files
                        try {
                            // Check absolute path /home/user/package.json
                            const checkCmd = 'test -f /home/user/package.json && echo "EXISTS" || echo "MISSING"';
                            const checkResult = await sandbox.process.executeCommand(checkCmd, '/home/user');

                            if (checkResult.result?.includes('MISSING')) {
                                console.log(`[Daytona ${sandboxId}] ⚠️  Template files missing in /home/user, deleting corrupt sandbox...`);
                                // Delete corrupt sandbox and create fresh one from snapshot
                                await daytona.delete(sandboxId);
                                sandboxId = null;
                                sandbox = null;
                                // Will fall through to create new sandbox from snapshot
                            }
                        } catch (verifyErr) {
                            console.warn(`[Daytona ${sandboxId}] Could not verify template files:`, verifyErr);
                        }

                        /* 
                        // SCALING FIX: DO NOT DELETE OTHER SANDBOXES
                        // In a multi-user environment, listing returns ALL sandboxes.
                        // We must NOT delete sandboxes that might belong to other users.
                        // Ideally, we should filter by a user tag, but for now, we simply disable cleanup.
                        
                        // Delete OTHER sandboxes (keep only the one we're reusing)
                        if (sandboxes.length > 1) {
                            console.log(`[Daytona API] Cleaning up ${sandboxes.length - 1} old sandbox(es)...`);
                            // ... code removed ...
                        }
                        */
                    } catch (e) {
                        // If we can't connect to the most recent sandbox, delete ALL and create fresh
                        console.warn(`[Daytona API] Cannot connect to sandbox ${mostRecent.id}, cleaning up all`);
                        const deletePromises = sandboxes.map(async (sb: any) => {
                            try {
                                await daytona.delete(sb.id);
                                console.log(`[Daytona API] 🗑️  Deleted: ${sb.id}`);
                            } catch (e) {
                                console.warn(`[Daytona API] Failed to delete ${sb.id}:`, e);
                            }
                        });
                        await Promise.all(deletePromises);
                        sandboxId = null;
                        sandbox = null;
                    }
                }
            } catch (e) {
                console.warn('[Daytona API] Sandbox listing/cleanup failed:', e);
            }
        }

        // 1. Get or Create Sandbox
        if (sandboxId) {
            try {
                if (!sandbox) {
                    sandbox = await daytona.get(sandboxId);
                }
                console.log(`[Daytona API] Connected to sandbox: ${sandboxId}`);

                // CRITICAL: Verify template integrity for ANY connected sandbox
                try {
                    // Check absolute path /home/user/package.json
                    const checkCmd = 'test -f /home/user/package.json && echo "EXISTS" || echo "MISSING"';
                    const checkResult = await sandbox.process.executeCommand(checkCmd, '/home/user');

                    if (checkResult.result?.includes('MISSING')) {
                        console.log(`[Daytona ${sandboxId}] ⚠️  Template files missing in /home/user. Deleting corrupt sandbox to force re-creation...`);
                        await daytona.delete(sandboxId);
                        sandboxId = null;
                        sandbox = null;
                        // Will fall through to create new sandbox below
                    } else {
                        console.log(`[Daytona ${sandboxId}] ✅ Template verified.`);

                        // AUTO-FIX: Force update index.tsx from local template to fix corruption
                        try {
                            const localTmpl = path.join(process.cwd(), 'templates/af-expo-template-v9/app/index.tsx');
                            if (fs.existsSync(localTmpl)) {
                                await sandbox.fs.uploadFile(fs.readFileSync(localTmpl), '/home/user/app/index.tsx');
                                console.log(`[Daytona ${sandboxId}] 🩹 Auto-patched app/index.tsx from local template`);
                            }
                            // Clean cache to resolve bundling errors
                            await sandbox.process.executeCommand('rm -rf .expo', '/home/user');
                        } catch (e) {
                            console.warn('Template auto-fix failed', e);
                        }
                    }

                    // FINAL VERIFICATION: Execute a simple command to ensure FS and Process are ready
                    try {
                        await sandbox.process.executeCommand('true', '/home/user');
                    } catch (e) {
                        console.warn(`[Daytona ${sandboxId}] ⚠️ Sandbox unresponsive after connection. Abandoning reuse.`);
                        // Do NOT delete (might be other user's), just ignore and create new
                        sandboxId = null;
                        sandbox = null;
                    }
                } catch (verifyErr) {
                    console.warn(`[Daytona ${sandboxId}] Verification failed, abandoning:`, verifyErr);
                    sandboxId = null;
                    sandbox = null;
                }

            } catch (e) {
                console.warn(`[Daytona API] Could not connect to sandbox ${sandboxId}, will create new.`);
                sandboxId = null;
                sandbox = null;
            }
        }

        if (!sandboxId) {
            // Create new sandbox from pre-built snapshot af-expo-v8
            // Snapshot contains: Node.js 20, git, ca-certificates, all template files in /home/user, pre-installed dependencies
            // Resources: 2vCPU / 4GB RAM / 8GB Disk (configured in snapshot)
            // Entrypoint: sleep infinity (keeps container alive)
            console.log('[Daytona API] Creating new Daytona sandbox from snapshot: af-expo-v10...');
            sandbox = await daytona.create(
                { snapshot: 'af-expo-v10' },
                { timeout: 180 }
            );
            sandboxId = sandbox.id;
            console.log(`[Daytona API] ✅ Created sandbox from snapshot: ${sandboxId}`);

            // Verify snapshot contents
            try {
                const lsResult = await sandbox.process.executeCommand('ls -la /home/user', '/home/user');
                console.log(`[Daytona ${sandboxId}] /home/user contents:\n${lsResult.result}`);

                const verifyPkg = await sandbox.process.executeCommand('test -f /home/user/package.json && echo "EXISTS" || echo "MISSING"', '/home/user');
                if (verifyPkg.result?.includes('EXISTS')) {
                    console.log(`[Daytona ${sandboxId}] ✅ Snapshot verified - template files present`);
                } else {
                    console.error(`[Daytona ${sandboxId}] ❌ Snapshot verification failed - package.json missing`);
                }
            } catch (e) {
                console.warn(`[Daytona ${sandboxId}] Snapshot verification failed:`, e);
            }
        }

        // 2. Handle File Write
        if (file && content) {
            // Re-root all file paths to /home/user
            // Client sends absolute paths like '/package.json' or '/app/index.tsx'
            // We want /home/user/package.json
            const relativePath = file.startsWith('/') ? file.slice(1) : file;
            const targetPath = path.join('/home/user', relativePath);

            console.log(`[Daytona API] Writing file: ${targetPath} (orig: ${file})`);

            try {
                if (!sandbox) {
                    throw new Error('Sandbox creation failed');
                }

                // Ensure directory exists
                const dir = path.dirname(targetPath);
                await sandbox.process.executeCommand(`mkdir -p "${dir}"`, '/home/user');

                // Convert content to Buffer
                let fileBuffer: Buffer;
                if (encoding === 'base64') {
                    fileBuffer = Buffer.from(content, 'base64');
                } else {
                    fileBuffer = Buffer.from(content, 'utf-8');
                }

                await sandbox.fs.uploadFile(fileBuffer, targetPath);

            } catch (e) {
                console.error('[Daytona API] File write failed', e);
                throw e;
            }

            return json({ success: true, sandboxId });
        }

        // 3. Handle Command Execution
        if (command) {
            if (!sandbox) {
                throw new Error('Sandbox creation failed');
            }
            console.log(`[Daytona API] Executing: ${command}`);

            // NPM RELIABILITY FIX: Configure npm to be more robust against network flakes
            if (command.includes('npm')) {
                try {
                    await sandbox.process.executeCommand('npm config set fetch-retries 5', '/home/user');
                    await sandbox.process.executeCommand('npm config set fetch-retry-factor 2', '/home/user');
                    await sandbox.process.executeCommand('npm config set fetch-retry-mintimeout 10000', '/home/user');
                    await sandbox.process.executeCommand('npm config set fetch-retry-maxtimeout 60000', '/home/user');
                } catch (e) {
                    console.warn('[Daytona API] Failed to configure npm settings', e);
                }
            }

            // DETECT LONG RUNNING COMMANDS
            const isLongRunning = command.includes('npm start') || command.includes('npm run dev') || command.includes('npx expo start');

            let finalCommand = command;
            let previewUrlData = { url: '', token: '' };

            if (isLongRunning) {
                // 0. AUTO-HEAL: Ensure node_modules exists
                try {
                    const nmCheck = await sandbox.process.executeCommand('test -d "node_modules" && echo "EXISTS" || echo "MISSING"', '/home/user');
                    if (nmCheck.result?.includes('MISSING')) {
                        console.log('[Daytona API] node_modules missing. Auto-running npm install...');

                        // DEEP CLEAN: Remove potential conflicting lockfiles and cache
                        try {
                            await sandbox.process.executeCommand('rm -rf package-lock.json pnpm-lock.yaml yarn.lock .expo', '/home/user');
                        } catch (e) { }

                        // Apply reliability settings for auto-heal too
                        try {
                            await sandbox.process.executeCommand('npm config set fetch-retries 5', '/home/user');
                            await sandbox.process.executeCommand('npm config set fetch-retry-maxtimeout 60000', '/home/user');
                        } catch (e) { }
                        await sandbox.process.executeCommand('npm install', '/home/user');
                    }
                } catch (e) {
                    console.warn('[Daytona API] node_modules check failed', e);
                }

                // 0.5 AUTO-HEAL: Fix package.json scripts (use direct node path instead of npx)
                try {
                    const pkgContent = await sandbox.fs.downloadFile('/home/user/package.json');
                    const pkgStr = new TextDecoder().decode(pkgContent);
                    if (pkgStr.includes('"npx')) {
                        console.log('[Daytona API] 🩹 Patching package.json to remove broken npx commands...');
                        let fixedPkg = pkgStr
                            .replace(/"npx (?:--yes )?expo/g, '"node ./node_modules/expo/bin/cli')
                            .replace(/"npx (?:--yes )?tsc/g, '"node ./node_modules/typescript/bin/tsc');

                        // Also proactively add --host 0.0.0.0 if missing to any start command
                        if (!fixedPkg.includes('--host 0.0.0.0')) {
                            fixedPkg = fixedPkg.replace(/((?:start|dev)":.*?)(\s*"?)/g, '$1 --host 0.0.0.0$2');
                        }

                        await sandbox.fs.uploadFile(Buffer.from(fixedPkg), '/home/user/package.json');
                    }
                } catch (e) {
                    console.warn('[Daytona API] package.json patch failed', e);
                }

                // 1. CLEANUP PORTS
                // CRITICAL: Kill any existing process on port 8082 to prevent "Port already in use" errors
                try {
                    console.log('[Daytona API] Cleaning up port 8082...');
                    // Aggressively kill anything on port 8082
                    // Method 1: fuser (force kill)
                    await sandbox.process.executeCommand('fuser -k -9 8082/tcp || true', '/home/user');
                    // Method 2: lsof + kill (fallback, shell loop safe)
                    await sandbox.process.executeCommand('for pid in $(lsof -t -i:8082); do kill -9 $pid; done || true', '/home/user');
                } catch (e) {
                    console.warn('[Daytona API] Port cleanup warning:', e);
                }

                // 2. PRE-FETCH PREVIEW URL FOR EXPO
                // We need the hostname to set REACT_NATIVE_PACKAGER_HOSTNAME so Expo generates the correct QR code/links
                try {
                    // Fallback to SDK methods if available, but assuming SDK has getPreviewLink:
                    const previewInfo = await sandbox.getPreviewLink(8082);

                    previewUrlData = {
                        url: previewInfo.url,
                        token: previewInfo.token || ''
                    };
                    console.log(`[Daytona API] Pre-fetched Preview Link: ${previewUrlData.url}`);

                    if (previewUrlData.url) {
                        try {
                            const hostname = new URL(previewUrlData.url).hostname;
                            const origin = `https://${hostname}`;
                            // Force binding to 0.0.0.0 so Daytona preview can reach the dev server.
                            // Announce the public hostname for QR code/links.
                            finalCommand =
                                `HOST=0.0.0.0 PORT=8082 REACT_NATIVE_PACKAGER_HOSTNAME="${hostname}" ` +
                                `EXPO_DEV_SERVER_ORIGIN="${origin}" EXPO_DEV_CLIENT_NETWORK_INSPECTOR=false ${finalCommand}`;
                        } catch (err) {
                            console.warn('[Daytona API] check URL parse error', err);
                        }
                    } else {
                        // Fallback to bind to all interfaces even if we don't have the preview URL yet.
                        finalCommand =
                            `HOST=0.0.0.0 PORT=8082 REACT_NATIVE_PACKAGER_HOSTNAME="0.0.0.0" ` +
                            `EXPO_DEV_SERVER_ORIGIN="http://0.0.0.0:8082" EXPO_DEV_CLIENT_NETWORK_INSPECTOR=false ${finalCommand}`;
                    }
                } catch (e) {
                    console.warn('[Daytona API] Failed to get preview link before start', e);
                }

                // 3. BACKGROUND COMMAND
                // Use sh -c to ensure env vars work with nohup
                console.log(`[Daytona API] Backgrounding command: ${finalCommand}`);
                finalCommand = `nohup sh -c '${finalCommand}' > /home/user/server.log 2>&1 & sleep 2`;
            }

            // USE executeCommand (Shell execution)
            // Signature: executeCommand(command, workDir, env, timeout)
            const response = await sandbox.process.executeCommand(finalCommand, '/home/user');

            // If backgrounded, read the log file to show immediate output/errors
            let debugLog = '';

            // ALWAYS try to read server.log if it exists to provide visibility
            try {
                // Prepend explicit connection info if available
                if (previewUrlData.url) {
                    debugLog += `\n\n=== 🔌 EXPO CONNECTION INFO ===\n`;
                    debugLog += `Daytona URL:   ${previewUrlData.url}\n`;
                    debugLog += `Daytona Token: ${previewUrlData.token}\n`;
                    // Construct Expo URL manually (Expo Go friendly)
                    const hostname = new URL(previewUrlData.url).hostname;
                    debugLog += `Expo Go URL:   exp://${hostname}:80\n`;
                    debugLog += `\nUse the Expo Go URL above or scan the QR code if visible below.\n`;
                    debugLog += `If prompted for authentication, use the Daytona Token.\n===============================\n`;
                }

                // DIAGNOSTIC CHECK: Run curl locally to verify if the server is actually responding with 200 or 307
                try {
                    const localCurl = await sandbox.process.executeCommand('curl -I http://127.0.0.1:8082 || echo "Curl Failed"', '/home/user');
                    if (localCurl.result) {
                        debugLog += `\n\n[Daytona Diagnostic] Localhost:8082 Status: ${localCurl.result.split('\n')[0]}\n`;
                    }
                } catch (e) {
                    // Ignore check error
                }

                const logResult = await sandbox.process.executeCommand('tail -n 400 /home/user/server.log', '/home/user');
                if (logResult.exitCode === 0 && logResult.result) {
                    debugLog += `\n\n--- [Server Log Preview (Last 400 lines)] ---\n${logResult.result}\n------------------------------------------`;
                }

                // REPEND explicit connection info so it appears at the bottom
                if (previewUrlData.url) {
                    debugLog += `\n\n=== 📱 MOBILE PREVIEW (SCAN OR TYPE THIS) ===\n`;
                    const hostname = new URL(previewUrlData.url).hostname;
                    debugLog += `Expo Go URL:   exp://${hostname}:80\n`;
                    debugLog += `Web Preview:   ${previewUrlData.url}\n`;
                    debugLog += `=============================================\n`;
                }
            } catch (e) {
                // Ignore log read error
            }

            console.log('[Daytona API] Output:', response.result);

            // Get Preview Link
            let url = previewUrlData.url || ''; // USE FALLBACK FROM PRE-FETCH
            try {
                // Try to get fresh one (might be same)
                const previewCallback = await sandbox.getPreviewLink(8082);
                if (previewCallback.url) {
                    url = previewCallback.url;
                }
                if (previewCallback.token) {
                    previewUrlData.token = previewCallback.token;
                }
                console.log(`[Daytona API] Generated Preview Link: ${url}`);
            } catch (e) {
                console.warn('[Daytona API] Failed to get fresh preview link, using pre-fetched:', url);
            }

            console.log(`[Daytona API] 🚀 FINAL RESPONSE URL: ${url}`);

            return json({
                stdout: response.result + debugLog,
                stderr: response.exitCode !== 0 ? (response.result || `Exit Code: ${response.exitCode}`) : '', // capture stdout as error if exit code != 0
                exitCode: response.exitCode,
                sandboxId,
                url,
                token: previewUrlData.token,
            });
        }

        return json({ error: 'Invalid request' }, { status: 400 });

    } catch (error: any) {
        console.error('[Daytona API Error]', error);
        return json({
            error: error.message || 'Unknown error',
            sandboxId
        }, { status: 500 });
    }
}
