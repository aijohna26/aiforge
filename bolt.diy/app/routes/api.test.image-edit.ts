import { json, type ActionFunctionArgs } from "@remix-run/node";
import { imageService, type ImageGenerationOptions } from "~/lib/generate-image";
import { walletManager } from "~/lib/wallet";
import { calculateImageGenerationCost, type ImageModel } from "~/lib/pricing";
import { createClient } from "~/lib/supabase/server";

// Test endpoint for image editing with full configuration options
// POST /api/test/image-edit
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    const headers = new Headers();

    try {
        const body = await request.json();
        const { imageUrl, prompt, provider, qwenModel, seedreamModel, outputFormat, aspectRatio } = body;

        if (!prompt || typeof prompt !== "string") {
            return json(
                { error: "Please provide a 'prompt' describing the edits" },
                { status: 400, headers }
            );
        }

        if (!imageUrl || typeof imageUrl !== "string") {
            return json(
                { error: "Please provide an 'imageUrl' to edit" },
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
        let model: ImageModel = 'qwen-image-edit';
        if (provider === 'seedream-4.5-edit' || seedreamModel) {
            model = 'seedream-4.5-edit';
        } else if (qwenModel) {
            model = 'qwen-image-edit';
        }

        const cost = calculateImageGenerationCost(model);

        console.log(`[Image Edit] Editing image with options:`, {
            imageUrl,
            prompt,
            provider: provider || 'qwen-image-edit',
            qwenModel,
            seedreamModel,
            outputFormat,
            aspectRatio,
            cost,
        });

        // TEMPORARY: Skip credit check for development when using test user
        const isDevelopmentMode = userId === 'dev-test-user';

        if (!isDevelopmentMode) {
            // Check and reserve credits for authenticated users
            const hasCredits = await walletManager.reserve(userId, cost);
            if (!hasCredits) {
                const balance = await walletManager.getBalance(userId);
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

        try {
            const options: ImageGenerationOptions = {
                prompt,
                provider: provider || 'qwen-image-edit',
                qwenModel,
                seedreamModel,
                outputFormat,
                aspectRatio,
                referenceImages: [imageUrl], // Pass the image to edit as a reference image
            };

            // Generate edited image
            const result = await imageService.generateImage(options);

            // Settle the reserved credits (deduct the actual cost) - only for authenticated users
            if (!isDevelopmentMode) {
                await walletManager.settle(userId, cost, cost);
            }

            console.log(`[Image Edit] Image edited successfully${isDevelopmentMode ? ' (dev mode - no credits charged)' : `, ${cost} credits deducted`}`);

            return json({
                success: true,
                prompt,
                imageUrl: result.url,
                provider: result.provider,
                revisedPrompt: result.revisedPrompt,
                options: {
                    qwenModel,
                    seedreamModel,
                    outputFormat,
                    aspectRatio,
                },
                creditsUsed: cost,
                message: `Image edited successfully! ${cost} credits used.`,
            }, { headers });
        } catch (error) {
            // Refund reserved credits on error - only for authenticated users
            if (!isDevelopmentMode) {
                await walletManager.refund(userId, cost);
            }
            throw error;
        }
    } catch (error) {
        console.error("[Image Edit] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Image editing failed";

        return json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500, headers }
        );
    }
}
