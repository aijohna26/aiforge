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

                // DATA RECOVERY: Check if we are connected to a 'base' template (Legacy/Wrong)
                // If so, we must KILL it and create a new one to get the Expo Environment.
                // @ts-ignore - Check internal properties or metadata if available
                const currentTemplate = sandbox.template || (sandbox as any).templateId;
                console.log(`[E2B API] Connected Sandbox Template: ${currentTemplate}`);

                if (currentTemplate && (currentTemplate === 'base' || currentTemplate === 'node')) {
                    console.warn(`[E2B API] ⚠️ DETECTED WRONG TEMPLATE (${currentTemplate}). KILLING SANDBOX TO UPGRADE.`);
                    try {
                        await sandbox.kill();
                    } catch (e) { }
                    sandbox = undefined;
                    sandboxId = null; // Force creation path
                } else {
                    // Ensure git is configured on reconnect as well
                    await sandbox.commands.run('git config --global user.email "hello@appforge.ai" && git config --global user.name "AF AI"');
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
            const EXPO_TEMPLATE_ID = process.env.E2B_EXPO_TEMPLATE_ID || '0xcsz5virqvvmgjmqqam';

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
                        return json({
                            stdout: '',
                            stderr: 'ERROR: Cannot run Expo - module not installed. Please run "pnpm install" first.',
                            exitCode: 1,
                            sandboxId,
                            url: `/api/proxy?url=${encodeURIComponent(`https://${sandbox.getHost(8081)}`)}`
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
                // PERSISTENCE: Pipe output to file so we can retrieve logs later
                // We use tee to keep the stdout stream alive for our immediate listeners
                const baseCommand = command.replace(/^cd \/home\/user && /, '');
                command = `cd /home/user && (${baseCommand}) 2>&1 | tee /home/user/app.log`;
                console.log(`[E2B API] Start command modified for logging: ${command}`);
            }

            // AUTO-RECOVERY: If starting dev server but node_modules is missing, install first
            if (isStartCommand) {
                try {
                    const checkModules = await sandbox.commands.run('test -d node_modules && echo "EXISTS" || echo "MISSING"');
                    if (checkModules.stdout.includes('MISSING')) {
                        console.log(`[E2B ${sandboxId}] ⚠️ node_modules missing before start! Auto-installing...`);

                        // HOTFIX: Patch bad versions in package.json if present from previous failed runs
                        await sandbox.commands.run(`sed -i 's/"@types\\/react-native": "\\^0.81.0"/"@types\\/react-native": "^0.73.0"/g' package.json`);

                        await sandbox.commands.run('pnpm install', { timeoutMs: 240000 }); // 4 min timeout
                        console.log(`[E2B ${sandboxId}] ✅ Auto-install completed.`);
                    }
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Failed to check/install modules, proceeding anyway`, e);
                }
            }

            // For start commands, we kick it off and return immediately with the URL
            if (isStartCommand) {
                let collectedStdout = '';
                let collectedStderr = '';
                let tunnelUrl = '';

                // Force kill any existing process on port 8081 to prevent "Port already in use" errors
                // This is crucial for sandbox reuse
                try {
                    console.log(`[E2B ${sandboxId}] Killing port 8081...`);
                    // Try multiple methods to kill the process on port 8081
                    // 1. fuser (standard)
                    // 2. lsof (if fuser missing)
                    // 3. netstat + awk (fallback)
                    const killCmd = 'fuser -k 8081/tcp || kill -9 $(lsof -t -i:8081) || kill -9 $(netstat -tlpn | grep :8081 | awk \'{print $7}\' | cut -d\'/\' -f1) || true';
                    await sandbox.commands.run(killCmd);
                    // Wait a moment for OS to release the port
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Warning: failed to kill port 8081`, e);
                }

                // Run in background; capture initial output
                await sandbox.commands.run(command, {
                    background: true,
                    onStdout: (out: { toString: () => string }) => {
                        const str = out.toString();
                        console.log(`[E2B ${sandboxId}] ${str}`);
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
                        console.error(`[E2B ${sandboxId}] ${str}`);
                        collectedStderr += str;
                    }
                });

                // Wait for 45 seconds to capture tunnel URL from startup logs and let Metro bundle
                // Expo tunnel can take a while to establish
                await new Promise(resolve => setTimeout(resolve, 45000));

                // DIAGNOSTIC: Check if port 8081 is actually listening
                try {
                    const portCheck = await sandbox.commands.run('lsof -i :8081 || netstat -tlnp | grep 8081 || echo "Port 8081 not listening"');
                    console.log(`[E2B ${sandboxId}] 🔍 Port 8081 status:`, portCheck.stdout);
                    collectedStdout += '\n[System] Port check: ' + portCheck.stdout;
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Could not check port 8081`, e);
                }

                // Add a notice that the process continues
                if (collectedStdout.length > 0 && !collectedStdout.includes('QR Code')) {
                    collectedStdout += '\n[System] Server starting in background. Preview will appear when ready...';
                }

                // CRITICAL: Prefer E2B direct URL since ngrok detection is unreliable
                // The E2B host URL works directly without tunneling
                const e2bDirectUrl = `https://${sandbox.getHost(8081)}`;
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
                    url: `/api/proxy?url=${encodeURIComponent(previewUrl)}`
                });
            }

            // Normal foreground execution for other commands
            // For npm/pnpm install, use a longer timeout (10 minutes) and stream output
            const isInstallCommand = command.includes('npm install') || command.includes('pnpm install');

            if (isInstallCommand) {
                // AUTO-INJECTION: If package.json is missing (because we told LLM not to make one),
                // inject the Golden Template package.json immediately.
                try {
                    const checkPkg = await sandbox.commands.run('test -f package.json && echo "YES" || echo "NO"');
                    const hasPackageJson = checkPkg.stdout.trim() === 'YES';

                    if (!hasPackageJson) {
                        console.log(`[E2B ${sandboxId}] package.json missing, injecting Golden Template...`);
                        try {
                            const templatePath = path.resolve(process.cwd(), 'templates/af-expo-template/package.json');
                            const templateContent = fs.readFileSync(templatePath, 'utf-8');
                            // Write file using E2B filesystem API
                            await sandbox.files.write('package.json', templateContent);
                            console.log(`[E2B ${sandboxId}] Injected package.json from template.`);
                        } catch (err) {
                            console.error(`[E2B ${sandboxId}] Failed to inject template package.json:`, err);
                        }
                    }
                } catch (e) {
                    console.warn(`[E2B ${sandboxId}] Error checking for package.json:`, e);
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
                        url: `/api/proxy?url=${encodeURIComponent(`https://${sandbox.getHost(8081)}`)}`
                    });
                } catch (error: any) {
                    console.error(`[E2B ${sandboxId}] Install command failed:`, error);
                    return json({
                        stdout: collectedStdout,
                        stderr: collectedStderr + `\n\nError: ${error.message}`,
                        exitCode: 1,
                        sandboxId,
                        url: `/api/proxy?url=${encodeURIComponent(`https://${sandbox.getHost(8081)}`)}`
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
                    url: `/api/proxy?url=${encodeURIComponent(`https://${sandbox.getHost(8081)}`)}`
                });
            }

            return json({
                stdout: output.stdout,
                stderr: output.stderr,
                exitCode: output.exitCode ?? 0,
                sandboxId, // Return ID for client persistence
                url: `/api/proxy?url=${encodeURIComponent(`https://${sandbox.getHost(8081)}`)}` // Use proxy to bypass iframe restrictions
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
                await sandbox.files.writeBytes(targetPath, binaryData);
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
