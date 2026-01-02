import 'dotenv/config';
import { Sandbox } from '@e2b/code-interpreter';

async function main() {
    const templateId = '0xcsz5virqvvmgjmqqam'; // The Expo Template ID we built
    const apiKey = process.env.E2B_API_KEY;

    if (!apiKey) {
        console.error('Error: E2B_API_KEY is missing.');
        process.exit(1);
    }

    console.log(`🚀 Connecting to E2B Template: ${templateId}...`);
    const startTime = Date.now();

    try {
        const sandbox = await Sandbox.create(templateId, { apiKey });
        const duration = (Date.now() - startTime) / 1000;

        console.log(`✅ Sandbox created in ${duration}s`);
        console.log(`   Sandbox ID: ${sandbox.sandboxId}`);

        console.log('\n📝 Running "node -v"...');
        const nodeOut = await sandbox.commands.run('node -v');
        console.log(`   Output: ${nodeOut.stdout.trim()}`);

        console.log('\n📝 Running "npx expo --version"...');
        // We expect this to work since it's pre-installed
        const expoOut = await sandbox.commands.run('npx expo --version');
        console.log(`   Output: ${expoOut.stdout.trim()}`);

        console.log('\n📂 Listing home directory...');
        const lsOut = await sandbox.commands.run('ls -F /home/user');
        console.log(lsOut.stdout);

        // Keep it open for a bit or close it
        // await sandbox.close();
        console.log(`\n🎉 Test Passed! Sandbox ${sandbox.sandboxId} is ready.`);
        console.log(`You can now use curl to test the API if the dev server is running.`);

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

main();
