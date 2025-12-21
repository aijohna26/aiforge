// Image Generation Service
// Supports multiple providers: OpenAI, Kie.ai, Gemini, Recraft V3, and others

export type ImageProvider = 'openai' | 'gpt-image-1' | 'kie' | 'gemini' | 'recraft' | 'replicate' | 'qwen-image-edit' | 'seedream-4.5-edit';
export type OpenAIModel = 'gpt-image-1' | 'dall-e-2' | 'dall-e-3';
export type GoogleModel = 'nano-banana' | 'nano-banana-pro' | 'nano-banana-edit';
export type QwenModel = 'qwen/image-edit';
export type SeedreamModel = 'seedream/4.5-edit';
export type OutputFormat = 'png' | 'jpeg';
export type AspectRatio = '1:1' | '9:16' | '16:9' | '3:4' | '4:3' | '3:2' | '2:3' | '512';

export interface ImageGenerationOptions {
    prompt: string;
    name?: string;
    provider?: ImageProvider;

    // Model selection
    openaiModel?: OpenAIModel;
    googleModel?: GoogleModel;
    qwenModel?: QwenModel;
    seedreamModel?: SeedreamModel;

    // Output options
    outputFormat?: OutputFormat;
    aspectRatio?: AspectRatio;
    referenceImages?: string[]; // Reference images for design consistency (Clip Tray)

    // Legacy size option (for backward compatibility)
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
}

export interface ImageGenerationResult {
    url: string;
    provider: ImageProvider;
    revisedPrompt?: string;
}

class ImageGenerationService {
    private defaultProvider: ImageProvider;

    constructor() {
        // Get provider from env or default to Gemini 3 (via Kie.ai)
        this.defaultProvider = (process.env.IMAGE_GENERATION_PROVIDER as ImageProvider) || 'gemini';
    }

    async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
        const provider = options.provider || this.defaultProvider;

        // Special routing for GPT-Image-1 (Kie.ai 4o)
        // If provider is 'gpt-image-1' OR if provider is 'openai' but model is 'gpt-image-1'
        if (provider === 'gpt-image-1' || (provider === 'openai' && options.openaiModel === 'gpt-image-1')) {
            return this.generateWithKie4o(options);
        }

