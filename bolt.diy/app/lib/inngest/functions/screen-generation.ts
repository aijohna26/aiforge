/**
 * Screen Generation Inngest Function
 *
 * Background worker that handles AI-powered screen generation with:
 * - Real-time progress streaming to clients
 * - Automatic retry on failure (3 attempts)
 * - Concurrency limiting (max 5 concurrent generations)
 * - Token usage tracking
 * - Context preservation across screens
 */

import { inngest } from '../client';
import { StudioAgent, type StudioBranding, type StudioScreenRequest } from '~/lib/modules/studio/StudioAgent';
import { updateJobStatus, updateJobProgress, incrementJobAttempts } from '../db';

interface ScreenGenerationInput {
  jobId: string;
  userId?: string;
  branding: StudioBranding;
  screens: StudioScreenRequest[];
  includeTheme?: boolean;
}

export const screenGeneration = inngest.createFunction(
  {
    id: 'screen-generation',
    name: 'Generate Mobile Screens',
    retries: 3,
    concurrency: {
      limit: 5,
      key: 'event.data.userId', // Limit per user
    },
  },
  { event: 'studio/generate.screens' },
  async ({ event, step, channel }) => {
    const { jobId, userId, branding, screens, includeTheme } = event.data as ScreenGenerationInput;

    try {
      console.log('[Inngest] Starting screen generation:', {
        jobId,
        screenCount: screens.length,
        includeTheme,
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
            type: 'generation.start',
            jobId,
            screenCount: screens.length,
            timestamp: new Date().toISOString(),
          });
        }

        console.log('[Inngest] Job initialized:', jobId);
      });

      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

      if (!apiKey) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY not configured');
      }

      const agent = new StudioAgent(apiKey);

      // Step 3: Generate theme if requested
      let generatedTheme = null;

      if (includeTheme) {
        generatedTheme = await step.run('generate-theme', async () => {
          console.log('[Inngest] Generating theme...');

          if (userId && (channel as any)?.publish) {
            await (channel as any).publish(`user:${userId}`, {
              type: 'theme.generating',
              jobId,
              timestamp: new Date().toISOString(),
            });
          }

          const theme = await agent.generateTheme(branding);

          if (userId && (channel as any)?.publish) {
            await (channel as any).publish(`user:${userId}`, {
              type: 'theme.complete',
              jobId,
              theme,
              timestamp: new Date().toISOString(),
            });
          }

          await updateJobProgress({ jobId, progress: 10 });

          return theme;
        });
      }

      // Step 4: Generate each screen in PARALLEL for massive speed gains
      const totalScreens = screens.length;
      const generatedScreens = await Promise.all(
        screens.map(async (screen, i) => {
          const screenIndex = i + 1;

          return await step.run(`generate-of-screen-${screen.id}`, async () => {
            console.log(`[Inngest] Generating screen ${screenIndex}/${totalScreens}:`, screen.name);

            // Publish screen generation start
            if (userId && (channel as any)?.publish) {
              await (channel as any).publish(`user:${userId}`, {
                type: 'screen.generating',
                jobId,
                screenId: screen.id,
                screenName: screen.name,
                screenIndex,
                totalScreens,
                timestamp: new Date().toISOString(),
              });
            }

            try {
              /*
               * Generate screen without passing 'step' to avoid nesting issues
               * This treats the entire screen generation as one atomic unit
               */
              const result = await agent.generateScreen(branding, screen);

              console.log(`[Inngest] Screen ${screenIndex}/${totalScreens} completed:`, screen.name);

              // Publish individual screen completion for UI updates
              if (userId && (channel as any)?.publish) {
                await (channel as any).publish(`user:${userId}`, {
                  type: 'screen.complete',
                  jobId,
                  screenId: screen.id,
                  screenName: screen.name,
                  screenIndex,
                  totalScreens,
                  timestamp: new Date().toISOString(),
                });
              }

              return result;
            } catch (error) {
              console.error(`[Inngest] Failed to generate screen ${screen.name}:`, error);

              if (userId && (channel as any)?.publish) {
                await (channel as any).publish(`user:${userId}`, {
                  type: 'screen.failed',
                  jobId,
                  screenId: screen.id,
                  screenName: screen.name,
                  error: error instanceof Error ? error.message : 'Unknown error',
                  timestamp: new Date().toISOString(),
                });
              }

              throw error;
            }
          });
        }),
      );

      // Step 5: Mark job as completed
      await step.run('complete-job', async () => {
        const outputData = {
          screens: generatedScreens,
          theme: generatedTheme,
          metadata: {
            totalScreens: generatedScreens.length,
            brandName: branding.appName,
            completedAt: new Date().toISOString(),
          },
        };

        await updateJobStatus({
          jobId,
          status: 'completed',
          progress: 100,
          outputData,

          /*
           * TODO: Track token usage from LLM responses
           * tokenUsage: { prompt: 0, completion: 0, total: 0 },
           * estimatedCostUsd: 0,
           */
        });

        // Publish final completion event
        if (userId && (channel as any)?.publish) {
          await (channel as any).publish(`user:${userId}`, {
            type: 'generation.complete',
            jobId,
            screens: generatedScreens,
            theme: generatedTheme,
            timestamp: new Date().toISOString(),
          });
        }

        console.log('[Inngest] Screen generation completed:', {
          jobId,
          screenCount: generatedScreens.length,
        });
      });

      return {
        success: true,
        jobId,
        screenCount: generatedScreens.length,
      };
    } catch (error) {
      // Handle any errors that weren't caught in individual steps
      console.error('[Inngest] Screen generation failed:', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      await incrementJobAttempts(jobId);

      await updateJobStatus({
        jobId,
        status: 'failed',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Publish failure event
      if (userId && (channel as any)?.publish) {
        await (channel as any).publish(`user:${userId}`, {
          type: 'generation.failed',
          jobId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }

      throw error; // Re-throw to trigger Inngest's retry mechanism
    }
  },
);
