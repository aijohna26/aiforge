import { Daytona } from '@daytonaio/sdk';
import 'dotenv/config';

const apiKey = process.env.DAYTONA_API_KEY;

if (!apiKey) {
    console.error('❌ DAYTONA_API_KEY not set');
    process.exit(1);
}

async function inspectModules() {
    console.log('🔍 Inspecting node_modules...');
    const daytona = new Daytona({ apiKey });

    try {
        const paginatedResult = await daytona.list();
        const sandboxes = paginatedResult.items || [];
        if (sandboxes.length === 0) return;

        const sandbox = await daytona.get(sandboxes[0].id);

        // 1. Check @expo/cli existence and package.json
        console.log('\nChecking @expo/cli package.json...');
        try {
            const cat = await sandbox.process.executeCommand('cat node_modules/@expo/cli/package.json', '/home/user');
            console.log(cat.result);
        } catch (e) { console.log('Error reading @expo/cli/package.json'); }

        // 2. Check local expo package
        console.log('\nChecking expo package.json...');
        try {
            const cat = await sandbox.process.executeCommand('cat node_modules/expo/package.json', '/home/user');
            console.log(cat.result);
        } catch (e) { console.log('Error reading expo/package.json'); }

        // 3. List bin directory
        console.log('\nListing node_modules/.bin...');
        try {
            const ls = await sandbox.process.executeCommand('ls -la node_modules/.bin', '/home/user');
            console.log(ls.result);
        } catch (e) { console.log('Error listing .bin'); }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

inspectModules();
