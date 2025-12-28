/**
 * Inngest Functions Registry
 *
 * Central export point for all Inngest background functions.
 * Functions are registered here and served via the Inngest API endpoint.
 */

import { screenGeneration } from './screen-generation';
import { screenshotExport } from './screenshot-export';
import { imageGeneration } from './image-generation';

/*
 * TODO: Implement remaining functions
 * import { chatContext } from './chat-context';
 * import { styleExtraction } from './style-extraction';
 * import { cleanupStaleJobs } from './cleanup-stale-jobs';
 */

/**
 * Array of all Inngest functions to be served
 * Add new functions here as they are implemented
 */
export const functions = [
  screenGeneration,
  screenshotExport,
  imageGeneration,

  /*
   * chatContext,
   * styleExtraction,
   * cleanupStaleJobs,
   */
];
