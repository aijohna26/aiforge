#!/usr/bin/env node

import { Daytona } from '@daytonaio/sdk';
import 'dotenv/config';

const apiKey = process.env.DAYTONA_API_KEY;

if (!apiKey) {
  console.error('❌ DAYTONA_API_KEY not set');
  process.exit(1);
}

async function debugSandbox() {
  const daytona = new Daytona({ apiKey });

  try {
    console.log('🔍 Listing all sandboxes...\n');
    const paginatedResult = await daytona.list();
    const sandboxes = paginatedResult.items || [];

    if (sandboxes.length === 0) {
      console.log('No sandboxes found.');
      return;
    }

    console.log(`Found ${sandboxes.length} sandbox(es):\n`);

    for (const sb of sandboxes) {
      console.log(`📦 Sandbox: ${sb.id}`);
      console.log(`   Status: ${sb.state}`);
      console.log(`   Created: ${sb.createdAt}`);
      console.log('');

      try {
        const sandbox = await daytona.get(sb.id);

        // Check if server.log exists
        console.log(`   📋 Checking /home/user/server.log...`);
        const logCheck = await sandbox.process.executeCommand('test -f /home/user/server.log && echo "EXISTS" || echo "MISSING"', '/home/user');
        console.log(`   Log file: ${logCheck.result?.trim()}`);

        if (logCheck.result?.includes('EXISTS')) {
          console.log('\n   📄 Last 50 lines of server.log:');
          console.log('   ' + '='.repeat(70));
          const logContent = await sandbox.process.executeCommand('tail -n 50 /home/user/server.log', '/home/user');
          console.log(logContent.result);
          console.log('   ' + '='.repeat(70));
        }

        // Check running processes
        console.log(`\n   🔄 Running processes on port 8082:`);
        const portCheck = await sandbox.process.executeCommand('lsof -i :8082 || echo "No process on port 8082"', '/home/user');
        console.log(`   ${portCheck.result}`);

        // Check if node_modules exists
        console.log(`\n   📦 Checking node_modules...`);
        const nmCheck = await sandbox.process.executeCommand('test -d /home/user/node_modules && echo "EXISTS" || echo "MISSING"', '/home/user');
        console.log(`   node_modules: ${nmCheck.result?.trim()}`);

        // Check if package.json exists
        console.log(`\n   📄 Checking package.json...`);
        const pkgCheck = await sandbox.process.executeCommand('test -f /home/user/package.json && echo "EXISTS" || echo "MISSING"', '/home/user');
        console.log(`   package.json: ${pkgCheck.result?.trim()}`);

        // List /home/user directory
        console.log(`\n   📁 Contents of /home/user:`);
        const lsResult = await sandbox.process.executeCommand('ls -la /home/user', '/home/user');
        console.log(lsResult.result);

        // Try to get Expo version
        console.log(`\n   🧪 Testing Expo CLI...`);
        const expoVersion = await sandbox.process.executeCommand('npx expo --version 2>&1', '/home/user');
        console.log(`   ${expoVersion.result}`);

        console.log('\n' + '='.repeat(80) + '\n');

      } catch (err) {
        console.error(`   ❌ Failed to debug sandbox ${sb.id}:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugSandbox();
