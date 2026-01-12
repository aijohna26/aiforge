import { Daytona } from '@daytonaio/sdk';
import 'dotenv/config';

const apiKey = process.env.DAYTONA_API_KEY;

if (!apiKey) {
    console.error('❌ DAYTONA_API_KEY not set');
    process.exit(1);
}

async function verifyLocaltCLI() {
    console.log('🧪 Verifying local Expo CLI execution...');
    const daytona = new Daytona({ apiKey });

    try {
        const paginatedResult = await daytona.list();
        const sandbox = await daytona.get(paginatedResult.items[0].id);

        // 1. Check if the file exists and has content
        console.log('\n[Check 1] Inspecting node_modules/expo/bin/cli...');
        const ls = await sandbox.process.executeCommand('ls -la node_modules/expo/bin/cli', '/home/user');
        console.log(ls.result);

        // 2. Try executing it with node
        console.log('\n[Check 2] Executing: node node_modules/expo/bin/cli --version');
        const run = await sandbox.process.executeCommand('node node_modules/expo/bin/cli --version', '/home/user');
        console.log(`   Exit Code: ${run.exitCode}`);
        console.log(`   Output: ${run.result.trim()}`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

verifyLocaltCLI();
