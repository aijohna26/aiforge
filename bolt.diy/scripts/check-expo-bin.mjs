#!/usr/bin/env node

import { Daytona } from '@daytonaio/sdk';
import 'dotenv/config';

const apiKey = process.env.DAYTONA_API_KEY;

async function checkExpoBin() {
  const daytona = new Daytona({ apiKey });
  const paginatedResult = await daytona.list();
  const sandbox = await daytona.get(paginatedResult.items[0].id);

  console.log('🔍 Checking expo bin directory...\n');

  const bin = await sandbox.process.executeCommand('ls -laR node_modules/expo/bin/', '/home/user');
  console.log(bin.result);

  console.log('\n🔍 Checking @expo/cli...\n');
  const expoCli = await sandbox.process.executeCommand('ls -la node_modules/@expo/ 2>&1 || echo "not found"', '/home/user');
  console.log(expoCli.result);

  console.log('\n🔍 Trying to reinstall expo...\n');
  const reinstall = await sandbox.process.executeCommand('npm install expo --legacy-peer-deps 2>&1 | tail -20', '/home/user');
  console.log(reinstall.result);

  console.log('\n🔍 After reinstall - checking bin again...\n');
  const binAfter = await sandbox.process.executeCommand('ls -la node_modules/.bin/expo', '/home/user');
  console.log(binAfter.result);

  console.log('\n🧪 Testing expo after reinstall...\n');
  const test = await sandbox.process.executeCommand('timeout 5 npx expo --version 2>&1 || true', '/home/user');
  console.log(test.result);
}

checkExpoBin().catch(console.error);
