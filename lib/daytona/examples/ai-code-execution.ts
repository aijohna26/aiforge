import { Daytona } from '@daytonaio/sdk';

/**
 * Example demonstrating AI-generated code execution pattern
 * Similar to the Lovable clone approach from the transcript
 */

interface AICodeExecutionResult {
    output: string;
    previewUrl: string;
    sandboxId: string;
    artifacts?: any;
}

/**
 * Execute AI-generated code in an isolated Daytona sandbox
 * @param prompt User prompt for code generation
 * @param generatedCode AI-generated code to execute
 * @returns Execution results including output and preview URL
 */
async function executeAIGeneratedCode(
    prompt: string,
    generatedCode: string
): Promise<AICodeExecutionResult> {
    console.log(`🤖 Executing AI code for prompt: "${prompt}"\n`);

    const daytona = new Daytona();
    const sandbox = await daytona.create();

    console.log(`📦 Created sandbox: ${sandbox.id}`);

    try {
        // Optional: Upload user files to sandbox before execution
        // await sandbox.fs.uploadFile('localFile.txt', '/home/daytona/file.txt')

        console.log('⚡ Executing AI-generated code...');

        // Execute the AI-generated code in the sandbox
        const execution = await sandbox.process.codeRun(generatedCode);

        console.log('✅ Execution complete');
        console.log(`Exit code: ${execution.exitCode}`);

        // Get preview URL for web applications
        console.log('🔗 Generating preview URL...');
        const previewLink = await sandbox.getPreviewLink(3000);

        return {
            output: execution.result || '',
            previewUrl: previewLink.url,
            sandboxId: sandbox.id,
            artifacts: execution.artifacts,
        };
    } catch (error) {
        console.error('❌ Execution failed:', error);
        // Cleanup on error
        await sandbox.delete();
        throw error;
    }

    // Note: Sandbox is kept alive for potential iteration
    // Call sandbox.stop() to pause or sandbox.delete() to cleanup when done
}

/**
 * Mock function - replace with your actual LLM integration
 * (Anthropic Claude, OpenAI, Google Gemini, etc.)
 */
function generateCodeFromPrompt(prompt: string): string {
    // Example: This would call your LLM API
    return `
import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(\`
    <!DOCTYPE html>
    <html>
      <head>
        <title>AI Generated App</title>
        <style>
          body {
            font-family: system-ui;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          h1 { font-size: 2.5rem; }
        </style>
      </head>
      <body>
        <h1>Generated from: ${prompt}</h1>
        <p>This is an AI-generated web application running in a Daytona sandbox!</p>
      </body>
    </html>
  \`);
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
`;
}

/**
 * Example usage with agentic loop (iterative refinement)
 */
async function agenticExample() {
    const prompt = 'Create a beautiful landing page for a banana company';

    // Step 1: Generate initial code
    console.log('🎨 Step 1: Generating initial code from LLM...');
    let code = generateCodeFromPrompt(prompt);

    // Step 2: Execute in sandbox
    console.log('\n📦 Step 2: Executing in Daytona sandbox...');
    const result = await executeAIGeneratedCode(prompt, code);

    console.log('\n✨ Results:');
    console.log(`Preview URL: ${result.previewUrl}`);
    console.log(`Sandbox ID: ${result.sandboxId}`);
    console.log(`\nOutput:\n${result.output}`);

    // Step 3: Optional - Iterate based on feedback
    // const feedback = "Make it more colorful";
    // const refinedCode = generateCodeFromPrompt(prompt + " " + feedback);
    // await executeAIGeneratedCode(feedback, refinedCode);

    console.log('\n💡 Sandbox kept alive for potential iteration');
    console.log('Call cleanupSandbox() when done');
}

// Export functions
export { executeAIGeneratedCode, generateCodeFromPrompt, agenticExample };

// Run example if executed directly
if (require.main === module) {
    agenticExample().catch(console.error);
}
