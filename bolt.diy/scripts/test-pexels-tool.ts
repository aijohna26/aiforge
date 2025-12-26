import { StudioAgent } from '../app/lib/modules/studio/StudioAgent';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testPexelsTool() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
        console.error('❌ ERROR: Missing GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_AI_API_KEY in .env.local');
        process.exit(1);
    }

    if (!process.env.PEXELS_API_KEY) {
        console.error('❌ ERROR: Missing PEXELS_API_KEY in .env.local');
        process.exit(1);
    }

    const agent = new StudioAgent(apiKey);

    const branding = {
        appName: 'Coffee Haven',
        primaryColor: '#6F4E37',
        backgroundColor: '#FFFFFF',
        textColor: '#3C2A21',
        description: 'A cozy coffee shop app',
        targetAudience: 'Coffee lovers'
    };

    const screen = {
        id: 'home',
        name: 'Home Screen',
        type: 'Home',
        purpose: 'Showcase coffee and daily specials',
        keyElements: ['Hero image of coffee', 'Featured products', 'Quick order button']
    };

    console.log('Testing StudioAgent with Pexels tool...');
    try {
        const result = await agent.generateScreen(branding, screen);
        console.log('Generation complete!');
        console.log('Title:', result.title);

        const containsPexels = result.html.includes('images.pexels.com');
        if (containsPexels) {
            console.log('✅ SUCCESS: Found Pexels image in generated HTML!');
            const matches = result.html.match(/https:\/\/images\.pexels\.com\/[^\s"']+/g);
            console.log('Images found:', matches);
        } else {
            console.log('❌ FAILURE: No Pexels images found in the output.');
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testPexelsTool();
