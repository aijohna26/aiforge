import { Daytona } from '@daytonaio/sdk';
import 'dotenv/config';

const apiKey = process.env.DAYTONA_API_KEY;

if (!apiKey) {
    console.error('❌ DAYTONA_API_KEY not set');
    process.exit(1);
}

async function runDiagnostic() {
    console.log('🧪 Starting Expo CLI Diagnostic...');
    const daytona = new Daytona({ apiKey });

    try {
        const paginatedResult = await daytona.list();
        const sandboxes = paginatedResult.items || [];

        if (sandboxes.length === 0) {
            console.log('⚠️ No sandboxes found.');
            return;
        }

        const sandbox = await daytona.get(sandboxes[0].id);
        console.log(`🔗 Connected to sandbox: ${sandbox.id}`);

        // Test 1: Direct Binary
        console.log('\n[Test 1] Direct Binary Execution: ./node_modules/.bin/expo --version');
        const t1 = await sandbox.process.executeCommand('./node_modules/.bin/expo --version', '/home/user');
        console.log(`   Exit Code: ${t1.exitCode}`);
        console.log(`   Output: ${t1.result.trim()}`);

        // Test 2: Node Execution (Wrapper)
        console.log('\n[Test 2] Node Execution: node -e "..."');
        // Using the snippet that was previously "wrong" but might work
        const cmd2 = `node -e "require('@expo/cli').run(['--version'])"`;
        const t2 = await sandbox.process.executeCommand(cmd2, '/home/user');
        console.log(`   Exit Code: ${t2.exitCode}`);
        console.log(`   Output: ${t2.result.trim()}`);

        // Test 3: Local npx without flags
        console.log('\n[Test 3] npx (no flags): npx expo --version');
        const t3 = await sandbox.process.executeCommand('npx expo --version', '/home/user');
        console.log(`   Exit Code: ${t3.exitCode}`);
        console.log(`   Output: ${t3.result.trim()}`);

        // Test 4: Local npx with --yes
        console.log('\n[Test 4] npx (with --yes): npx --yes expo --version');
        const t4 = await sandbox.process.executeCommand('npx --yes expo --version', '/home/user');
        console.log(`   Exit Code: ${t4.exitCode}`);
        console.log(`   Output: ${t4.result.trim()}`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

runDiagnostic();
