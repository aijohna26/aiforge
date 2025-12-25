import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { StudioAgent } from "~/lib/modules/studio/StudioAgent";
import { getApiKeysFromCookie } from "~/lib/api/cookies";
import { FEATURE_FLAGS } from "~/lib/feature-flags";
import { inngest } from "~/lib/inngest/client";
import { createJob } from "~/lib/inngest/db";

export async function action({ request, context }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const { branding, screens, includeTheme, userId } = await request.json();
        console.log('[Studio API] Request Branding:', branding.appName, branding.primaryColor);
        console.log('[Studio API] Screens to generate:', screens?.map((s: any) => s.name).join(', '));
        console.log('[Studio API] Inngest mode:', FEATURE_FLAGS.USE_INNGEST_SCREEN_GEN ? 'ENABLED' : 'DISABLED');

        // Get API Key from cookies or Cloudflare env/process.env
        const cookieHeader = request.headers.get("Cookie");
        const apiKeys = getApiKeysFromCookie(cookieHeader);

        const googleApiKey =
            apiKeys?.GOOGLE_GENERATIVE_AI_API_KEY ||
            (context.cloudflare?.env as any)?.GOOGLE_GENERATIVE_AI_API_KEY ||
            process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        console.log('[Studio API] Key source check:', {
            hasCookieKey: !!apiKeys?.GOOGLE_GENERATIVE_AI_API_KEY,
            hasEnvKey: !!(context.cloudflare?.env as any)?.GOOGLE_GENERATIVE_AI_API_KEY || !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
        });

        if (!googleApiKey) {
            console.error('[Studio API] AUTH ERROR: No API key found in any source.');
            return json({ error: "Missing Google API Key in project settings." }, { status: 401 });
        }

        // DUAL MODE: Background job (Inngest) vs Synchronous
        if (FEATURE_FLAGS.USE_INNGEST_SCREEN_GEN) {
            console.log('[Studio API] Using Inngest background processing...');

            // Create job in database
            const jobId = await createJob({
                jobType: 'screen-generation',
                userId,
                inputData: { branding, screens, includeTheme },
                provider: 'google',
                model: 'gemini-3-flash-preview',
            });

            // Send event to Inngest
            await inngest.send({
                name: 'studio/generate.screens',
                data: {
                    jobId,
                    userId,
                    branding,
                    screens,
                    includeTheme,
                },
            });

            console.log('[Studio API] Job enqueued:', jobId);

            return json({
                mode: 'async',
                jobId,
                status: 'pending',
                message: 'Screen generation started in background',
            });
        } else {
            // ORIGINAL SYNCHRONOUS MODE
            console.log('[Studio API] Using synchronous processing...');

            const agent = new StudioAgent(googleApiKey);

            // Optional theme generation
            let generatedTheme = null;
            if (includeTheme) {
                console.log('[Studio API] Generating custom theme...');
                generatedTheme = await agent.generateTheme(branding);
            }

            // Generate screens in parallel
            console.log('[Studio API] Starting parallel generation...');
            const generatedScreens = screens ? await Promise.all(
                screens.map((screen: any) => {
                    console.log(`[Studio API] Triggering gen for: ${screen.name}`);
                    return agent.generateScreen(branding, screen);
                })
            ) : [];
            console.log('[Studio API] Generation complete.');

            return json({
                mode: 'sync',
                screens: generatedScreens,
                theme: generatedTheme
            });
        }
    } catch (error: any) {
        console.error("[Studio API] CRITICAL ERROR:", error);
        return json({ error: error.message || "Failed to generate designs." }, { status: 500 });
    }
}
