#!/usr/bin/env node

import { Daytona } from '@daytonaio/sdk';
import 'dotenv/config';

const apiKey = process.env.DAYTONA_API_KEY;

async function checkExpoOutput() {
  const daytona = new Daytona({ apiKey });

  const paginatedResult = await daytona.list();
  const sandboxes = paginatedResult.items || [];
  const sb = sandboxes[0];

  console.log(`📦 Sandbox: ${sb.id}\n`);

  const sandbox = await daytona.get(sb.id);

  // Kill any existing expo process
  console.log('🛑 Killing existing processes on port 8082...');
  await sandbox.process.executeCommand('pkill -f expo || true', '/home/user');
  await sandbox.process.executeCommand('pkill -f node || true', '/home/user');

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Try running expo with explicit verbose output
  console.log('\n🧪 Running: EXPO_NO_TELEMETRY=1 DEBUG=* npx expo start --web --port 8082\n');

  const cmd = 'timeout 15 bash -c "EXPO_NO_TELEMETRY=1 npx expo start --web --port 8082 2>&1" || true';
  const result = await sandbox.process.executeCommand(cmd, '/home/user');

  console.log('📄 Output:');
  console.log('─'.repeat(80));
  console.log(result.result);
  console.log('─'.repeat(80));
  console.log(`Exit code: ${result.exitCode}`);

  // Check if server.log was created
  console.log('\n📋 Checking for server.log...');
  const logCheck = await sandbox.process.executeCommand('test -f server.log && cat server.log || echo "No server.log"', '/home/user');
  console.log(logCheck.result);
}

checkExpoOutput().catch(console.error);
