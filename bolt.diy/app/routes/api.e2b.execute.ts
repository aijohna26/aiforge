import { json } from '@remix-run/cloudflare';
import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { Sandbox } from '@e2b/code-interpreter';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { inngest } from '~/lib/inngest/client';
import { validatePackageJson } from '~/lib/runtime/package-json-validator';

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { command: rawCommand, file, content: originalContent, encoding, template, sandboxId: requestSandboxId } = await request.json<any>();
    const apiKey = process.env.E2B_API_KEY;
    let content = originalContent;
    let command = rawCommand;

    if (!apiKey) {
        return json({ error: 'E2B_API_KEY not configured on server' }, { status: 500 });
    }

    let sandbox: any;
    let sandboxId = requestSandboxId;

    try {
        if (sandboxId) {
            try {
                // Connect with extended timeout (15 mins) to prevent premature timeouts
                sandbox = await Sandbox.connect(sandboxId, { apiKey, timeoutMs: 15 * 60 * 1000 });
                console.log(`[E2B API] Reconnected to sandbox: ${sandboxId} `);

                // DATA RECOVERY: Content-based verification
                // The 'sandbox.template' property is proving unreliable (returning undefined).
                // Instead, we check the ACTUAL configuration on disk to see if it's a legacy environment.
                try {
                    const checkPkg = await sandbox.commands.run('cat package.json');
                    const pkgContent = checkPkg.stdout;

                    if (pkgContent && pkgContent.includes('--tunnel')) {
                        console.warn(`[E2B API] ⚠️ DETECTED LEGACY CONFIG (--tunnel) in sandbox ${sandboxId}. KILLING TO UPGRADE.`);
                        try {
                            await sandbox.kill();
                        } catch (e) {
                            console.warn('[E2B API] Kill failed:', e);
                        }
                        sandbox = undefined;
                        sandboxId = null;
                    } else if (pkgContent && pkgContent.includes('--web')) {
                        console.log(`[E2B API] ✅ Verified Valid Environment (Web Mode) in sandbox ${sandboxId}`);
                    } else {
                        // Ambiguous state - might be empty or non-expo.
                        // We'll trust the process.env check if available, otherwise assume it's okay-ish 
                        // but log usage.
                        const currentTemplate = sandbox.template || (sandbox as any).templateId;
                        const EXPECTED_TEMPLATE = process.env.E2B_EXPO_TEMPLATE_ID || 'expo-template-v9';

                        console.log(`[E2B API] Sandbox Template ID: ${currentTemplate} | Expected: ${EXPECTED_TEMPLATE}`);

                        if (currentTemplate && currentTemplate !== EXPECTED_TEMPLATE) {
                            console.warn(`[E2B API] ⚠️ Template ID mismatch. Killing.`);
                            await sandbox.kill();
                            sandbox = undefined;
                            sandboxId = null;
                        }
                    }
                } catch (err) {
                    console.warn(`[E2B API] Could not verify package.json on reconnect: ${err}`);
                    // If we can't read package.json, it's safer to maybe assume it's fresh or keep going?
                    // Let's keep it alive to avoid loops if FS is just slow.
                }
            } catch (e) {
                console.warn(`[E2B API] Failed to connect to sandbox ${sandboxId}, creating new one.`);
                sandboxId = null; // Reset to create new
            }

        }

        // CONCURRENCY CHECK: Enforce Free Tier limit of 20 active sandboxes
        if (!sandbox) {
            try {
                // @ts-ignore - Sandbox.list returns a paginator
                const paginator = await Sandbox.list({ apiKey, query: { state: ['running'] } });
                const runningSandboxes = [];

                // Fetch all pages
                let items = await paginator.nextItems();
                runningSandboxes.push(...items);
                while (paginator.hasNext) {
                    items = await paginator.nextItems();
                    runningSandboxes.push(...items);
                }

                const activeCount = runningSandboxes.length;
                const maxLimit = parseInt(process.env.E2B_MAX_SANDBOXES || '20', 10);
                console.log(`[E2B API] Active Sandboxes: ${activeCount}/${maxLimit}`);

                if (activeCount >= maxLimit) {
                    // Double check if we are reconnecting to an inactive one?
                    // If sandboxId result was null/failed connect, we are creating NEW.
                    // If we block here, we save the user.
                    console.error(`[E2B API] 🛑 MAX LIMIT REACHED (${activeCount}). Blocking creation.`);
                    return json({
                        error: `Sandbox limit reached (${activeCount}/${maxLimit}). Please wait for a session to expire or close one.`,
                        details: `Plan Limit: ${maxLimit} concurrent sandboxes.`
                    }, { status: 429 });
                }
            } catch (e) {
                console.warn('[E2B API] Failed to check sandbox limits, proceeding with caution:', e);
            }
        }

        if (!sandbox) {
            // EXPO-OPTIMIZATION: Use custom high-spec template for Expo projects
            // ID comes from env var or defaults to known high-spec template (4 vCPU, 4GB RAM)
            // This prevents OOM errors and speeds up install significantly
            const EXPO_TEMPLATE_ID = process.env.E2B_EXPO_TEMPLATE_ID || 'expo-template-v9';

            let templateToUse = template;
            if (template !== EXPO_TEMPLATE_ID && !process.env.ALLOW_ARBITRARY_TEMPLATES) {
                console.log(`[E2B API] AGGRESSIVE OVERRIDE: Ignoring requested template '${template}'. Using Custom Expo Template.`);
                templateToUse = EXPO_TEMPLATE_ID;
            }

            // Create sandbox with extended timeout for long-running operations
            const sandboxOptions = {
                apiKey,
                timeoutMs: 15 * 60 * 1000, // 15 minutes total sandbox timeout
            };

            console.log(`[E2B API] Creating sandbox with template: ${templateToUse === EXPO_TEMPLATE_ID ? 'Custom High-Spec (4GB RAM)' : templateToUse || 'Default (Base)'}...`);

            // PERSISTENCE UPGRADE: Use betaCreate with autoPause if available
            // This enables pausing/resuming sandboxes to save state and cost
            try {
                if ('betaCreate' in Sandbox) {
                    console.log('[E2B API] Using Sandbox.betaCreate with autoPause: true');
                    // @ts-ignore - Beta method might not be in types yet
                    sandbox = await (Sandbox as any).betaCreate(templateToUse, {
                        ...sandboxOptions,
                        autoPause: true
                    }) as any;
                } else {
                    sandbox = await Sandbox.create(templateToUse, sandboxOptions) as any;
                }
            } catch (createError) {
                console.warn('[E2B API] betaCreate failed, falling back to standard create', createError);
                sandbox = await Sandbox.create(templateToUse, sandboxOptions) as any;
            }

            sandboxId = sandbox.sandboxId;
            console.log(`[E2B API] Created new sandbox: ${sandboxId}`);

            // Install pnpm globally for better memory efficiency
            // pnpm uses hard links and is much more memory efficient than npm
            try {
                console.log(`[E2B ${sandboxId}] Installing pnpm and @expo/ngrok globally...`);
                // Use the memory-optimized valid template, so pnpm might already be there? 
                // We run it anyway just in case, it's fast if cached.
                await sandbox.commands.run('npm install -g pnpm @expo/ngrok --silent', { timeoutMs: 120000 });
                console.log(`[E2B ${sandboxId}] Global tools installed successfully`);

                // CLEANUP: Remove "Root Pollution" where template files were dumped at /
                // This confuses the user and makes the file explorer look messy.
                // We strictly want files in /home/user.
                try {
                    console.log(`[E2B ${sandboxId}] Cleaning root-level pollution...`);
                    // Added /user to cleanup (it's a duplicate of /home/user that confuses things)
                    await sandbox.commands.run('rm -rf /hooks /utils /images /splash.png /app.json /tsconfig.json /index.ts /babel.config.js /metro.config.js /webpack.config.js /user');
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Root cleanup warning:`, e);
                }

                // Configure default git user to prevent "Please tell me who you are" errors
                await sandbox.commands.run('git config --global user.email "bolt@appforge.ai" && git config --global user.name "AF AI"');
                console.log(`[E2B ${sandboxId}] Git user configured`);
            } catch (e) {
                console.warn(`[E2B ${sandboxId}] Warning: failed to install pnpm`, e);
            }
        }

        // STOPPED: Inngest event sending removed.
        // The API handles execution directly. Backgrounding this via Inngest causes:
        // 1. Double execution (once in API, once in Inngest)
        // 2. Infinite hanging on 'start' commands (since Inngest awaits completion)
        // 3. Unnecessary cost and noise

        /*
        if (command) {
            await inngest.send({
                name: 'e2b/script.execute',
                data: {
                    content: command,
                    file: undefined,
                    language: 'shell',
                    timestamp: Date.now(),
                    template,
                    sandboxId
                }
            });
        }
        */

        if (command) {
            // Ensure we run commands in /home/user to match the file location
            // We prepend 'cd /home/user &&' to all commands
            if (!command.startsWith('cd ')) {
                command = `cd /home/user && ${command}`;
            }

            // Optimize npm install to use pnpm for better memory efficiency
            // This prevents "signal: killed" errors due to memory constraints
            let optimizedCommand = command;
            if (command.includes('npm install') && !command.includes('pnpm')) {
                optimizedCommand = command.replace(/npm install/g, 'pnpm install');
                console.log(`[E2B API] Optimized command: ${command} -> ${optimizedCommand}`);
            }

            // Add --yes flag to npx commands to prevent interactive prompts
            if (optimizedCommand.includes('npx ') && !optimizedCommand.includes('--yes')) {
                optimizedCommand = optimizedCommand.replace(/npx /g, 'npx --yes ');
                console.log(`[E2B API] Added --yes flag: ${optimizedCommand}`);
            }

            // CRITICAL: Prevent Expo commands from running before dependencies are installed
            // This prevents "module expo is not installed" errors
            const isExpoCommand = optimizedCommand.includes('expo start') || optimizedCommand.includes('expo run');
            if (isExpoCommand) {
                try {
                    console.log(`[E2B ${sandboxId}] Verifying expo module exists before running...`);
                    const checkExpo = await sandbox.commands.run('test -d node_modules/expo && echo "OK" || echo "MISSING"');
                    if (checkExpo.stdout.includes('MISSING')) {
                        console.error(`[E2B ${sandboxId}] ❌ BLOCKING: Expo module not installed! Run 'pnpm install' first.`);
                        const e2bDirectUrl = `https://${sandbox.getHost(8082)}`;
                        return json({
                            stdout: '',
                            stderr: 'ERROR: Cannot run Expo - module not installed. Please run "pnpm install" first.',
                            exitCode: 1,
                            sandboxId,
                            url: e2bDirectUrl
                        });
                    }
                    console.log(`[E2B ${sandboxId}] ✅ Expo module verified, proceeding...`);
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Could not verify expo module, proceeding anyway:`, e);
                }
            }

            console.log(`[E2B API] Executing command in ${sandboxId}: ${optimizedCommand}`);

            // Debug: Check what files exist in /home/user before running command
            try {
                const lsResult = await sandbox.commands.run('ls -la /home/user');
                console.log(`[E2B API] Files in /home/user:`, lsResult.stdout);
            } catch (e) {
                console.warn(`[E2B API] Could not list /home/user:`, e);
            }

            // Use the optimized command from here on
            command = optimizedCommand;

            // Run in background for start commands to allow streaming/return
            const isStartCommand = command.includes('npm run dev') || command.includes('npx expo start') || command.includes('npm start') || command.includes('npm run init');

            if (isStartCommand) {
                // Avoid double-starts that race and produce "port in use" in non-interactive mode.
                try {
                    const portCheck = await sandbox.commands.run('(curl -s -o /dev/null -w "%{http_code}" http://localhost:8082) || echo "NOT_LISTENING"');
                    const output = portCheck.stdout.trim();
                    const isListening = output.match(/\d{3}/) && output !== '000' && !output.includes('NOT_LISTENING');
                    if (isListening) {
                        const existingUrl = `https://${sandbox.getHost(8082)}`;
                        return json({
                            stdout: '[System] Server already listening on port 8082; skipping start.',
                            stderr: '',
                            exitCode: 0,
                            sandboxId,
                            url: existingUrl
                        });
                    }
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Port check failed (non-fatal):`, e);
                }

                try {
                    const processCheck = await sandbox.commands.run('ps aux | grep -v grep | grep "expo/bin/cli start" || true');
                    if (processCheck.stdout.trim()) {
                        const existingUrl = `https://${sandbox.getHost(8082)}`;
                        return json({
                            stdout: '[System] Expo process already running; skipping start.',
                            stderr: '',
                            exitCode: 0,
                            sandboxId,
                            url: existingUrl
                        });
                    }
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Process check failed (non-fatal):`, e);
                }

                // PERSISTENCE: Pipe output to file so we can retrieve logs later
                // We use tee to keep the stdout stream alive for our immediate listeners
                const baseCommand = command.replace(/^cd \/home\/user && /, '');
                // Force binding to 0.0.0.0 for E2B visibility (fixes 502 Bad Gateway)
                // REACT_NATIVE_PACKAGER_HOSTNAME overrides some internal Metro logic to force 0.0.0.0
                // FORCE BINDING & MEMORY OPTIMIZATION
                const envVars = 'export HOST=0.0.0.0 && export PORT=8082 && export REACT_NATIVE_PACKAGER_HOSTNAME="0.0.0.0" && export EXPO_DEV_SERVER_ORIGIN="http://0.0.0.0:8082" && export NODE_OPTIONS="--max-old-space-size=4096"';

                // 1. Kill Port 8082
                try {
                    console.log(`[E2B ${sandboxId}] Killing port 8082...`);
                    await sandbox.commands.run('npx --yes kill-port 8082 || true');
                } catch (e) {
                    console.log(`[E2B ${sandboxId}] Kill port failed (non-fatal):`, e);
                }

                // 2. Remove Mac Metadata (Critical for Metro)
                try {
                    console.log(`[E2B ${sandboxId}] Cleaning mac metadata...`);
                    await sandbox.commands.run('find . -type f -name "._*" -delete || true');
                } catch (e) {
                    console.log(`[E2B ${sandboxId}] Metadata clean failed (non-fatal):`, e);
                }

                // 3. Patch package.json Port
                try {
                    console.log(`[E2B ${sandboxId}] Patching package.json port...`);
                    await sandbox.commands.run("sed -i 's/--port 8081/--port 8082/g' package.json");
                } catch (e) {
                    console.log(`[E2B ${sandboxId}] Patch failed (non-fatal):`, e);
                }

                command = `cd /home/user && ${envVars} && (${baseCommand}) 2>&1 | tee /home/user/app.log`;
                console.log(`[E2B API] Start command simplified: ${command}`);
            }

            // AUTO-RECOVERY: If starting dev server but node_modules is missing, install first
            if (isStartCommand) {
                // ALWAYS Sync critical files from Golden Template to Sandbox
                // This ensures local dependency updates (like reanimated v4) and config changes are pushed
                try {
                    const filesToSync = [
                        'package.json',
                        'index.js',
                        'babel.config.js',
                        'metro.config.js',
                        'tsconfig.json'
                    ];

                    for (const fileName of filesToSync) {
                        const templatePath = path.resolve(process.cwd(), 'templates/af-expo-template-v9', fileName);
                        if (fs.existsSync(templatePath)) {
                            console.log(`[E2B ${sandboxId}] Force-syncing ${fileName} from local template...`);
                            const templateContent = fs.readFileSync(templatePath, 'utf-8');
                            await sandbox.files.write(fileName, templateContent);
                        }
                    }
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Failed to sync template files:`, e);
                }

                try {
                    const checkModules = await sandbox.commands.run('test -d node_modules && echo "EXISTS" || echo "MISSING"');
                    if (checkModules.stdout.includes('MISSING')) {
                        console.log(`[E2B ${sandboxId}] ⚠️ node_modules missing before start! Auto-installing...`);

                        // HOTFIX: Patch bad versions in package.json if present from previous failed runs
                        await sandbox.commands.run(`sed -i 's/"@types\\/react-native": "\\^0.81.0"/"@types\\/react-native": "^0.73.0"/g' package.json`);

                        // CRITICAL: Force-update the port in package.json scripts
                        // The scripts often have "--port 8081" hardcoded, which overrides env vars.
                        await sandbox.commands.run(`sed -i 's/--port 8081/--port 8082/g' package.json`);


                        // CRITICAL: Remove node_modules and lockfile to force clean install
                        // This prevents version mismatch issues from template pre-installed packages
                        console.log(`[E2B ${sandboxId}] Cleaning old dependencies for fresh install...`);
                        await sandbox.commands.run('rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml');

                        await sandbox.commands.run('pnpm install --no-frozen-lockfile', { timeoutMs: 240000 }); // 4 min timeout
                        console.log(`[E2B ${sandboxId}] ✅ Auto-install completed.`);
                    } else {
                        // Even if node_modules exists, check if critical dependencies are missing
                        // The E2B template has pre-cached packages that don't match package.json versions
                        try {
                            // Check for babel-plugin-module-resolver (needed for @/ path aliases)
                            const checkBabelPlugin = await sandbox.commands.run('test -d node_modules/babel-plugin-module-resolver && echo "EXISTS" || echo "MISSING"');
                            const babelPluginMissing = checkBabelPlugin.stdout.includes('MISSING');

                            if (babelPluginMissing) {
                                console.log(`[E2B ${sandboxId}] babel-plugin-module-resolver missing, forcing reinstall...`);
                                await sandbox.commands.run('rm -rf node_modules pnpm-lock.yaml');
                                await sandbox.commands.run('pnpm install --no-frozen-lockfile', { timeoutMs: 240000 });
                                console.log(`[E2B ${sandboxId}] ✅ Clean install completed.`);
                            } else {
                                console.log(`[E2B ${sandboxId}] All critical dependencies present, skipping reinstall.`);
                            }
                        } catch (e) {
                            console.warn(`[E2B ${sandboxId}] Dependency check failed:`, e);
                        }
                    }
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Failed to check/install modules, proceeding anyway`, e);
                }
            }

            // For start commands, we kick it off and return immediately with the URL
            if (isStartCommand) {
                // CRITICAL: Verify key Expo packages are actually installed before starting
                // This prevents the "Port is being used" error that happens when Expo fails to start
                try {
                    console.log(`[E2B ${sandboxId}] Verifying Expo installation...`);
                    const verifyExpo = await sandbox.commands.run('test -f node_modules/expo/package.json && echo "FOUND" || echo "MISSING"');
                    if (verifyExpo.stdout.includes('MISSING')) {
                        console.error(`[E2B ${sandboxId}] ❌ CRITICAL: Expo module not found in node_modules!`);
                        const e2bDirectUrl = `https://${sandbox.getHost(8082)}`;
                        return json({
                            stdout: '',
                            stderr: 'ERROR: Expo is not installed. Please run "pnpm install" first and ensure it completes successfully.',
                            exitCode: 1,
                            sandboxId,
                            url: e2bDirectUrl
                        });
                    }
                    console.log(`[E2B ${sandboxId}] ✅ Expo module found`);
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Could not verify Expo installation:`, e);
                }

                let collectedStdout = '';
                let collectedStderr = '';
                let tunnelUrl = '';

                // Simple port cleanup for 8082 - just kill any existing process
                // Port 8082 is much less likely to have conflicts than 8081
                // Simple port cleanup for 8082 - skipped because lsof is missing on prod
                // The preFlight command handles this via killall
                console.log(`[E2B ${sandboxId}] Port cleanup delegated to preFlight command.`);

                // Run in background; capture initial output
                console.log(`[E2B ${sandboxId}] 🚀 Executing command: ${command}`);

                await sandbox.commands.run(command, {
                    background: true,
                    onStdout: (out: { toString: () => string }) => {
                        const str = out.toString();
                        console.log(`[E2B ${sandboxId}] STDOUT: ${str}`);
                        collectedStdout += str;

                        // Extract ngrok tunnel URL from Expo output
                        // Look for patterns like "Tunnel ready." followed by URL or direct URL
                        const urlMatch = str.match(/https:\/\/[a-z0-9-]+\.ngrok\.io/i) ||
                            str.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/i) ||
                            str.match(/Metro.*https?:\/\/[^\s]+/i);
                        if (urlMatch && !tunnelUrl) {
                            tunnelUrl = urlMatch[0].replace(/Metro.*?(https?:\/\/)/, '$1');
                            console.log(`[E2B ${sandboxId}] 🌐 Detected tunnel URL: ${tunnelUrl}`);
                        }
                    },
                    onStderr: (err: { toString: () => string }) => {
                        const str = err.toString();
                        console.error(`[E2B ${sandboxId}] STDERR: ${str}`);
                        collectedStderr += str;
                    }
                });

                console.log(`[E2B ${sandboxId}] Background process started, waiting for server to be ready...`);

                // Wait for up to 180 seconds (3 mins) for the server to start, checking every 5 seconds
                let serverReady = false;
                for (let i = 0; i < 36; i++) {
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    try {
                        // Check using ONLY curl because lsof/netstat are missing in minimal containers.
                        // curl -s (silent) -o /dev/null (hide output) -w (write out) http_code
                        // If connection refused, curl exits with error or prints 000.
                        const portCheck = await sandbox.commands.run('(curl -s -o /dev/null -w "%{http_code}" http://localhost:8082) || echo "NOT_LISTENING"');
                        const output = portCheck.stdout;

                        // STRICT CHECK: Look for a valid HTTP status code (200, 404, 502, etc.)
                        const isListening = output.match(/\d{3}/) && output !== '000';

                        if (isListening && !output.includes('NOT_LISTENING')) {
                            console.log(`[E2B ${sandboxId}] ✅ Server verified ready (HTTP ${output}) after ${(i + 1) * 5} seconds`);
                            serverReady = true;
                            break;
                        } else {
                            console.log(`[E2B ${sandboxId}] ⏳ Server not ready yet (${(i + 1) * 5}s elapsed)...`);
                        }
                    } catch (e) {
                        console.warn(`[E2B ${sandboxId}] Error checking port:`, e);
                    }
                }

                if (!serverReady) {
                    console.error(`[E2B ${sandboxId}] ⚠️ WARNING: Server did not start listening on port 8082 after 180 seconds`);

                    // Try to get the actual error from the log file
                    try {
                        const logContent = await sandbox.commands.run('tail -50 /home/user/app.log 2>/dev/null || echo "No logs available"');
                        console.error(`[E2B ${sandboxId}] Recent logs:\n${logContent.stdout}`);
                        collectedStderr += '\n\n=== Server Startup Logs ===\n' + logContent.stdout;
                    } catch (e) {
                        console.error(`[E2B ${sandboxId}] Could not read logs:`, e);
                    }
                }

                // DIAGNOSTIC: Check if port 8082 is actually listening
                try {
                    const portCheck = await sandbox.commands.run('lsof -i :8082 || netstat -tlnp | grep 8082 || echo "Port 8082 not listening"');
                    console.log(`[E2B ${sandboxId}] 🔍 Port 8082 status:`, portCheck.stdout);
                    collectedStdout += '\n[System] Port check: ' + portCheck.stdout;
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Could not check port 8082`, e);
                }

                // Add a notice that the process continues
                if (collectedStdout.length > 0 && !collectedStdout.includes('QR Code')) {
                    collectedStdout += '\n[System] Server starting in background. Preview will appear when ready...';
                }

                // CRITICAL: Prefer E2B direct URL since ngrok detection is unreliable
                // The E2B host URL works directly without tunneling
                const e2bDirectUrl = `https://${sandbox.getHost(8082)}`;
                const previewUrl = e2bDirectUrl; // Always use E2B direct URL for reliability

                console.log(`[E2B ${sandboxId}] ========== PREVIEW URL DECISION ==========`);
                console.log(`[E2B ${sandboxId}] Detected tunnel URL: ${tunnelUrl || 'NONE'}`);
                console.log(`[E2B ${sandboxId}] E2B direct URL: ${e2bDirectUrl}`);
                console.log(`[E2B ${sandboxId}] Using: ${previewUrl}`);



                // Fetch data from the server inside the sandbox.
                const response = await fetch(e2bDirectUrl);
                const data = await response.text();
                console.log('xxx Response from server inside sandbox:', data);

                console.log(`[E2B ${sandboxId}] ==========================================`);

                return json({
                    stdout: collectedStdout,
                    stderr: collectedStderr,
                    exitCode: 0,
                    sandboxId,
                    url: previewUrl
                });
            }

            // Normal foreground execution for other commands
            // For npm/pnpm install, use a longer timeout (10 minutes) and stream output
            const isInstallCommand = command.includes('npm install') || command.includes('pnpm install');

            if (isInstallCommand) {
                // AUTO-INJECTION: If package.json is missing (because we told LLM not to make one),
                // inject the Golden Template package.json immediately.
                try {
                    const checkPkg = await sandbox.commands.run('test -f package.json && cat package.json || echo "MISSING"');
                    const pkgContent = checkPkg.stdout;
                    const hasPackageJson = !pkgContent.includes('MISSING');
                    const isStalePort = hasPackageJson && pkgContent.includes('--port 8081');

                    if (!hasPackageJson || isStalePort) {
                        const reason = isStalePort ? 'Stale Port 8081 detected' : 'package.json missing';
                        console.log(`[E2B ${sandboxId}] ${reason}, injecting Golden Template (v4)...`);
                        try {
                            const templatePath = path.resolve(process.cwd(), 'templates/af-expo-template-v9/package.json');
                            const templateContent = fs.readFileSync(templatePath, 'utf-8');

                            // Force overwrite
                            await sandbox.files.write('package.json', templateContent);
                            console.log(`[E2B ${sandboxId}] Injected/Updated package.json from v4 template.`);
                        } catch (err) {
                            console.error(`[E2B ${sandboxId}] Failed to inject template package.json:`, err);
                        }
                    }
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Error checking/injecting package.json:`, e);
                }

                // HOTFIX: Remove deprecated @types/react-native if present (prevents conflicts)
                try {
                    await sandbox.commands.run(`node -e "try { const pkg=require('./package.json'); if(pkg.devDependencies) delete pkg.devDependencies['@types/react-native']; if(pkg.dependencies) delete pkg.dependencies['@types/react-native']; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2)); } catch(e) {}"`);
                } catch (e) { /* ignore */ }

                console.log(`[E2B ${sandboxId}] Running install command with extended timeout...`);
                let collectedStdout = '';
                let collectedStderr = '';

                try {
                    // MEMORY SAFETY CHECK: Log available RAM to verify we are on the High-Spec VM
                    const memCheck = await sandbox.commands.run('free -m');
                    console.log(`[E2B ${sandboxId}] Memory Status:\n${memCheck.stdout}`);

                    // FORCE PNPM: The template is built with pnpm. 
                    // npm install destroys the pnpm structure and re-downloads everything (slow + OOM risk).
                    // We silently upgrade 'npm install' to 'pnpm install' to use the pre-cached modules.
                    let finalCommand = command;
                    if (command.trim() === 'npm install') {
                        console.log(`[E2B ${sandboxId}] Optimization: Switching 'npm install' to 'pnpm install' to use cached dependencies.`);
                        finalCommand = 'pnpm install';
                    }

                    // MEMORY OPTIMIZATION: Confirmed 4GB VM available via Dashboard.
                    // Previous OOM at 3072MB (3GB) suggests pnpm workers + overhead exceeded physical RAM.
                    // Setting to 2560MB (2.5GB) gives V8 plenty of room while leaving ~1.5GB 
                    // for OS, filesystem cache, and child processes to avoid "signal: killed".
                    const memSize = '2560';
                    const memOptimizedCommand = `export NODE_OPTIONS="--max-old-space-size=${memSize}" && ${finalCommand}`;

                    // DEBUG: Check if 'app' folder exists to ensure Expo code is present
                    try {
                        const appCheck = await sandbox.commands.run('ls -R app || echo "APP_MISSING"');
                        if (appCheck.stdout.includes("APP_MISSING")) {
                            console.error(`[E2B ${sandboxId}] ❌ CRITICAL: 'app' folder missing! Template injection failed?`);
                        } else {
                            console.log(`[E2B ${sandboxId}] ✅ 'app' folder found. Expo code present.`);
                        }
                    } catch (e) {
                        console.warn(`[E2B ${sandboxId}] Failed to check app folder:`, e);
                    }

                    console.log(`[E2B ${sandboxId}] Running with NODE_OPTIONS: --max-old-space-size=${memSize}`);

                    const output = await sandbox.commands.run(memOptimizedCommand, {
                        timeoutMs: 300000, // 5 minutes (pnpm should be remarkably fast)
                        onStdout: (out: { toString: () => string }) => {
                            const str = out.toString();
                            console.log(`[E2B ${sandboxId}] ${str}`);
                            collectedStdout += str;
                        },
                        onStderr: (err: { toString: () => string }) => {
                            const str = err.toString();
                            console.error(`[E2B ${sandboxId}] ${str}`);
                            collectedStderr += str;
                        }
                    });

                    // CRITICAL: Verify node_modules was actually created
                    try {
                        const lsResult = await sandbox.commands.run('ls -la node_modules | head -20');
                        console.log(`[E2B ${sandboxId}] ✅ node_modules contents after install:`, lsResult.stdout);

                        // Specifically check for expo package if this is an Expo project
                        const hasExpo = await sandbox.commands.run('test -d node_modules/expo && echo "FOUND" || echo "MISSING"');
                        console.log(`[E2B ${sandboxId}] Expo module check:`, hasExpo.stdout.trim());

                        if (hasExpo.stdout.includes('MISSING')) {
                            console.error(`[E2B ${sandboxId}] ⚠️ WARNING: expo module not found after install!`);
                            collectedStderr += '\n⚠️ WARNING: expo package not installed. Run may fail.';
                        }
                    } catch (e) {
                        console.warn(`[E2B ${sandboxId}] Could not verify node_modules:`, e);
                    }

                    return json({
                        stdout: collectedStdout || output.stdout,
                        stderr: collectedStderr || output.stderr,
                        exitCode: output.exitCode ?? 0,
                        sandboxId,
                        url: `https://${sandbox.getHost(8082)}`
                    });
                } catch (error: any) {
                    console.error(`[E2B ${sandboxId}] Install command failed:`, error);
                    return json({
                        stdout: collectedStdout,
                        stderr: collectedStderr + `\n\nError: ${error.message}`,
                        exitCode: 1,
                        sandboxId,
                        url: `https://${sandbox.getHost(8082)}`
                    });
                }
            }

            let output;
            try {
                output = await sandbox.commands.run(command);
            } catch (error: any) {
                // If it's a command exit error, we still want to return the output, not throw 500
                console.warn(`[E2B API] Command failed with exit code: ${error.exitCode || 'unknown'}`);
                return json({
                    stdout: error.stdout || '',
                    stderr: error.stderr || error.message,
                    exitCode: error.exitCode || 1,
                    sandboxId,
                    url: `https://${sandbox.getHost(8082)}`
                });
            }

            return json({
                stdout: output.stdout,
                stderr: output.stderr,
                exitCode: output.exitCode ?? 0,
                sandboxId, // Return ID for client persistence
                url: `https://${sandbox.getHost(8082)}`
            });
        } else if (file && content) {
            console.log(`[E2B API] Writing file to ${sandboxId}: ${file}${encoding ? ' (binary)' : ''}`);

            // ALIGNMENT: Ensure files are written to the correct project root (/home/user)
            // We MUST strip leading slashes to prevent escaping the user directory
            // We ALSO check for 'home/user' prefix to prevent recursive pathing (/home/user/home/user/...)
            let relativePath = file;
            if (relativePath.startsWith('/')) {
                relativePath = relativePath.substring(1);
            }

            // Fix for recursive pathing bug:
            if (relativePath.startsWith('home/user/')) {
                relativePath = relativePath.substring('home/user/'.length);
            }

            // CRITICAL: Flatten template files to root
            // The IDE sends files as "templates/af-expo-template-v9/package.json"
            // But E2B runs in "/home/user", so we must strip the prefix.
            if (relativePath.startsWith('templates/af-expo-template-v9/')) {
                relativePath = relativePath.replace('templates/af-expo-template-v9/', '');
                console.log(`[E2B API] Flattened path: ${file} -> ${relativePath}`);
            } else if (relativePath.startsWith('templates/af-expo-template/')) {
                relativePath = relativePath.replace('templates/af-expo-template/', '');
                console.log(`[E2B API] Flattened path: ${file} -> ${relativePath}`);
            }

            // Ensure /home/user exists (just in case)
            try {
                await sandbox.commands.run('mkdir -p /home/user');
            } catch (e) { }

            let targetPath = path.join('/home/user', relativePath);
            console.log(`[E2B API] Redirecting file write to: ${targetPath} (Original: ${file})`);

            // CRITICAL: Use centralized validator for ALL package.json files
            // This ensures consistent validation between browser and E2B
            content = validatePackageJson(file, content);

            // For Expo projects, also create .npmrc to optimize install
            if (file === 'package.json') {
                try {
                    const pkg = JSON.parse(content);
                    const isExpo = pkg.dependencies?.expo || pkg.dependencies?.['expo-router'];

                    if (isExpo) {
                        const npmrcContent = [
                            '# Optimize for E2B sandbox memory constraints',
                            'prefer-offline=true',
                            'audit=false',
                            'fund=false',
                            'loglevel=error',
                            'progress=false',
                            'fetch-retries=3',
                            'fetch-timeout=120000'
                        ].join('\n');

                        try {
                            await sandbox.files.write('.npmrc', npmrcContent);
                            console.log(`[E2B API] ✅ Created optimized .npmrc`);
                        } catch (e) {
                            console.warn(`[E2B API] Warning: Failed to create .npmrc`, e);
                        }
                    }
                } catch (e) {
                    console.warn(`[E2B API] Could not parse package.json for .npmrc creation`, e);
                }
            }

            const dirname = targetPath.substring(0, targetPath.lastIndexOf('/'));
            if (dirname && dirname !== '.') {
                try {
                    await sandbox.commands.run(`mkdir -p "${dirname}"`);
                } catch (e: any) {
                    console.warn(`[E2B API] Warning: mkdir failed for ${dirname}, proceeding anyway.`, e.message);
                }
            }

            // Handle binary files encoded as base64
            if (encoding === 'base64') {
                // Decode base64 and write as binary
                const binaryData = Buffer.from(content, 'base64');
                // E2B SDK v2.3.3 uses write() for both text and binary
                await sandbox.files.write(targetPath, binaryData);
            } else {
                // Write as text
                await sandbox.files.write(targetPath, content);
            }
            // await sandbox.close(); // KEEP OPEN FOR PERSISTENCE

            return json({ success: true, sandboxId });
        }

        // await sandbox.close(); 
        return json({ error: 'Invalid request', sandboxId }, { status: 400 });

    } catch (error: any) {
        console.error('[E2B API Error]', error);
        return json({
            error: error.message || 'Unknown error',
            details: error.stack,
            sandboxId // Return the ID we tried to use, for debugging
        }, { status: 500 });
    }
}
