/**
 * Custom Prompt API for Studio Chatbox
 *
 * Route: POST /api/studio/custom-prompt
 *
 * Allows users to generate screens from natural language prompts via the chatbox.
 * This endpoint interprets the user's request and generates appropriate screens.
 */

import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { StudioAgent } from "~/lib/modules/studio/StudioAgent";
import { getApiKeysFromCookie } from "~/lib/api/cookies";

export async function action({ request, context }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { prompt, branding, userId } = await request.json();

        console.log('[Studio Custom Prompt] Request:', {
            prompt: prompt?.substring(0, 100),
            appName: branding?.appName
        });

        if (!prompt || !prompt.trim()) {
            return json({ error: "Prompt is required" }, { status: 400 });
        }

        if (!branding || !branding.appName) {
            return json({ error: "Branding information is required" }, { status: 400 });
        }

        // Get API Key from cookies or environment
        const cookieHeader = request.headers.get("Cookie");
        const apiKeys = getApiKeysFromCookie(cookieHeader);

        const googleApiKey =
            apiKeys?.GOOGLE_GENERATIVE_AI_API_KEY ||
            (context.cloudflare?.env as any)?.GOOGLE_GENERATIVE_AI_API_KEY ||
            process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        if (!googleApiKey) {
            console.error('[Studio Custom Prompt] No API key found');
            return json({ error: "Missing Google API Key in project settings." }, { status: 401 });
        }

        const agent = new StudioAgent(googleApiKey);

        // Parse the user's prompt to understand what they want
        const screenRequest = parseUserPrompt(prompt);

        console.log('[Studio Custom Prompt] Interpreted as:', screenRequest);

        // Generate the screen
        const generatedScreen = await agent.generateScreen(
            { ...branding, userId },
            screenRequest
        );

        console.log('[Studio Custom Prompt] Generation complete:', generatedScreen.title);

        return json({
            success: true,
            screen: generatedScreen,
            interpretedAs: {
                type: screenRequest.type,
                name: screenRequest.name,
            }
        });

    } catch (error: any) {
        console.error("[Studio Custom Prompt] Error:", error);
        return json({
            error: error.message || "Failed to generate screen from prompt.",
            details: error.stack
        }, { status: 500 });
    }
}

/**
 * Parses a natural language prompt into a StudioScreenRequest
 * This is a simple implementation - could be enhanced with LLM-based parsing
 */
function parseUserPrompt(prompt: string): {
    id: string;
    name: string;
    type: string;
    purpose: string;
    keyElements: string[];
    showLogo?: boolean;
    showBottomNav?: boolean;
} {
    const lowerPrompt = prompt.toLowerCase();

    // Detect screen type from keywords
    let type = 'screen';
    let name = 'Custom Screen';
    let keyElements: string[] = [];
    let showLogo = true;
    let showBottomNav = false;

    // Screen type detection
    if (lowerPrompt.includes('splash') || lowerPrompt.includes('welcome')) {
        type = 'splash';
        name = 'Splash Screen';
        keyElements = ['App logo', 'Hero imagery', 'Welcome message', 'Get Started button'];
    } else if (lowerPrompt.includes('login') || lowerPrompt.includes('sign in')) {
        type = 'auth';
        name = 'Login Screen';
        keyElements = ['Email input', 'Password input', 'Login button', 'Forgot password link', 'Sign up link'];
        showBottomNav = false;
    } else if (lowerPrompt.includes('sign up') || lowerPrompt.includes('register')) {
        type = 'auth';
        name = 'Sign Up Screen';
        keyElements = ['Name input', 'Email input', 'Password input', 'Sign up button', 'Terms checkbox'];
        showBottomNav = false;
    } else if (lowerPrompt.includes('onboarding') || lowerPrompt.includes('tutorial')) {
        type = 'onboarding';
        name = 'Onboarding Screen';
        keyElements = ['Illustration', 'Title', 'Description', 'Skip button', 'Next/Continue button', 'Progress dots'];
        showBottomNav = false;
    } else if (lowerPrompt.includes('home') || lowerPrompt.includes('dashboard')) {
        type = 'home';
        name = 'Home Screen';
        keyElements = ['Header with greeting', 'Search bar', 'Category cards', 'Featured content', 'Bottom navigation'];
        showBottomNav = true;
    } else if (lowerPrompt.includes('profile') || lowerPrompt.includes('account')) {
        type = 'profile';
        name = 'Profile Screen';
        keyElements = ['Profile photo', 'User name', 'Stats/metrics', 'Settings button', 'Action buttons'];
        showBottomNav = true;
    } else if (lowerPrompt.includes('settings')) {
        type = 'settings';
        name = 'Settings Screen';
        keyElements = ['Profile section', 'Settings categories', 'Toggle switches', 'Navigation items', 'Logout button'];
        showBottomNav = true;
    } else if (lowerPrompt.includes('empty') || lowerPrompt.includes('no data') || lowerPrompt.includes('no items')) {
        type = 'empty-state';
        name = 'Empty State Screen';
        keyElements = ['Friendly illustration', 'Empty state message', 'Call-to-action button'];
        showBottomNav = true;
    } else if (lowerPrompt.includes('list') || lowerPrompt.includes('feed')) {
        type = 'list';
        name = 'List Screen';
        keyElements = ['Search/filter bar', 'List items with images', 'Item metadata', 'Action buttons'];
        showBottomNav = true;
    } else if (lowerPrompt.includes('detail') || lowerPrompt.includes('view')) {
        type = 'detail';
        name = 'Detail Screen';
        keyElements = ['Hero image', 'Title and description', 'Metadata', 'Action buttons', 'Related content'];
    }

    // Extract specific elements mentioned
    if (lowerPrompt.includes('button')) keyElements.push('Button');
    if (lowerPrompt.includes('image') || lowerPrompt.includes('photo')) keyElements.push('Image');
    if (lowerPrompt.includes('search')) keyElements.push('Search bar');
    if (lowerPrompt.includes('form') || lowerPrompt.includes('input')) keyElements.push('Form inputs');
    if (lowerPrompt.includes('card')) keyElements.push('Card components');
    if (lowerPrompt.includes('hero')) keyElements.push('Hero section');

    // Check for explicit logo/nav mentions
    if (lowerPrompt.includes('no logo') || lowerPrompt.includes('hide logo')) {
        showLogo = false;
    }
    if (lowerPrompt.includes('bottom nav') || lowerPrompt.includes('navigation bar')) {
        showBottomNav = true;
    }

    return {
        id: `custom-${Date.now()}`,
        name,
        type,
        purpose: prompt, // Use the full prompt as purpose
        keyElements: keyElements.length > 0 ? keyElements : ['Content area', 'Call-to-action'],
        showLogo,
        showBottomNav,
    };
}
