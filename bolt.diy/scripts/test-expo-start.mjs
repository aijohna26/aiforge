#!/usr/bin/env node

import { Daytona } from '@daytonaio/sdk';
import 'dotenv/config';

const apiKey = process.env.DAYTONA_API_KEY;

if (!apiKey) {
  console.error('❌ DAYTONA_API_KEY not set');
  process.exit(1);
}

async function testExpoStart() {
  const daytona = new Daytona({ apiKey });

  try {
    const paginatedResult = await daytona.list();
    const sandboxes = paginatedResult.items || [];

    if (sandboxes.length === 0) {
      console.log('No sandboxes found.');
      return;
    }

    const sb = sandboxes[0];
    console.log(`📦 Testing Expo start in sandbox: ${sb.id}\n`);

    const sandbox = await daytona.get(sb.id);

    // Test 1: Check npm version
    console.log('🧪 Test 1: npm version');
    const npmVersion = await sandbox.process.executeCommand('npm --version', '/home/user');
    console.log(`   npm: ${npmVersion.result}`);

    // Test 2: Check node version
    console.log('\n🧪 Test 2: node version');
    const nodeVersion = await sandbox.process.executeCommand('node --version', '/home/user');
    console.log(`   node: ${nodeVersion.result}`);

    // Test 3: Check if expo is in node_modules
    console.log('\n🧪 Test 3: Check expo in node_modules');
    const expoCheck = await sandbox.process.executeCommand('test -d node_modules/expo && echo "EXISTS" || echo "MISSING"', '/home/user');
    console.log(`   expo module: ${expoCheck.result}`);

    // Test 4: Try to run expo --version directly
    console.log('\n🧪 Test 4: Run expo --version');
    const expoV = await sandbox.process.executeCommand('npx --yes expo --version 2>&1', '/home/user');
    console.log(`   Output: ${expoV.result}`);
    console.log(`   Exit code: ${expoV.exitCode}`);

    // Test 5: Try npm start with full output
    console.log('\n🧪 Test 5: Run npm start (will timeout after 10s)');
    console.log('   Starting...');

    try {
      const startCmd = 'timeout 10 npm start 2>&1 || true';
      const startResult = await sandbox.process.executeCommand(startCmd, '/home/user');
      console.log(`   Exit code: ${startResult.exitCode}`);
      console.log(`   Output:\n${startResult.result}`);
    } catch (err) {
      console.error(`   Error: ${err.message}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testExpoStart();
