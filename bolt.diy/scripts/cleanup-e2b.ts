import { Sandbox } from '@e2b/code-interpreter';
import { config } from 'dotenv';
import path from 'path';

// Load env vars
config({ path: path.resolve(process.cwd(), '.env.local') });

async function cleanup() {
    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) {
        console.error('E2B_API_KEY not found in .env.local');
        process.exit(1);
    }

    console.log('Fetching active sandboxes...');
    try {
        const rawResult = await Sandbox.list({ apiKey });
        console.log('Result keys:', Object.keys(rawResult));

        // Attempt to iterate directly if it supports it
        let total = 0;
        try {
            // @ts-ignore
            for await (const sb of rawResult) {
                console.log(`Killing ${sb.sandboxId}...`);
                try {
                    await Sandbox.kill(sb.sandboxId, { apiKey });
                    console.log(`✅ Killed ${sb.sandboxId}`);
                    total++;
                } catch (e) {
                    console.error(`❌ Failed to kill ${sb.sandboxId}`, e);
                }
            }
        } catch (iterErr) {
            console.log("Not async iterable, trying legacy access...");
            // Fallback or debug code if needed
        }

        console.log(`Cleanup complete. Killed ${total} sandboxes.`);
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

cleanup();
