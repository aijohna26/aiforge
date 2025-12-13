import {
    createSandbox,
    executeCode,
    getPreviewLink,
    cleanupSandbox,
} from '../sandbox';

/**
 * Basic example demonstrating Daytona sandbox lifecycle:
 * 1. Create a sandbox
 * 2. Execute code
 * 3. Get preview link
 * 4. Cleanup
 */
async function basicExample() {
    console.log('🚀 Starting Daytona basic example...\n');

    // Step 1: Create sandbox
    console.log('📦 Creating sandbox...');
    const sandbox = await createSandbox({
        language: 'typescript',
        envVars: { NODE_ENV: 'development' },
    });
    console.log(`✅ Sandbox created: ${sandbox.id}\n`);

    try {
        // Step 2: Execute code
        console.log('⚡ Executing code...');
        const result = await executeCode(
            sandbox,
            `console.log('Hello from Daytona!'); 
console.log('Process:', process.version);`
        );
        console.log('📤 Output:');
        console.log(result.stdout);
        console.log(`Exit code: ${result.exitCode}\n`);

        // Step 3: Get preview link (if running a web server)
        console.log('🔗 Getting preview link...');
        const preview = await getPreviewLink(sandbox, 3000);
        console.log(`Preview URL: ${preview.url}\n`);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        // Step 4: Cleanup
        console.log('🧹 Cleaning up sandbox...');
        await cleanupSandbox(sandbox);
        console.log('✅ Sandbox cleaned up\n');
    }

    console.log('✨ Example complete!');
}

// Run the example
if (require.main === module) {
    basicExample().catch(console.error);
}

export { basicExample };
