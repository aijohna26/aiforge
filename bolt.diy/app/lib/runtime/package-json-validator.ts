import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('PackageJsonValidator');

/**
 * Validates and auto-fixes package.json content for Expo projects in E2B environments.
 * Ensures required --tunnel flags are present in dev and start scripts.
 *
 * @param filePath - The file path to check if it's package.json
 * @param content - The file content to validate
 * @returns Validated/fixed content if package.json, otherwise original content
 */
export function validatePackageJson(filePath: string, content: string): string {
  // Only validate package.json files
  if (!filePath.endsWith('package.json')) {
    return content;
  }

  // Debug: Log what we're validating
  logger.info('[Validator] Validating package.json');
  logger.debug('[Validator] Original content preview:', content.substring(0, 500));

  try {
    const pkg = JSON.parse(content);

    // Check if this is an Expo project
    const isExpo =
      pkg.dependencies?.expo ||
      pkg.dependencies?.['expo-router'] ||
      (pkg.scripts?.dev && pkg.scripts.dev.includes('expo'));

    if (!isExpo) {
      return content; // Not Expo, no validation needed
    }

    // Validate and auto-fix Expo scripts
    let fixed = false;

    if (!pkg.scripts) {
      pkg.scripts = {};
      fixed = true;
    }

    // Ensure dev script exists with --tunnel flag
    if (!pkg.scripts.dev || !pkg.scripts.dev.includes('--tunnel')) {
      pkg.scripts.dev = 'EXPO_NO_TELEMETRY=1 npx expo start --tunnel';
      logger.warn('[Validator] Auto-fixed missing/incorrect dev script in package.json');
      fixed = true;
    }

    // Ensure start script exists with --tunnel flag
    if (!pkg.scripts.start || !pkg.scripts.start.includes('--tunnel')) {
      pkg.scripts.start = 'EXPO_NO_TELEMETRY=1 npx expo start --tunnel';
      logger.warn('[Validator] Auto-fixed missing/incorrect start script in package.json');
      fixed = true;
    }

    if (fixed) {
      logger.info('[Validator] Package.json validation: Auto-fixed scripts', pkg.scripts);
      return JSON.stringify(pkg, null, 2);
    }

    logger.info('[Validator] Package.json validation: OK', pkg.scripts);
    return content;
  } catch (err) {
    logger.error('[Validator] Failed to validate package.json', err);
    return content; // Return original on parse error
  }
}
