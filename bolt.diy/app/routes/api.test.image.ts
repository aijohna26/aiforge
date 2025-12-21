import { json, type ActionFunctionArgs } from "@remix-run/node";
import { imageService, type ImageGenerationOptions } from "~/lib/generate-image";
import { walletManager } from "~/lib/wallet";
import { calculateImageGenerationCost, type ImageModel } from "~/lib/pricing";
import { createClient } from "~/lib/supabase/server";

// Test endpoint for image generation with full configuration options
// POST /api/test/image
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    const headers = new Headers();

    try {
        const body = await request.json();
        const { prompt, provider, openaiModel, googleModel, qwenModel, seedreamModel, outputFormat, aspectRatio, referenceImages } = body;

        if (!prompt || typeof prompt !== "string") {
            return json(
                { error: "Please provide a 'prompt'" },
                { status: 400, headers }
            );
        }

        // Get user ID from session
        const supabase = createClient(request, headers);
        const { data: { user } } = await supabase.auth.getUser();

        // TEMPORARY: Authentication disabled for development
        // TODO: Re-enable authentication before production
        // if (!user) {
        //     return json(
        //         { error: "Authentication required" },
        //         { status: 401, headers }
        //     );
        // }

        // Use test user ID when not authenticated (development only)
        const userId = user?.id || 'dev-test-user';

        // Calculate cost based on model
        let model: ImageModel = 'nano-banana';
        if (provider === 'openai' && openaiModel) {
            model = openaiModel as ImageModel;
        } else if (provider === 'gpt-image-1') {
            model = 'gpt-image-1';
        } else if (provider === 'qwen-image-edit' || qwenModel) {
            model = 'qwen-image-edit';
        } else if (provider === 'seedream-4.5-edit' || seedreamModel) {
            model = 'seedream-4.5-edit';
        } else if (googleModel) {
            model = googleModel as ImageModel;
        }

        const cost = calculateImageGenerationCost(model);

        console.log(`[Image Test] Generating image with options:`, {
            prompt,
            provider,
            openaiModel,
            googleModel,
            qwenModel,
            seedreamModel,
            outputFormat,
            aspectRatio,
            referenceImagesCount: referenceImages?.length || 0,
            cost,
        });

        // TEMPORARY: Skip credit check for development when using test user
        const isDevelopmentMode = userId === 'dev-test-user';

        if (!isDevelopmentMode) {
            console.log(`[Image Test] User ID: ${userId}, checking credits for cost: ${cost}`);
            // Check and reserve credits for authenticated users
            const hasCredits = await walletManager.reserve(userId, cost);
            console.log(`[Image Test] hasCredits: ${hasCredits}`);
            if (!hasCredits) {
                const balance = await walletManager.getBalance(userId);
                console.log(`[Image Test] Insufficient credits. Balance: ${balance}`);
                return json(
                    {
                        error: `Insufficient credits. Required: ${cost}, Available: ${balance}`,
                        requiredCredits: cost,
                        availableCredits: balance,
                    },
                    { status: 402, headers } // Payment Required
                );
            }
        }

        // Helper to migrate base64 to Supabase
        const migrateImage = async (url: string) => {
            if (!url.startsWith('data:')) return url;

            try {
                const [header, base64Data] = url.split(',');
                const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
                const extension = mimeType.split('/')[1] || 'png';

                // Convert base64 to buffer
                const buffer = Buffer.from(base64Data, 'base64');
                const fileName = `migrated/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

                console.log(`[Image Test] Migrating base64 image to Supabase: ${fileName} (${buffer.length} bytes)`);

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

                const { data, error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(fileName, buffer, {
                        contentType: mimeType,
                        upsert: true
                    });

                clearTimeout(timeout);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                return publicUrl;
            } catch (e) {
                console.error('[Image Test] Migration failed:', e);
                return url; // Fallback to original
            }
        };

        try {
            console.log(`[Image Test] Starting reference image migration...`);
            // Migrate all reference images if they are base64
            const migratedReferenceImages = referenceImages && Array.isArray(referenceImages)
                ? await Promise.all(referenceImages.map(img => migrateImage(img)))
                : referenceImages;
            console.log(`[Image Test] Reference image migration complete. Count: ${migratedReferenceImages?.length || 0}`);

            const options: ImageGenerationOptions = {
                prompt,
                provider,
                openaiModel,
                googleModel,
                qwenModel,
                seedreamModel,
                outputFormat,
                aspectRatio,
                referenceImages: migratedReferenceImages,
            };

            // Generate image
            console.log(`[Image Test] Calling imageService.generateImage...`);
            const result = await imageService.generateImage(options);
            console.log(`[Image Test] imageService.generateImage completed successfully`);

            // Settle the reserved credits (deduct the actual cost) - only for authenticated users
            if (!isDevelopmentMode) {
                await walletManager.settle(userId, cost, cost);
            }

            console.log(`[Image Test] Image generated successfully${isDevelopmentMode ? ' (dev mode - no credits charged)' : `, ${cost} credits deducted`}`);

            return json({
                success: true,
                prompt,
                imageUrl: result.url,
                provider: result.provider,
                revisedPrompt: result.revisedPrompt,
                options: {
                    openaiModel,
                    googleModel,
                    qwenModel,
                    seedreamModel,
                    outputFormat,
                    aspectRatio,
                },
                creditsUsed: cost,
                message: `Image generated successfully! ${cost} credits used.`,
            }, { headers });
        } catch (error) {
            // Refund reserved credits on error - only for authenticated users
            if (!isDevelopmentMode) {
                await walletManager.refund(userId, cost);
            }
            throw error;
        }
    } catch (error) {
        console.error("[Image Test] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Image generation failed";

        return json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500, headers }
        );
    }
}
