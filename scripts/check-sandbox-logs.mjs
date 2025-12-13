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

        // Try to manually run yarn install to see what happens
        console.log('\n=== Running yarn install ===');
        const yarnInstall = await sandbox.commands.run('cd /home/user && yarn install', {
            onStdout: (data) => console.log('[stdout]', data.trim()),
            onStderr: (data) => console.log('[stderr]', data.trim()),
            timeoutMs: 5 * 60 * 1000  // 5 minutes
        });
        console.log('\nYarn install exit code:', yarnInstall.exitCode);

        if (yarnInstall.exitCode === 0) {
            console.log('\n✓ Yarn install succeeded!');

            // Now try to start Expo
            console.log('\n=== Starting Expo ===');
            await sandbox.commands.run('cd /home/user && npx expo start --web --port 3000', {
                background: true,
                onStdout: (data) => console.log('[expo]', data.trim()),
                onStderr: (data) => console.log('[expo-err]', data.trim()),
            });

            console.log('Expo started in background');
            console.log(`Preview URL: https://${sandbox.getHost(3000)}`);
        } else {
            console.log('\n✗ Yarn install failed');
        }

        console.log('\nSandbox left running for debugging');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSandbox();
