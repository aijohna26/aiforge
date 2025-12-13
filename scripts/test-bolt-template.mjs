import { loadBoltExpoTemplate } from '../lib/load-bolt-template.ts';

async function test() {
  const files = await loadBoltExpoTemplate();
  console.log('Total files loaded:', Object.keys(files).length);
  console.log('\nFile paths:');
  Object.keys(files).forEach(path => {
    console.log('  ', path);
  });
}

test().catch(console.error);
