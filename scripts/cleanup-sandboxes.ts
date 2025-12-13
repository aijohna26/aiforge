import { Sandbox } from 'e2b';

async function cleanupAllSandboxes() {
    const apiKey = process.env.E2B_API_KEY;

    if (!apiKey) {
        console.error('E2B_API_KEY not found in environment');
        process.exit(1);
    }

    try {
        console.log('[Cleanup] Fetching all sandboxes...');
        const sandboxes = await Sandbox.list({ apiKey });

        console.log(`[Cleanup] Found ${sandboxes.length} sandboxes`);

        if (sandboxes.length === 0) {
            console.log('[Cleanup] No sandboxes to clean up');
            return;
        }

        console.log('[Cleanup] Killing all sandboxes...');
        let killed = 0;

        for (const sbx of sandboxes) {
            try {
                await Sandbox.kill(sbx.sandboxId, { apiKey });
                console.log(`[Cleanup] Killed sandbox: ${sbx.sandboxId}`);
                killed++;
            } catch (error: any) {
                if (error.status === 404 || error.message?.includes('not found')) {
                    console.log(`[Cleanup] Sandbox ${sbx.sandboxId} already terminated`);
                } else {
                    console.error(`[Cleanup] Failed to kill ${sbx.sandboxId}:`, error.message);
                }
            }
        }

        console.log(`[Cleanup] Successfully killed ${killed}/${sandboxes.length} sandboxes`);

    } catch (error) {
        console.error('[Cleanup] Error:', error);
        process.exit(1);
    }
}

cleanupAllSandboxes();
