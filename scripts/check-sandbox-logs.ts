import { Sandbox } from 'e2b';

async function checkSandbox() {
    const sandboxId = 'i845uqihzlo9pqystkxdp';
    const apiKey = process.env.E2B_API_KEY;

    if (!apiKey) {
        console.error('E2B_API_KEY not set');
        process.exit(1);
    }

    try {
        // Connect to existing sandbox
        console.log(`Connecting to sandbox ${sandboxId}...`);
        const sandbox = await Sandbox.connect(sandboxId, { apiKey });

        console.log('✓ Connected to sandbox');
        console.log('Sandbox host:', sandbox.getHost(3000));

        // Check what processes are running
        console.log('\n=== Running Processes ===');
        const psResult = await sandbox.commands.run('ps aux');
        console.log(psResult.stdout);

        // Check what's listening on ports
        console.log('\n=== Listening Ports ===');
        const portsResult = await sandbox.commands.run('netstat -tlnp 2>/dev/null || ss -tlnp 2>/dev/null || lsof -i -P -n | grep LISTEN');
        console.log(portsResult.stdout || portsResult.stderr);

        // Check if files exist
        console.log('\n=== Files in /home/user ===');
        const lsResult = await sandbox.commands.run('ls -la /home/user');
        console.log(lsResult.stdout);

        // Check if package.json exists
        console.log('\n=== package.json check ===');
        const pkgCheck = await sandbox.commands.run('cat /home/user/package.json 2>&1 | head -20');
        console.log(pkgCheck.stdout || pkgCheck.stderr);

        // Check if node_modules exists
        console.log('\n=== node_modules check ===');
        const nmCheck = await sandbox.commands.run('ls -la /home/user/node_modules 2>&1 | head -10');
        console.log(nmCheck.stdout || nmCheck.stderr);

        // Check for any Expo or Node processes
        console.log('\n=== Expo/Node processes ===');
        const expoCheck = await sandbox.commands.run('ps aux | grep -E "(expo|node)" | grep -v grep');
        console.log(expoCheck.stdout || 'No Expo/Node processes found');

        // Try to see logs from any running commands
        console.log('\n=== Recent logs (if any) ===');
        const logsCheck = await sandbox.commands.run('tail -100 /home/user/*.log 2>&1 || echo "No log files found"');
        console.log(logsCheck.stdout || logsCheck.stderr);

        // Try to manually run yarn install to see what happens
        console.log('\n=== Manually running yarn install ===');
        const yarnInstall = await sandbox.commands.run('cd /home/user && yarn install 2>&1');
        console.log('Exit code:', yarnInstall.exitCode);
        console.log('Output:', yarnInstall.stdout);
        if (yarnInstall.stderr) {
            console.log('Stderr:', yarnInstall.stderr);
        }

        // Don't kill the sandbox, leave it for debugging
        // await sandbox.kill();
        console.log('\nSandbox inspection complete (sandbox left running)');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSandbox();
