#!/usr/bin/env node

import { Daytona } from '@daytonaio/sdk';
import 'dotenv/config';

const apiKey = process.env.DAYTONA_API_KEY;

async function diagnoseNpx() {
  const daytona = new Daytona({ apiKey });
  const paginatedResult = await daytona.list();
  const sandbox = await daytona.get(paginatedResult.items[0].id);

  console.log('🔍 Diagnosing npx and expo...\n');

  // Check which expo binary
  console.log('1️⃣ Checking which expo:');
  const which = await sandbox.process.executeCommand('which expo || echo "not in PATH"', '/home/user');
  console.log(which.result);

  // Check if expo binary exists in node_modules
  console.log('\n2️⃣ Checking node_modules/.bin/expo:');
  const bin = await sandbox.process.executeCommand('ls -la node_modules/.bin/expo* || echo "not found"', '/home/user');
  console.log(bin.result);

  // Try running expo directly from node_modules
  console.log('\n3️⃣ Running ./node_modules/.bin/expo --version:');
  const direct = await sandbox.process.executeCommand('timeout 5 ./node_modules/.bin/expo --version 2>&1 || true', '/home/user');
  console.log(direct.result);

  // Check node_modules/expo
  console.log('\n4️⃣ Checking node_modules/expo:');
  const expoDir = await sandbox.process.executeCommand('ls -la node_modules/expo/ | head -20', '/home/user');
  console.log(expoDir.result);

  // Try to manually run the CLI entry point
  console.log('\n5️⃣ Running node node_modules/expo/bin/cli.js --version:');
  const manual = await sandbox.process.executeCommand('timeout 5 node node_modules/expo/bin/cli.js --version 2>&1 || true', '/home/user');
  console.log(manual.result);

  // Check stderr explicitly
  console.log('\n6️⃣ Trying npx with stderr redirected:');
  const npxTest = await sandbox.process.executeCommand('timeout 5 npx expo --version 2>&1 | cat || true', '/home/user');
  console.log(`Output: "${npxTest.result}"`);
  console.log(`Exit code: ${npxTest.exitCode}`);
}

diagnoseNpx().catch(console.error);
