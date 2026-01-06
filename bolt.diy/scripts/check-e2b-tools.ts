
import { Sandbox } from '@e2b/code-interpreter';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkTools() {
    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) {
        console.error('No E2B_API_KEY found in .env.local');
        return;
    }

    console.log('Connecting to E2B to check available system tools...');
    // Use the v4 template if defined, or default
    const template = process.env.E2B_EXPO_TEMPLATE_ID || 'expo-template-v4';

    let sandbox;
    try {
        // Try creating a sandbox with the template
        console.log(`Spawning sandbox with template: ${template}...`);
        sandbox = await Sandbox.create(template, { apiKey });
    } catch (e) {
        console.log('Failed to create with specific template, falling back to default...');
        sandbox = await Sandbox.create({ apiKey });
    }

    try {
        console.log('\n--- System Tool Check ---');
        const tools = ['fuser', 'lsof', 'netstat', 'ss', 'killall', 'pkill', 'ps', 'busybox'];

        for (const tool of tools) {
            const check = await sandbox.commands.run(`which ${tool} || echo "MISSING"`);
            const path = check.stdout.trim();
            console.log(`[${tool.padEnd(8)}] ${path === 'MISSING' ? '❌ Not Found' : '✅ ' + path}`);
        }

        console.log('\n--- OS Info ---');
        const os = await sandbox.commands.run('cat /etc/os-release');
        console.log(os.stdout);

    } catch (error) {
        console.error('Error running checks:', error);
    } finally {
        if (sandbox) {
            await sandbox.kill();
            console.log('\nSandbox killed.');
        }
    }
}

checkTools();
