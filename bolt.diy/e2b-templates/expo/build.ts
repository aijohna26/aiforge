import 'dotenv/config';
import { Template, defaultBuildLogger } from 'e2b';
import { template } from './template';

async function main() {
    // Ensure API Key is available
    if (!process.env.E2B_API_KEY) {
        // Try to load from root .env.local if not present (simple hack for monorepo-ish structure)
        // or just warn the user.
        console.warn('E2B_API_KEY not found in env. Make sure .env exists or E2B_API_KEY is exported.');
    }

    const templateID = await Template.build(template, {
        alias: 'expo-template-v3',
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
