import { Daytona } from '@daytonaio/sdk';

const apiKey = process.env.DAYTONA_API_KEY;

if (!apiKey) {
  console.error('❌ DAYTONA_API_KEY not set');
  process.exit(1);
}

const daytona = new Daytona({ apiKey });

console.log('🔍 Fetching all Daytona sandboxes...');
const result = await daytona.list();
const sandboxes = result.items || [];

console.log(`Found ${sandboxes.length} sandbox(es)`);

if (sandboxes.length === 0) {
  console.log('✅ No sandboxes to clean up');
  process.exit(0);
}

console.log('\n🗑️  Deleting all sandboxes...\n');

// Delete one at a time synchronously
for (const sb of sandboxes) {
  try {
    console.log(`Deleting: ${sb.id}...`);
    await daytona.delete(sb.id);
    console.log(`✅ Deleted: ${sb.id}`);
  } catch (error) {
    console.error(`❌ Failed to delete ${sb.id}:`, error.message);
  }
}

console.log('\n✅ Cleanup complete!');
