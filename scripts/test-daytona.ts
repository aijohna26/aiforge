import { Daytona } from '@daytonaio/sdk';

/**
 * Test script to verify Daytona SDK setup
 * Run with: npx tsx scripts/test-daytona.ts
 */

async function testDaytonaSetup() {
    console.log('🧪 Testing Daytona SDK Setup...\n');

    try {
        // Test 1: Initialize client
        console.log('1️⃣ Initializing Daytona client...');
        const daytona = new Daytona();
        console.log('   ✅ Daytona client initialized\n');

        // Test 2: Create sandbox
        console.log('2️⃣ Creating sandbox...');
        const sandbox = await daytona.create();
        console.log(`   ✅ Sandbox created: ${sandbox.id}\n`);
        console.log('   🔍 sandbox.process keys:', Object.keys(sandbox.process));
        console.log('   🔍 sandbox.process prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(sandbox.process)));

        // Test 3: Execute simple command
        console.log('3️⃣ Executing test command...');
        const result = await sandbox.process.executeCommand('echo "Hello Daytona"');
        console.log(`   ✅ Command executed`);
        console.log(`   📤 Output: ${result.result}\n`);

        // Test 4: Test code execution
        console.log('4️⃣ Testing code execution...');
        const codeResult = await sandbox.process.codeRun(`
const message = "Daytona SDK is working!";
console.log(message);
    `);
        console.log(`   ✅ Code executed`);
        console.log(`   📤 Output: ${codeResult.result}\n`);

        // Test 5: Cleanup
        console.log('5️⃣ Cleaning up sandbox...');
        await sandbox.delete();
        console.log('   ✅ Sandbox deleted\n');

        // Final summary
        console.log('═'.repeat(50));
        console.log('✅ All tests passed successfully!');
        console.log('═'.repeat(50));
        console.log('\n📝 Next steps:');
        console.log('   • Integrate Daytona with your preview system');
        console.log('   • Upload React Native projects to sandboxes');
        console.log('   • Generate preview URLs for user projects');
        console.log('   • Implement lifecycle management\n');

        return true;
    } catch (error) {
        console.error('\n❌ Test failed:');
        console.error(error);

        if ((error as any).message?.includes('API key')) {
            console.log('\n💡 Tip: Make sure DAYTONA_API_KEY is set in your .env.local file');
        }

        return false;
    }
}

// Run tests
testDaytonaSetup()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
