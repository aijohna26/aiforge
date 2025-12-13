import { Daytona } from '@daytonaio/sdk';

async function cleanupDaytona() {
    console.log('🧹 Starting Daytona cleanup...');
    const daytona = new Daytona();

    try {
        console.log('📋 Listing sandboxes...');
        const result = await daytona.list();
        console.log('Result keys:', Object.keys(result));

        let sandboxes: any[] = [];
        if (Array.isArray(result)) {
            sandboxes = result;
        } else {
            // Find the array property
            const arrayKey = Object.keys(result).find(key => Array.isArray((result as any)[key]));
            if (arrayKey) {
                console.log(`Found array in property: ${arrayKey}`);
                sandboxes = (result as any)[arrayKey];
            }
        }

        console.log(`Found ${sandboxes.length} sandboxes.`);

        for (const sandbox of sandboxes) {
            console.log(`🗑️  Deleting sandbox ${sandbox.id}...`);
            try {
                // Try calling delete on the sandbox object itself if available
                if (typeof sandbox.delete === 'function') {
                    await sandbox.delete();
                } else {
                    // Fallback to client delete
                    await daytona.delete(sandbox.id);
                }
                console.log(`   ✅ Deleted ${sandbox.id}`);
            } catch (err) {
                console.error(`   ❌ Failed to delete ${sandbox.id}:`, err);
            }
        }

        console.log('\n✨ Cleanup complete!');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

cleanupDaytona();
