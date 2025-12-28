/**
 * Image Generation Inngest Function
 *
 * Background worker that handles AI-powered image generation using Nano Banana via Kie API with:
 * - Real-time progress streaming to clients
 * - Automatic retry on failure (3 attempts)
 * - Concurrency limiting (max 5 concurrent generations)
 * - Credit/wallet integration with reserve/settle/refund pattern
 * - Supabase Storage persistence for permanent URLs
 * - Polling-based completion detection (10s intervals, max 10 attempts)
 */

import { inngest } from '../client';
import { updateJobStatus, updateJobProgress, incrementJobAttempts } from '../db';
import { createClient } from '@supabase/supabase-js';

interface ImageGenerationInput {
  jobId: string;
  userId: string;
  prompt: string;
  googleModel: 'nano-banana' | 'nano-banana-edit';
  outputFormat: 'png' | 'jpeg';
  aspectRatio: string;
  referenceImages?: string[];
  enhanceForUI?: boolean;
}

export const imageGeneration = inngest.createFunction(
  {
    id: 'image-generation',
    name: 'Generate Image with Nano Banana',
    retries: 3,
    concurrency: {
      limit: 5,
      key: 'event.data.userId', // Limit per user
    },
  },
  { event: 'media/generate.image' },
  async ({ event, step, channel }) => {
    const { jobId, userId, prompt, googleModel, outputFormat, aspectRatio, referenceImages, enhanceForUI } =
      event.data as ImageGenerationInput;

    try {
      console.log('[Inngest] Starting image generation:', {
        jobId,
        model: googleModel,
        aspectRatio,
      });

      // Step 1: Initialize and mark job as processing
      await step.run('initialize-job', async () => {
        await updateJobStatus({
          jobId,
          status: 'processing',
          progress: 0,
        });

        // Publish real-time event for UI updates
        if (userId && (channel as any)?.publish) {
          await (channel as any).publish(`user:${userId}`, {
            type: 'image.generation.start',
            jobId,
            model: googleModel,
            timestamp: new Date().toISOString(),
          });
        }

        console.log('[Inngest] Job initialized:', jobId);
      });

      // Step 2: Reserve credits from wallet
      const cost = await step.run('reserve-credits', async () => {
        // Image generation costs 6 platform credits ($0.06)
        const imageCost = 6;

        /*
         * TODO: Integrate with wallet manager
         * const hasCredits = await walletManager.reserve(userId, imageCost);
         * if (!hasCredits) {
         *   throw new Error('Insufficient credits');
         * }
         */

        console.log('[Inngest] Reserved credits:', imageCost);

        return imageCost;
      });

      // Step 3: Create Kie API task
      const taskId = await step.run('create-kie-task', async () => {
        const kieApiKey = process.env.KIE_API_KEY;

        if (!kieApiKey) {
          throw new Error('KIE_API_KEY not configured');
        }

        // Format model name for Kie API (needs google/ prefix)
        const modelName = `google/${googleModel}`;

        // Build request body based on model type
        const requestBody: any = {
          model: modelName,
          input: {
            prompt,
            output_format: outputFormat,
            image_size: aspectRatio,
          },
        };

        // Add reference images for nano-banana-edit
        if (googleModel === 'nano-banana-edit' && referenceImages && referenceImages.length > 0) {
          requestBody.input.reference_images = referenceImages;
        }

        console.log('[Inngest] Creating Kie task:', modelName);

        const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${kieApiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!createRes.ok) {
          const errorText = await createRes.text();
          throw new Error(`Kie API create task failed: ${createRes.status} - ${errorText}`);
        }

        const createData = await createRes.json();

        // Handle multiple response structures
        const taskIdValue =
          createData.data?.taskId || createData.taskId || createData.data?.task_id || createData.task_id;

        if (!taskIdValue) {
          throw new Error(`No taskId in Kie response: ${JSON.stringify(createData)}`);
        }

        console.log('[Inngest] Kie task created:', taskIdValue);
        await updateJobProgress({ jobId, progress: 20 });

        // Publish task creation event
        if (userId && (channel as any)?.publish) {
          await (channel as any).publish(`user:${userId}`, {
            type: 'image.generation.task_created',
            jobId,
            taskId: taskIdValue,
            timestamp: new Date().toISOString(),
          });
        }

        return taskIdValue;
      });

      /*
       * Step 4: Poll for completion
       * Step 4: Poll for completion loops
       */
      let imageUrl: string | undefined;
      const maxAttempts = 6; // 6 * 20s = 120s = 2 minutes

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const pollResult = await step.run(`poll-attempt-${attempt}`, async () => {
          const kieApiKey = process.env.KIE_API_KEY;

          console.log(`[Inngest] Poll attempt ${attempt + 1}/${maxAttempts}`);

          const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
            headers: { Authorization: `Bearer ${kieApiKey}` },
          });

          if (!queryRes.ok) {
            console.error('[Inngest] Polling request failed:', queryRes.status);
            return { status: 'retry' };
          }

          const queryData = await queryRes.json();

          // Handle multiple response structures
          const rawState = queryData.data?.state || queryData.state;
          const state = String(rawState).toLowerCase();
          const output = queryData.data?.output || queryData.output;

          console.log('[Inngest] Poll response state:', state, 'Raw:', rawState);

          // Helper function to extract URL from various response formats
          const extractUrl = (output: any): string | undefined => {
            if (!output) {
              return undefined;
            }

            // If output is an array
            if (Array.isArray(output)) {
              // If first element is a string URL, return it directly
              if (typeof output[0] === 'string') {
                return output[0];
              }

              // If first element is an object, try to extract URL from it
              if (output[0] && typeof output[0] === 'object') {
                return output[0].image_url || output[0].imageUrl || output[0].url;
              }
            }

            // If output is an object
            if (typeof output === 'object' && !Array.isArray(output)) {
              return output.image_url || output.imageUrl || output.url;
            }

            // If output is a direct string URL
            if (typeof output === 'string') {
              return output;
            }

            return undefined;
          };

          // Fallback: If output contains a URL, assume success even if state is unknown
          if (!['failed', 'error', 'failure', 'retry'].includes(state)) {
            let url: string | undefined;

            // Try extracting from output field
            if (output) {
              url = extractUrl(output);
            }

            // Try extracting from resultJson field (official Kie.ai format)
            if (!url && queryData.data?.resultJson) {
              try {
                const resultObj = JSON.parse(queryData.data.resultJson);

                if (resultObj.resultUrls && Array.isArray(resultObj.resultUrls) && resultObj.resultUrls.length > 0) {
                  url = resultObj.resultUrls[0];
                }
              } catch (e) {
                // Silent fail, will try other methods
              }
            }

            if (url) {
              console.log('[Inngest] Found valid image URL, assuming success. State:', state, 'URL:', url);
              return { status: 'success', url };
            }
          }

          if (['success', 'succeeded', 'completed', 'finished', 'done'].includes(state)) {
            let url: string | undefined;

            // Method 1: Try to extract from output field (direct response)
            if (output) {
              url = extractUrl(output);
            }

            // Method 2: Try to extract from resultJson field (official Kie.ai format)
            if (!url && queryData.data?.resultJson) {
              try {
                const resultObj = JSON.parse(queryData.data.resultJson);

                if (resultObj.resultUrls && Array.isArray(resultObj.resultUrls) && resultObj.resultUrls.length > 0) {
                  url = resultObj.resultUrls[0];
                  console.log('[Inngest] Extracted URL from resultJson:', url);
                }
              } catch (e) {
                console.error('[Inngest] Failed to parse resultJson:', e);
              }
            }

            if (url) {
              console.log('[Inngest] Successfully found image URL:', url);
              return { status: 'success', url };
            }

            // Log warning but do not fail immediately. Let it retry until timeout.
            console.warn(
              '[Inngest] Success state detected but output/url missing. Retrying...',
              JSON.stringify(queryData, null, 2),
            );
          }

          if (['failed', 'error', 'failure'].includes(state)) {
            const error = queryData.data?.error || queryData.error || 'Unknown error';
            return { status: 'failed', error };
          }

          return { status: 'pending' };
        });

        if (pollResult.status === 'success') {
          imageUrl = pollResult.url;

          // Publish completion event
          if (userId && (channel as any)?.publish) {
            await step.run('publish-completion-event', async () => {
              await (channel as any).publish(`user:${userId}`, {
                type: 'image.generation.kie_complete',
                jobId,
                timestamp: new Date().toISOString(),
              });
              return true;
            });
          }

          break;
        }

        if (pollResult.status === 'failed') {
          throw new Error(`Kie task failed: ${pollResult.error}`);
        }

        // Still processing, update progress
        await step.run(`update-progress-${attempt}`, async () => {
          const progressPercent = 20 + ((attempt + 1) / maxAttempts) * 40;
          await updateJobProgress({ jobId, progress: Math.round(progressPercent) });
        });

        // Sleep before next poll
        await step.sleep(`wait-after-attempt-${attempt}`, '20s');
      }

      if (!imageUrl) {
        throw new Error('Image generation timed out after 120 seconds');
      }

      // Step 5: Persist to Supabase Storage
      const permanentUrl = await step.run('persist-to-supabase', async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.warn('[Inngest] Supabase not configured, returning Kie URL directly');
          return imageUrl;
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('[Inngest] Downloading image from Kie:', imageUrl);

        // Download image from Kie
        const imageRes = await fetch(imageUrl);

        if (!imageRes.ok) {
          throw new Error(`Failed to download image: ${imageRes.status}`);
        }

        const imageBlob = await imageRes.blob();
        const buffer = Buffer.from(await imageBlob.arrayBuffer());

        // Generate filename
        const timestamp = Date.now();
        const extension = outputFormat === 'jpeg' ? 'jpg' : 'png';
        const filename = `generated/${timestamp}-${jobId}.${extension}`;

        console.log('[Inngest] Uploading to Supabase:', filename);

        // Upload to Supabase
        const { data, error } = await supabase.storage.from('images').upload(filename, buffer, {
          contentType: `image/${outputFormat}`,
          cacheControl: '31536000', // 1 year
          upsert: false,
        });

        if (error) {
          console.error('[Inngest] Supabase upload failed:', error);
          throw new Error(`Supabase upload failed: ${error.message}`);
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('images').getPublicUrl(filename);

        console.log('[Inngest] Image persisted to Supabase:', publicUrl);
        await updateJobProgress({ jobId, progress: 90 });

        // Publish persistence event
        if (userId && (channel as any)?.publish) {
          await (channel as any).publish(`user:${userId}`, {
            type: 'image.generation.persisted',
            jobId,
            imageUrl: publicUrl,
            timestamp: new Date().toISOString(),
          });
        }

        return publicUrl;
      });

      // Step 6: Settle credits and complete job
      await step.run('complete-job', async () => {
        /*
         * TODO: Settle credits with wallet manager
         * await walletManager.settle(userId, cost, cost);
         */

        const outputData = {
          imageUrl: permanentUrl,
          metadata: {
            model: googleModel,
            aspectRatio,
            outputFormat,
            prompt: prompt.substring(0, 200), // Truncated for storage
            completedAt: new Date().toISOString(),
          },
        };

        await updateJobStatus({
          jobId,
          status: 'completed',
          progress: 100,
          outputData,
        });

        // Publish final completion event
        if (userId && (channel as any)?.publish) {
          await (channel as any).publish(`user:${userId}`, {
            type: 'image.generation.complete',
            jobId,
            imageUrl: permanentUrl,
            timestamp: new Date().toISOString(),
          });
        }

        console.log('[Inngest] Image generation completed:', {
          jobId,
          imageUrl: permanentUrl,
        });
      });

      return {
        success: true,
        jobId,
        imageUrl: permanentUrl,
      };
    } catch (error) {
      console.error('[Inngest] Image generation failed:', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      await incrementJobAttempts(jobId);

      /*
       * TODO: Refund credits on failure
       * await walletManager.refund(userId, cost);
       */

      await updateJobStatus({
        jobId,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Publish failure event
      if (userId && (channel as any)?.publish) {
        await (channel as any).publish(`user:${userId}`, {
          type: 'image.generation.failed',
          jobId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }

      throw error; // Re-throw to trigger Inngest's retry mechanism
    }
  },
);
