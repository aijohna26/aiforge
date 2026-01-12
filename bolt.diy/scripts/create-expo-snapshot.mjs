#!/usr/bin/env node

/**
 * Daytona Snapshot Creation Script
 *
 * This script creates a pre-built Daytona snapshot from the af-expo-template-v8 template.
 * The snapshot will be permanently cached and reused for all sandbox creations.
 *
 * Usage:
 *   DAYTONA_API_KEY=your_key node scripts/create-expo-snapshot.mjs
 *   OR
 *   npm run create-expo-snapshot
 */

import { Daytona, Image } from '@daytonaio/sdk';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOT_NAME = 'af-expo-v10';

async function createExpoSnapshot() {
  const apiKey = process.env.DAYTONA_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: DAYTONA_API_KEY environment variable is not set');
    console.error('Usage: DAYTONA_API_KEY=your_key node scripts/create-expo-snapshot.mjs');
    process.exit(1);
  }

  console.log('🚀 Creating Daytona snapshot: ' + SNAPSHOT_NAME);
  console.log('📁 Template source: templates/af-expo-template-v8');
  console.log('');

  try {
    const daytona = new Daytona({ apiKey });

    // Check if snapshot already exists and delete it
    try {
      console.log('🔍 Checking for existing snapshot...');
      const existingSnapshot = await daytona.snapshot.get(SNAPSHOT_NAME);
      console.log(`⚠️  Snapshot "${SNAPSHOT_NAME}" already exists (ID: ${existingSnapshot.id})`);
      console.log('🗑️  Deleting existing snapshot to recreate...');

      // Use the snapshots list to find and delete
      const allSnapshots = await daytona.snapshot.list();
      const snapshotToDelete = allSnapshots.items?.find(s => s.name === SNAPSHOT_NAME);

      if (snapshotToDelete) {
        // Delete using REST API directly since SDK has issues
        const response = await fetch(`https://api.daytona.app/snapshot/${snapshotToDelete.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete snapshot: ${response.statusText}`);
        }

        console.log('✅ Deleted existing snapshot');
        // Wait a bit for deletion to propagate
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      // Snapshot doesn't exist or error during deletion check
      if (error instanceof Error && !error.message.includes('not found')) {
        console.warn('⚠️  Error checking/deleting existing snapshot:', error.message);
      } else {
        console.log('✅ No existing snapshot found');
      }
    }

    console.log('');

    // Define the declarative image
    console.log('🏗️  Building declarative image...');

    // Get absolute path to template directory
    const templateDir = path.resolve(__dirname, '..', 'templates', 'af-expo-template-v8');
    console.log(`   Template directory: ${templateDir}`);

    const image = Image.base('node:20-bookworm-slim')
      .runCommands('apt-get update && apt-get install -y git ca-certificates lsof psmisc && apt-get clean && rm -rf /var/lib/apt/lists/*')
      .addLocalDir(templateDir, '/home/user')
      .workdir('/home/user')
      .runCommands('npm install --legacy-peer-deps --verbose')
      .runCommands('npx --yes @expo/cli@latest --version')  // Cache Expo CLI globally
      .runCommands('npx --yes expo --version');  // Verify local Expo works

    console.log('');
    console.log('📦 Creating snapshot (this may take a few minutes)...');
    console.log('');

    // Create the snapshot with resource specifications and entrypoint
    await daytona.snapshot.create(
      {
        name: SNAPSHOT_NAME,
        image,
        resources: {
          cpu: 2,       // 2 vCPU
          memory: 4,    // 4 GiB RAM
          disk: 8,      // 8 GiB disk
        },
        entrypoint: ['sleep', 'infinity'],  // Keep sandbox alive
      },
      {
        onLogs: (log) => {
          // Stream build logs to console
          console.log(log);
        },
      }
    );

    console.log('');
    console.log('✅ Snapshot created successfully!');
    console.log(`   Snapshot name: ${SNAPSHOT_NAME}`);
    console.log('   The snapshot is now ready to use for sandbox creation.');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Verify snapshot appears in Daytona dashboard');
    console.log('   2. Update api.daytona.execute.ts to use this snapshot');
    console.log('   3. Test sandbox creation with: npm run dev');

  } catch (error) {
    console.error('');
    console.error('❌ Failed to create snapshot:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the script
createExpoSnapshot();
