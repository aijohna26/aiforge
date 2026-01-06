import 'dotenv/config';
import { Template, defaultBuildLogger } from 'e2b';
import { template } from './template';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function main() {
    // Ensure API Key is available
    if (!process.env.E2B_API_KEY) {
        // Try to load from root .env.local
        console.log('E2B_API_KEY not found in default env, trying .env.local...');
        dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

        if (!process.env.E2B_API_KEY) {
            console.warn('❌ E2B_API_KEY still not found. Build will likely fail.');
        } else {
            console.log('✅ Loaded E2B_API_KEY from .env.local');
        }
    }

    const templateID = await Template.build(template, {
        alias: 'expo-template-v4',
        cpuCount: 4,
        memoryMB: 4096,
        onBuildLogs: defaultBuildLogger(),
    });

    console.log(`\n✅ Template built successfully!`);
    console.log(`Template ID: ${templateID.templateId}`);
    console.log(`Alias: expo-template`);
    console.log(`\nYou can now use this template ID in your CodeInterpreter.create({ template: '...' }) call.`);
}

main().catch(console.error);
