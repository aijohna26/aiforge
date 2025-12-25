/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for gradual rollout of new features.
 * All flags default to false/disabled for safety.
 */

export const FEATURE_FLAGS = {
  /**
   * Enable Inngest background processing for screen generation
   * When enabled, screen generation requests are queued as background jobs
   * When disabled, uses the original synchronous processing
   */
  USE_INNGEST_SCREEN_GEN: process.env.USE_INNGEST_SCREEN_GEN === 'true',

  /**
   * Enable Inngest background processing for screenshot/PDF exports
   * When enabled, screenshot requests are processed as background jobs
   * When disabled, uses the original synchronous Puppeteer execution
   */
  USE_INNGEST_SCREENSHOT: process.env.USE_INNGEST_SCREENSHOT === 'true',

  /**
   * Enable Inngest background processing for chat context operations
   * When enabled, heavy context operations run in background
   * When disabled, context operations run inline with chat stream
   */
  USE_INNGEST_CHAT_CONTEXT: process.env.USE_INNGEST_CHAT_CONTEXT === 'true',

  /**
   * Enable Inngest background processing for style guide extraction
   * When enabled, style extraction from images runs as background jobs
   * When disabled, uses synchronous processing
   */
  USE_INNGEST_STYLE_EXTRACT: process.env.USE_INNGEST_STYLE_EXTRACT === 'true',

  /**
   * Enable Inngest cleanup cron job for stale jobs
   * When enabled, runs periodic cleanup of stuck/zombie jobs
   */
  USE_INNGEST_CLEANUP_CRON: process.env.USE_INNGEST_CLEANUP_CRON === 'true',
} as const;

/**
 * Helper to check if any Inngest feature is enabled
 */
export function isInngestEnabled(): boolean {
  return (
    FEATURE_FLAGS.USE_INNGEST_SCREEN_GEN ||
    FEATURE_FLAGS.USE_INNGEST_SCREENSHOT ||
    FEATURE_FLAGS.USE_INNGEST_CHAT_CONTEXT ||
    FEATURE_FLAGS.USE_INNGEST_STYLE_EXTRACT ||
    FEATURE_FLAGS.USE_INNGEST_CLEANUP_CRON
  );
}

/**
 * Get current feature flag status for debugging
 */
export function getFeatureFlagStatus() {
  return {
    screenGeneration: FEATURE_FLAGS.USE_INNGEST_SCREEN_GEN,
    screenshot: FEATURE_FLAGS.USE_INNGEST_SCREENSHOT,
    chatContext: FEATURE_FLAGS.USE_INNGEST_CHAT_CONTEXT,
    styleExtraction: FEATURE_FLAGS.USE_INNGEST_STYLE_EXTRACT,
    cleanupCron: FEATURE_FLAGS.USE_INNGEST_CLEANUP_CRON,
    anyEnabled: isInngestEnabled(),
  };
}