        switch (provider) {
            case 'openai':
                return this.generateWithKie(options);
            // return this.generateWithOpenAI(options, 'dall-e-3');

            case 'kie':
                return this.generateWithKie(options);

            case 'gemini':
                // Use Kie.ai for Gemini (Google models via Kie.ai)
                return this.generateWithKie(options);

            case 'qwen-image-edit':
                // Use Kie.ai for Qwen models
                return this.generateWithQwen(options);

            case 'seedream-4.5-edit':
                // Use Kie.ai for Seedream models
                return this.generateWithSeedream(options);

            case 'recraft':
                return this.generateWithRecraft(options);

            case 'replicate':
                return this.generateWithReplicate(options);

            default:
                throw new Error(`Unsupported image provider: ${provider}`);
        }
    }

    private async generateWithKie4o(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
        const apiKey = process.env.KIE_API_KEY;

        if (!apiKey) {
            throw new Error('KIE_API_KEY environment variable is required');
        }

        // Map aspect ratio to supported sizes: 1:1, 3:2, 2:3
        let size = '1:1';
        if (options.aspectRatio) {
            switch (options.aspectRatio) {
                case '16:9':
                case '4:3':
                case '3:2':
                    size = '3:2';
                    break;
                case '9:16':
                case '3:4':
                case '2:3':
                    size = '2:3';
                    break;
                default:
                    size = '1:1';
            }
        }

        // Enhance prompt for UI/screen generation
        const enhancedPrompt = this.enhancePromptForUI(options.prompt);

        // Step 1: Create task
        const createResponse = await fetch('https://api.kie.ai/api/v1/gpt4o-image/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                prompt: enhancedPrompt,
                size: size,
                nVariants: 1,
                isEnhance: true, // Enable enhancement for better quality
                enableFallback: true // Enable fallback for reliability
            }),
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            const statusCode = createResponse.status;
            let errorMessage = createResponse.statusText;
            try {
                const error = JSON.parse(errorText);
                errorMessage = error.msg || error.message || errorText;
            } catch (e) {
                errorMessage = errorText;
            }

            // Provide helpful error messages based on status code
            if (statusCode === 500) {
                throw new Error(`Image generation service error (500): ${errorMessage}. This usually means the service is temporarily overloaded. Please wait a moment and try again. If the issue persists, try simplifying your prompt or using a different model.`);
            } else if (statusCode === 429) {
                throw new Error(`Rate limit exceeded (429): ${errorMessage}. Please wait a few moments before trying again.`);
            } else if (statusCode === 400) {
                throw new Error(`Invalid request (400): ${errorMessage}. Please check your prompt and try again.`);
            } else {
                throw new Error(`Image generation task creation failed (${statusCode}): ${errorMessage}`);
            }
        }

        const createData = await createResponse.json();

        if (createData.code !== 200) {
            const errorMsg = createData.msg || createData.message || 'Unknown error';
            throw new Error(`Image generation task creation failed: ${errorMsg}. Please try again or use a different model.`);
        }

        const taskId = createData.data?.taskId;
        if (!taskId) {
            throw new Error('Image generation service did not return a task ID');
        }

        // Step 2: Poll for task completion
        const maxAttempts = 72; // 6 minutes (5s interval) - balanced timeout for complex requests
        const pollInterval = 5000; // 5 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            const queryResponse = await fetch(
                `https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=${taskId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                    },
                }
            );

            if (!queryResponse.ok) {
                console.error('[Kie.ai 4o] Query failed:', queryResponse.statusText);
                continue;
            }

            const queryData = await queryResponse.json();

            if (queryData.code !== 200) {
                console.error('[Kie.ai 4o] Query returned error code:', queryData.msg);
                continue;
            }

            const status = queryData.data?.successFlag; // 0: Generating, 1: Success, 2: Failed

            // Success
            if (status === 1) {
                let resultUrls = queryData.data?.response?.result_urls || queryData.data?.response?.resultUrls;

                // Fallback: Check resultJson if response.result_urls is missing
                if ((!resultUrls || resultUrls.length === 0) && queryData.data?.resultJson) {
                    try {
                        const resultObj = JSON.parse(queryData.data.resultJson);
                        if (resultObj.result_urls && resultObj.result_urls.length > 0) {
                            resultUrls = resultObj.result_urls;
                        } else if (resultObj.resultUrls && resultObj.resultUrls.length > 0) {
                            resultUrls = resultObj.resultUrls;
                        }
                    } catch (e) {
                        console.error('[Kie.ai 4o] Failed to parse resultJson:', e);
                    }
                }

                if (resultUrls && resultUrls.length > 0) {
                    return {
                        url: resultUrls[0],
                        provider: 'gpt-image-1', // Identify as GPT-Image-1
                    };
                }

                console.error('[Kie.ai 4o] No image URLs found in response:', JSON.stringify(queryData, null, 2));
                throw new Error('Image generation completed but returned no image URLs');
            }

            // Failed
            if (status === 2) {
                throw new Error(`Image generation failed: ${queryData.data?.errorMessage || 'Unknown error'}`);
            }

            // Still generating (status === 0), continue polling
        }

        throw new Error(`Image generation timed out after ${(maxAttempts * pollInterval) / 1000} seconds. The task may still be processing. Please try again in a few moments, or try a simpler prompt.`);
    }

    private async generateWithOpenAI(
        options: ImageGenerationOptions,
        model: 'dall-e-3' | 'gpt-image-1' | 'dall-e-2' = 'dall-e-3'
    ): Promise<ImageGenerationResult> {
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }

        // Use specified model or default
        const selectedModel = options.openaiModel || model;

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: selectedModel,
                prompt: options.prompt,
                n: 1,
                size: options.size || '1024x1024',
                ...(selectedModel === 'dall-e-3' && {
                    quality: options.quality || 'standard',
                    style: options.style || 'vivid',
                }),
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI image generation failed: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();

        return {
            url: data.data[0].url,
            provider: selectedModel === 'gpt-image-1' ? 'gpt-image-1' : 'openai',
            revisedPrompt: data.data[0].revised_prompt,
        };
    }

    private async generateWithKie(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
        console.log(`[Image Service] Entering generateWithKie...`);
        const apiKey = process.env.KIE_API_KEY;

        if (!apiKey) {
            throw new Error('KIE_API_KEY environment variable is required');
        }

        // Default to nano-banana for Gemini 3
        const model = options.googleModel || 'nano-banana';
        const outputFormat = options.outputFormat || 'png';
        const aspectRatio = options.aspectRatio || '1:1';

        // Enhance prompt for UI/screen generation
        // Skip enhancement for edit model to allow specific instructions
        const enhancedPrompt = model === 'nano-banana-edit' ? options.prompt : this.enhancePromptForUI(options.prompt);

        // Validate reference images usage
        if (model === 'nano-banana-edit') {
            // Edit model REQUIRES reference images
            if (!options.referenceImages || options.referenceImages.length === 0) {
                throw new Error('nano-banana-edit requires at least one reference image for editing. Please provide a reference image or use nano-banana for generation from text only.');
            }
        } else if (options.referenceImages && options.referenceImages.length > 0) {
            // Other models: validate reference image support
            if (model === 'nano-banana') {
                console.warn('[Image Service] Reference images are not supported by nano-banana. Proceeding without references.');
                options.referenceImages = [];
            }
        }

        // Format model name - nano-banana-pro doesn't need google/ prefix
        const modelName = model === 'nano-banana-pro' ? model : `google/${model}`;

        const requestBody = {
            model: modelName,
            input: {
                prompt: enhancedPrompt,
                output_format: outputFormat,
                image_size: aspectRatio,
                // Use image_urls for edit, image_input for pro/others
                // API expects direct HTTP/HTTPS URLs (not base64 or data URLs)
                ...(options.referenceImages && options.referenceImages.length > 0 && {
                    [model === 'nano-banana-edit' ? 'image_urls' : 'image_input']: model === 'nano-banana-edit'
                        ? [options.referenceImages[0]] // Edit model typically wants exactly one source image
                        : options.referenceImages
                }),
            }
        };

        console.log(`[Image Service] Creating task for model: ${modelName} with ${options.referenceImages?.length || 0} reference images`);
        if (options.referenceImages && options.referenceImages.length > 0) {
            options.referenceImages.forEach((img, idx) => {
                if (img.startsWith('data:')) {
                    console.warn(`[Image Service] Reference image ${idx} is a DATA URL (base64). This will likely fail with Kie.ai!`);
                } else if (img.startsWith('blob:')) {
                    console.warn(`[Image Service] Reference image ${idx} is a BLOB URL. This will likely fail with Kie.ai!`);
                } else {
                    console.log(`[Image Service] Reference image ${idx}: ${img.substring(0, 100)}...`);
                }
            });
        }
        console.log('[Image Service] Request body:', JSON.stringify(requestBody, null, 2));

        console.log('[Image Service] Sending request to Kie.ai createTask...');
        // Step 1: Create task
        const createResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });
        console.log('[Image Service] createTask response received');

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            const statusCode = createResponse.status;
            console.error('[Kie.ai] Create task error:', errorText);
            let errorMessage = createResponse.statusText;
            try {
                const error = JSON.parse(errorText);
                errorMessage = error.message || error.error || errorText;
            } catch (e) {
                errorMessage = errorText;
            }

            // Provide helpful error messages based on status code
            if (statusCode === 500) {
                // Check if error is about missing image_urls
                if (errorMessage.includes('image_urls is required') || errorMessage.includes('image_urls')) {
                    throw new Error(`Image generation error: The selected model requires reference images. If you're trying to edit an image, please provide a reference image. If you're generating from text only, use 'nano-banana' model instead of 'nano-banana-edit'.`);
                }
                throw new Error(`Image generation service error (500): ${errorMessage}. The service is temporarily overloaded. Please wait a moment and try again. For complex requests with icons and text, try using GPT-Image-1 model instead.`);
            } else if (statusCode === 429) {
                throw new Error(`Rate limit exceeded (429): ${errorMessage}. Please wait a few moments before trying again.`);
            } else if (statusCode === 400) {
                throw new Error(`Invalid request (400): ${errorMessage}. Please check your prompt and reference images.`);
            } else {
                throw new Error(`Image generation task creation failed (${statusCode}): ${errorMessage}`);
            }
        }

        const createData = await createResponse.json();
        console.log('[Image Service] Create response:', JSON.stringify(createData, null, 2));

        if (createData.code !== 200) {
            const message = createData.msg || createData.message || 'Unknown provider error';
            throw new Error(`Image Service Error: ${message}. Please try again or use a different model.`);
        }

        const taskId = createData.data?.taskId;
        if (!taskId) {
            throw new Error('Image generation service did not return a task ID');
        }

        // Step 2: Poll for task completion
        // nano-banana-pro takes longer, so increase timeout
        const maxAttempts = model === 'nano-banana-pro' ? 30 : 20; // 5 minutes for pro, 3.3 minutes for others
        const pollInterval = 10000; // 10 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            const queryResponse = await fetch(
                `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                    },
                }
            );

            if (!queryResponse.ok) {
                console.error('[Kie.ai] Query failed:', queryResponse.statusText);
                continue;
            }

            const queryData = await queryResponse.json();
            console.log(`[Kie.ai] Poll attempt ${attempt + 1}:`, JSON.stringify(queryData, null, 2));

            // Check if task is complete
            // Note: API returns 'state' or 'status' depending on endpoint version, checking both
            const status = queryData.data?.state || queryData.data?.status;

            if (status === 'success' || status === 'completed') {
                let imageUrl = queryData.data?.output?.image_url ||
                    queryData.data?.output?.[0] ||
                    queryData.data?.image_url;

                // Handle resultJson string format (seen in production)
                if (!imageUrl && queryData.data?.resultJson) {
                    try {
                        const resultObj = JSON.parse(queryData.data.resultJson);
                        if (resultObj.resultUrls && resultObj.resultUrls.length > 0) {
                            imageUrl = resultObj.resultUrls[0];
                        }
                    } catch (e) {
                        console.error('[Kie.ai] Failed to parse resultJson:', e);
                    }
                }

                if (imageUrl) {
                    return {
                        url: imageUrl,
                        provider: 'kie',
                    };
                }
            }

            // Check for failure
            if (status === 'failed' || status === 'error') {
                throw new Error(`Image generation failed: ${queryData.data?.error || 'Unknown error'}`);
            }
        }

        throw new Error(`Image generation timed out after ${(maxAttempts * pollInterval) / 1000} seconds using model ${model}. The task may still be processing. Please try again in a few moments, or try a simpler prompt. For complex requests with icons and text, consider using GPT-Image-1 model which handles text better.`);
    }

    private async generateWithQwen(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
        const apiKey = process.env.KIE_API_KEY;

        if (!apiKey) {
            throw new Error('KIE_API_KEY environment variable is required');
        }

        const model = options.qwenModel || 'qwen/image-edit';
        const outputFormat = options.outputFormat || 'png';
        const aspectRatio = options.aspectRatio || '1:1';

        // Qwen image-edit requires reference images
        if (!options.referenceImages || options.referenceImages.length === 0) {
            throw new Error('qwen/image-edit requires at least one reference image');
        }

        // Map our aspect ratio format to Qwen's expected format
        const qwenImageSizeMap: Record<string, string> = {
            '1:1': 'square',
            '9:16': 'portrait_16_9',
            '16:9': 'landscape_16_9',
            '3:4': 'portrait_4_3',
            '4:3': 'landscape_4_3',
        };

        const qwenImageSize = qwenImageSizeMap[aspectRatio] || 'landscape_4_3';

        const requestBody = {
            model: model,
            input: {
                prompt: options.prompt,
                output_format: outputFormat,
                image_size: qwenImageSize,
                image_url: options.referenceImages[0] // Qwen uses singular image_url (first image only)
            }
        };

        console.log('[Qwen] Request:', JSON.stringify(requestBody, null, 2));

        // Step 1: Create task
        const createResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('[Qwen] Create task error:', errorText);
            let errorMessage = createResponse.statusText;
            try {
                const error = JSON.parse(errorText);
                errorMessage = error.message || error.error || errorText;
            } catch (e) {
                errorMessage = errorText;
            }
            throw new Error(`Qwen task creation failed: ${errorMessage}`);
        }

        const createData = await createResponse.json();
        console.log('[Qwen] Create response:', JSON.stringify(createData, null, 2));

        const taskId = createData.data?.taskId;
        if (!taskId) {
            throw new Error('Qwen API did not return a taskId');
        }

        // Step 2: Poll for task completion
        const maxAttempts = 10; // 100 seconds
        const pollInterval = 10000; // 10 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            const queryResponse = await fetch(
                `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                    },
                }
            );

            if (!queryResponse.ok) {
                console.error('[Qwen] Query failed:', queryResponse.statusText);
                continue;
            }

            const queryData = await queryResponse.json();
            console.log(`[Qwen] Poll attempt ${attempt + 1}:`, JSON.stringify(queryData, null, 2));

            const status = queryData.data?.state || queryData.data?.status;

            if (status === 'success' || status === 'completed') {
                let imageUrl = queryData.data?.output?.image_url ||
                    queryData.data?.output?.[0] ||
                    queryData.data?.image_url;

                // Handle resultJson string format
                if (!imageUrl && queryData.data?.resultJson) {
                    try {
                        const resultObj = JSON.parse(queryData.data.resultJson);
                        if (resultObj.resultUrls && resultObj.resultUrls.length > 0) {
                            imageUrl = resultObj.resultUrls[0];
                        }
                    } catch (e) {
                        console.error('[Qwen] Failed to parse resultJson:', e);
                    }
                }

                if (imageUrl) {
                    return {
                        url: imageUrl,
                        provider: 'qwen-image-edit',
                    };
                }
            }

            // Check for failure
            if (status === 'failed' || status === 'error') {
                throw new Error(`Qwen task failed: ${queryData.data?.error || 'Unknown error'}`);
            }
        }

        throw new Error('Qwen task timed out after 100 seconds');
    }

    private async generateWithSeedream(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
        const apiKey = process.env.KIE_API_KEY;

        if (!apiKey) {
            throw new Error('KIE_API_KEY environment variable is required');
        }

        const model = options.seedreamModel || 'seedream/4.5-edit';
        const outputFormat = options.outputFormat || 'png';
        const aspectRatio = options.aspectRatio || '1:1';

        // Seedream 4.5 Edit requires reference images
        if (!options.referenceImages || options.referenceImages.length === 0) {
            throw new Error('Seedream 4.5 Edit requires at least one reference image');
        }

        // Seedream uses aspect ratio format directly (1:1, 4:3, 3:4, 16:9, 9:16, 2:3, 3:2, 21:9)
        // No mapping needed - just pass the aspect ratio as-is
        const requestBody = {
            model: model,
            input: {
                prompt: options.prompt,
                output_format: outputFormat,
                aspect_ratio: aspectRatio, // Seedream uses 'aspect_ratio' not 'image_size'
                image_urls: options.referenceImages, // Seedream can use multiple images
                quality: 'basic' // 'basic' for 2K, 'high' for 4K
            }
        };

        console.log('[Seedream] Request:', JSON.stringify(requestBody, null, 2));

        // Step 1: Create task
        const createResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('[Seedream] Create task error:', errorText);
            let errorMessage = createResponse.statusText;
            try {
                const error = JSON.parse(errorText);
                errorMessage = error.message || error.error || errorText;
            } catch (e) {
                errorMessage = errorText;
            }
            throw new Error(`Seedream task creation failed: ${errorMessage}`);
        }

        const createData = await createResponse.json();
        console.log('[Seedream] Create response:', JSON.stringify(createData, null, 2));

        const taskId = createData.data?.taskId;
        if (!taskId) {
            throw new Error('Seedream API did not return a taskId');
        }

        // Step 2: Poll for task completion
        const maxAttempts = 15; // 150 seconds (Seedream may take longer)
        const pollInterval = 10000; // 10 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            const queryResponse = await fetch(
                `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                    },
                }
            );

            if (!queryResponse.ok) {
                console.error('[Seedream] Query failed:', queryResponse.statusText);
                continue;
            }

            const queryData = await queryResponse.json();
            console.log(`[Seedream] Poll attempt ${attempt + 1}:`, JSON.stringify(queryData, null, 2));

            const status = queryData.data?.state || queryData.data?.status;

            if (status === 'success' || status === 'completed') {
                let imageUrl = queryData.data?.output?.image_url ||
                    queryData.data?.output?.[0] ||
                    queryData.data?.image_url;

                // Handle resultJson string format
                if (!imageUrl && queryData.data?.resultJson) {
                    try {
                        const resultObj = JSON.parse(queryData.data.resultJson);
                        if (resultObj.resultUrls && resultObj.resultUrls.length > 0) {
                            imageUrl = resultObj.resultUrls[0];
                        }
                    } catch (e) {
                        console.error('[Seedream] Failed to parse resultJson:', e);
                    }
                }

                if (imageUrl) {
                    return {
                        url: imageUrl,
                        provider: 'seedream-4.5-edit',
                    };
                }
            }

            // Check for failure
            if (status === 'failed' || status === 'error') {
                throw new Error(`Seedream task failed: ${queryData.data?.error || 'Unknown error'}`);
            }
        }

        throw new Error('Seedream task timed out after 150 seconds');
    }

    // Helper to enhance prompts for UI/screen generation
    private enhancePromptForUI(originalPrompt: string): string {
        // Check if prompt already mentions UI/screen/interface
        const hasUIContext = /\b(ui|interface|screen|app|mobile|wireframe|mockup|design)\b/i.test(originalPrompt);

        if (hasUIContext) {
            // Already UI-focused, add strict interface-only constraints
            return `${originalPrompt}. IMPORTANT: Show ONLY the user interface design, flat 2D screen layout, no phone mockup, no device frame, no background scenery, no 3D elements. Pure UI interface only, clean modern app screen design, professional digital interface`;
        } else {
            // Transform generic prompt into strict UI-only prompt
            return `Mobile app user interface screen for: ${originalPrompt}. IMPORTANT: Show ONLY the flat UI interface design, no phone device, no mockup frame, no background scenery, no hands holding phone, no 3D elements. Pure 2D screen interface only with modern clean design and detailed UI elements`;
        }
    }

    private async generateWithGemini(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
        const apiKey = process.env.GOOGLE_AI_API_KEY;

        if (!apiKey) {
            throw new Error('GOOGLE_AI_API_KEY environment variable is required');
        }

        // Gemini API endpoint for Imagen 3
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instances: [{
                    prompt: options.prompt,
                }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: '1:1', // 1024x1024
                    safetyFilterLevel: 'block_some',
                    personGeneration: 'allow_adult',
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Gemini image generation failed: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();

        // Gemini returns base64 encoded image
        const base64Image = data.predictions[0].bytesBase64Encoded;
        const imageUrl = `data:image/png;base64,${base64Image}`;

        return {
            url: imageUrl,
            provider: 'gemini',
        };
    }

    private async generateWithRecraft(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
        const apiKey = process.env.RECRAFT_API_KEY;

        if (!apiKey) {
            throw new Error('RECRAFT_API_KEY environment variable is required');
        }

        // Recraft V3 API endpoint
        const response = await fetch('https://external.api.recraft.ai/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                prompt: options.prompt,
                model: 'recraftv3', // Nano Banana Pro
                style: 'realistic_image',
                size: options.size || '1024x1024',
                n: 1,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Recraft V3 image generation failed: ${error.message || response.statusText}`);
        }

        const data = await response.json();

        return {
            url: data.data[0].url,
            provider: 'recraft',
        };
    }

    private async generateWithReplicate(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
        const apiKey = process.env.REPLICATE_API_KEY;

        if (!apiKey) {
            throw new Error('REPLICATE_API_KEY environment variable is required');
        }

        // Using Replicate's Flux model
        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${apiKey}`,
            },
            body: JSON.stringify({
                version: 'black-forest-labs/flux-schnell', // Fast Flux model
                input: {
                    prompt: options.prompt,
                    num_outputs: 1,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Replicate image generation failed: ${response.statusText}`);
        }

        const prediction = await response.json();

        // Poll for completion
        let result = prediction;
        while (result.status !== 'succeeded' && result.status !== 'failed') {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
                headers: {
                    'Authorization': `Token ${apiKey}`,
                },
            });

            result = await statusResponse.json();
        }

        if (result.status === 'failed') {
            throw new Error('Replicate image generation failed');
        }

        return {
            url: result.output[0],
            provider: 'replicate',
        };
    }
}

export const imageService = new ImageGenerationService();
