/**
 * Prewarm paths - files that are always included in context
 * These are critical files that the AI should always have access to
 */

export const PREWARM_PATHS = [
  'package.json',           // Dependencies and scripts
  'app.json',               // Expo configuration
  'app/_layout.tsx',        // Root layout
  'app/(tabs)/index.tsx',   // Main home screen
  'constants/Colors.ts',    // Theme colors
  'tsconfig.json',          // TypeScript configuration
] as const;

/**
 * Check if a path is a prewarm path
 */
export function isPrewarmPath(path: string): boolean {
  return PREWARM_PATHS.some(prewarmPath => path.endsWith(prewarmPath));
}

/**
 * Get all prewarm paths that exist in the project
 */
export function getExistingPrewarmPaths(allPaths: string[]): string[] {
  return PREWARM_PATHS.filter(prewarmPath =>
    allPaths.some(path => path.endsWith(prewarmPath))
  );
}
