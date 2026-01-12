#!/usr/bin/env node

import { Daytona } from '@daytonaio/sdk';

const SNAPSHOT_NAME = 'af-expo-v4';

async function deleteExpoSnapshot() {
  const apiKey = process.env.DAYTONA_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: DAYTONA_API_KEY environment variable is not set');
    process.exit(1);
  }

  try {
    const daytona = new Daytona({ apiKey });

    console.log(`🔍 Finding snapshot: ${SNAPSHOT_NAME}...`);
    const snapshot = await daytona.snapshot.get(SNAPSHOT_NAME);

    console.log(`🗑️  Deleting snapshot ID: ${snapshot.id}...`);
    await daytona.snapshot.delete(snapshot.id);
    console.log(`✅ Snapshot deleted successfully`);
  } catch (error) {
    console.error('❌ Failed to delete snapshot:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

deleteExpoSnapshot();
