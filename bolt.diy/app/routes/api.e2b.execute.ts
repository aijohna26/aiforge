
import { json } from '@remix-run/cloudflare';
import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { Sandbox } from '@e2b/code-interpreter';

import { inngest } from '~/lib/inngest/client';

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
                sandbox = await Sandbox.connect(sandboxId, { apiKey });
                console.log(`[E2B API] Reconnected to sandbox: ${sandboxId}`);
                // Ensure git is configured on reconnect as well
                await sandbox.commands.run('git config --global user.email "bolt@appforge.ai" && git config --global user.name "AF AI"');
            } catch (e) {
                console.warn(`[E2B API] Failed to connect to sandbox ${sandboxId}, creating new one.`);
                sandboxId = null; // Reset to create new
            }
        }

        if (!sandbox) {
            sandbox = (template
                ? await Sandbox.create(template, { apiKey })
                : await Sandbox.create({ apiKey })) as any;
            sandboxId = sandbox.sandboxId;
            console.log(`[E2B API] Created new sandbox: ${sandboxId}`);

            // Install pnpm globally for better memory efficiency
            // pnpm uses hard links and is much more memory efficient than npm
            try {
                console.log(`[E2B ${sandboxId}] Installing pnpm and @expo/ngrok globally...`);
                await sandbox.commands.run('npm install -g pnpm @expo/ngrok --silent', { timeout: 120000 });
                console.log(`[E2B ${sandboxId}] Global tools installed successfully`);

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

            // For start commands, we kick it off and return immediately with the URL
            if (isStartCommand) {
                let collectedStdout = '';
                let collectedStderr = '';

                // Force kill any existing process on port 8081 to prevent "Port already in use" errors
                // This is crucial for sandbox reuse
                try {
                    console.log(`[E2B ${sandboxId}] Killing port 8081...`);
                    await sandbox.commands.run('fuser -k 8081/tcp || true');
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
                    },
                    onStderr: (err: { toString: () => string }) => {
                        const str = err.toString();
                        console.error(`[E2B ${sandboxId}] ${err}`);
                        collectedStderr += str;
                    }
                });

                // Wait for 2.5 seconds to capture immediate errors or startup msgs
                await new Promise(resolve => setTimeout(resolve, 2500));

                // Add a notice that the process continues
                if (collectedStdout.length > 0 && !collectedStdout.includes('QR Code')) {
                    collectedStdout += '\n[System] Server starting in background. Preview will appear when ready...';
                }

                return json({
                    stdout: collectedStdout,
                    stderr: collectedStderr,
                    exitCode: 0,
                    sandboxId,
                    url: `/api/proxy?url=${encodeURIComponent(`https://${sandbox.getHost(8081)}`)}`
                });
            }

            // Normal foreground execution for other commands
            // For npm/pnpm install, use a longer timeout (10 minutes) and stream output
            const isInstallCommand = command.includes('npm install') || command.includes('pnpm install');

            if (isInstallCommand) {
                console.log(`[E2B ${sandboxId}] Running install command with extended timeout...`);
                let collectedStdout = '';
                let collectedStderr = '';

                try {
                    const output = await sandbox.commands.run(command, {
                        timeout: 600000, // 10 minutes for install
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

            // CRITICAL: Validate and auto-fix package.json scripts
            if (file === 'package.json') {
                try {
                    const pkg = JSON.parse(content);
                    console.log(`[E2B API] 📦 Received package.json scripts:`, JSON.stringify(pkg.scripts, null, 2));

                    // Check if this is an Expo project
                    const isExpo = pkg.dependencies?.expo ||
                        pkg.dependencies?.['expo-router'] ||
                        (pkg.scripts?.dev && pkg.scripts.dev.includes('expo'));

                    if (isExpo) {
                        let fixed = false;

                        // Validate dev script
                        if (!pkg.scripts?.dev || !pkg.scripts.dev.includes('--tunnel')) {
                            pkg.scripts = pkg.scripts || {};
                            pkg.scripts.dev = 'EXPO_NO_TELEMETRY=1 npx expo start --tunnel';
                            console.warn(`[E2B API] ⚠️ Auto-fixed missing/incorrect dev script`);
                            fixed = true;
                        }

                        // Validate start script
                        if (!pkg.scripts?.start || !pkg.scripts.start.includes('--tunnel')) {
                            pkg.scripts = pkg.scripts || {};
                            pkg.scripts.start = 'EXPO_NO_TELEMETRY=1 npx expo start --tunnel';
                            console.warn(`[E2B API] ⚠️ Auto-fixed missing/incorrect start script`);
                            fixed = true;
                        }

                        // Ensure @expo/ngrok is installed for tunneling
                        if (!pkg.devDependencies?.['@expo/ngrok'] && !pkg.dependencies?.['@expo/ngrok']) {
                            pkg.devDependencies = pkg.devDependencies || {};
                            pkg.devDependencies['@expo/ngrok'] = '^4.1.0';
                            console.warn(`[E2B API] ⚠️ Added @expo/ngrok for tunneling support`);
                            fixed = true;
                        }

                        // SANITIZATION: Fix known hallucinated versions
                        // LLMs often guess "~1.0.0" for packages that don't have it.
                        const FIXES: Record<string, string> = {
                            'expo-splash-screen': 'latest',
                            'expo-status-bar': 'latest',
                            'expo-updates': 'latest',
                            'expo-font': 'latest'
                        };

                        const sanitizeDeps = (deps: Record<string, string> = {}) => {
                            let changed = false;
                            for (const [pkg, version] of Object.entries(deps)) {
                                // Match ~1.0.0, ^1.0.0, 1.0.0, ~1.1.0, etc. - any 1.x.x version is likely wrong for these packages
                                if (FIXES[pkg] && (version.startsWith('~1.') || version.startsWith('^1.') || version.startsWith('1.'))) {
                                    console.warn(`[E2B API] 🔧 Fixing bad version for ${pkg}: ${version} -> ${FIXES[pkg]}`);
                                    deps[pkg] = FIXES[pkg];
                                    changed = true;
                                }
                            }
                            return changed;
                        };

                        if (sanitizeDeps(pkg.dependencies)) fixed = true;
                        if (sanitizeDeps(pkg.devDependencies)) fixed = true;

                        // Add .npmrc settings to reduce memory usage during install
                        // We'll create a companion .npmrc file
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

                        // Queue .npmrc creation (we'll need to do this separately)
                        console.log(`[E2B API] 📝 Will create optimized .npmrc for Expo project`);

                        if (fixed) {
                            content = JSON.stringify(pkg, null, 2);
                            console.log(`[E2B API] ✅ Fixed package.json scripts:`, JSON.stringify(pkg.scripts, null, 2));
                        } else {
                            console.log(`[E2B API] ✅ package.json scripts validated OK`);
                        }

                        // Write .npmrc alongside package.json
                        try {
                            await sandbox.files.write('.npmrc', npmrcContent);
                            console.log(`[E2B API] ✅ Created optimized .npmrc`);
                        } catch (e) {
                            console.warn(`[E2B API] Warning: Failed to create .npmrc`, e);
                        }
                    }
                } catch (e) {
                    console.error(`[E2B API] ❌ Failed to validate package.json`, e);
                }
            }

            const dirname = file.substring(0, file.lastIndexOf('/'));
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
                await sandbox.files.writeBytes(file, binaryData);
            } else {
                // Write as text
                await sandbox.files.write(file, content);
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
