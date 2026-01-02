import { json, type ActionFunctionArgs } from '@remix-run/node';
import { analyzeScreen, type ScreenMetadata } from '~/lib/services/screen-analyzer';
import { logger } from '~/utils/logger';

/**
 * API Route: Analyze Screen
 *
 * POST /api/analyze-screen
 *
 * Analyzes a single screen design using Claude's vision API and returns
 * a comprehensive analysis including layout, interactions, data requirements,
 * and accessibility considerations.
 *
 * Request Body:
 * {
 *   screenId: string;
 *   imageUrl: string;
 *   metadata: {
 *     type: string;
 *     name: string;
 *     appCategory?: string;
 *     style?: string;
 *   }
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   analysis?: ScreenAnalysis;
 *   error?: string;
 * }
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const { screenId, imageUrl, metadata } = body as {
      screenId: string;
      imageUrl: string;
      metadata: Omit<ScreenMetadata, 'screenId'>;
    };

    // Validate required fields
    if (!screenId || !imageUrl || !metadata) {
      return json(
        {
          success: false,
          error: 'Missing required fields: screenId, imageUrl, metadata',
        },
        { status: 400 },
      );
    }

    if (!metadata.type || !metadata.name) {
      return json(
        {
          success: false,
          error: 'Metadata must include type and name',
        },
        { status: 400 },
      );
    }

    logger.info(`[API] Analyzing screen: ${metadata.name} (${screenId})`);

    // Perform analysis
    const analysis = await analyzeScreen(imageUrl, {
      screenId,
      ...metadata,
    });

    logger.info(`[API] Successfully analyzed screen: ${metadata.name}`);

    return json({
      success: true,
      analysis,
    });
  } catch (error) {
    logger.error('[API] Screen analysis failed:', error);

    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 },
    );
  }
}
