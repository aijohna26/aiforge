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

        if (!user) {
            return json(
                { error: "Authentication required" },
                { status: 401, headers }
            );
        }

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

        // Check and reserve credits
        const hasCredits = await walletManager.reserve(user.id, cost);
        if (!hasCredits) {
            const balance = await walletManager.getBalance(user.id);
            return json(
                {
                    error: `Insufficient credits. Required: ${cost}, Available: ${balance}`,
                    requiredCredits: cost,
                    availableCredits: balance,
                },
                { status: 402, headers } // Payment Required
            );
        }

        try {
            const options: ImageGenerationOptions = {
                prompt,
                provider,
                openaiModel,
                googleModel,
                qwenModel,
                seedreamModel,
                outputFormat,
                aspectRatio,
                referenceImages,
            };

            // Generate image
            const result = await imageService.generateImage(options);

            // Settle the reserved credits (deduct the actual cost)
            await walletManager.settle(user.id, cost, cost);

            console.log(`[Image Test] Image generated successfully, ${cost} credits deducted`);

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
            // Refund reserved credits on error
            await walletManager.refund(user.id, cost);
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
