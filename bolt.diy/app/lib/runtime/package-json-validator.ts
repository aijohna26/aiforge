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

    // CRITICAL: For E2B environments, use --web mode for iframe previewing
    // For local development, use --tunnel mode for mobile device testing
    // Detect server-side E2B context - this validator runs in both browser and server
    const isServerSide = typeof window === 'undefined';
    const hasE2BApiKey = typeof process !== 'undefined' && !!process.env.E2B_API_KEY;
    const isE2B = isServerSide && hasE2BApiKey;

    const expoStartCommand = isE2B
      ? 'EXPO_NO_TELEMETRY=1 npx expo start --web --port 8081'
      : 'EXPO_NO_TELEMETRY=1 npx expo start --tunnel';

    // Ensure dev script exists with correct mode
    if (!pkg.scripts.dev || pkg.scripts.dev.includes('expo start')) {
      pkg.scripts.dev = expoStartCommand;
      logger.warn(`[Validator] Auto-fixed dev script for ${isE2B ? 'E2B (web mode)' : 'local (tunnel mode)'}`);
      fixed = true;
    }

    // Ensure start script exists with correct mode
    if (!pkg.scripts.start || pkg.scripts.start.includes('expo start')) {
      pkg.scripts.start = expoStartCommand;
      logger.warn(`[Validator] Auto-fixed start script for ${isE2B ? 'E2B (web mode)' : 'local (tunnel mode)'}`);
      fixed = true;
    }

    // CRITICAL: Fix hallucinated package versions that LLMs commonly generate
    // LLMs often guess versions with ~ or ^ that don't exist in npm
    const KNOWN_BAD_VERSIONS: Record<string, string> = {
      'expo-splash-screen': '^31.0.0',  // Latest for Expo 54
      'expo-status-bar': '^3.0.0',      // Latest for Expo 54
      'expo-updates': '^0.26.0',        // Latest for Expo 54
      'expo-font': '^14.0.0',           // Latest for Expo 54
      'expo-asset': '~11.0.1',          // Latest for SDK 54
      'babel-preset-expo': '~54.0.0',   // Enforcing SDK 54
      'expo': '~54.0.0',                // Enforcing SDK 54
    };

    const sanitizeDeps = (deps: Record<string, string> = {}) => {
      let changed = false;
      for (const [pkgName, version] of Object.entries(deps)) {
        // Check if this is a known package that needs version correction
        if (KNOWN_BAD_VERSIONS[pkgName]) {
          // CRITICAL: Any version with ~ or ^ is likely hallucinated since these packages
          // don't follow semantic versioning properly. LLMs guess ~0.31.0, ~1.0.0, etc.
          const hasTildeOrCaret = version.startsWith('~') || version.startsWith('^');

          // Also catch bare versions like "1.0.0" or "0.31.0"
          const isBareVersion = /^\d+\.\d+\.\d+$/.test(version);

          if (hasTildeOrCaret || isBareVersion) {
            logger.warn(`[Validator] 🔧 Fixing hallucinated version for ${pkgName}: ${version} -> ${KNOWN_BAD_VERSIONS[pkgName]}`);
            deps[pkgName] = KNOWN_BAD_VERSIONS[pkgName];
            changed = true;
          }
        }
      }
      return changed;
    };

    // Check and fix both dependencies and devDependencies
    if (pkg.dependencies && sanitizeDeps(pkg.dependencies)) {
      logger.warn('[Validator] Fixed bad dependency versions');
      fixed = true;
    }

    if (pkg.devDependencies && sanitizeDeps(pkg.devDependencies)) {
      logger.warn('[Validator] Fixed bad devDependency versions');
      fixed = true;
    }

    // CRITICAL: Strictly enforce Expo SDK 54 "Golden Set" versions
    // This overrides any hallucinated or mismatched versions from the LLM
    const STRICT_EXPO_54_VERSIONS: Record<string, string> = {
      'expo': '~54.0.30',
      'react': '19.1.0',
      'react-dom': '19.1.0',
      'react-native': '0.81.5',
      'react-native-web': '~0.21.2',
      'babel-preset-expo': '~54.0.0',
      '@expo/metro-config': '~54.0.12',
      '@types/react': '~19.1.10',
      '@types/react-dom': '~19.0.0',
      'typescript': '^5.3.0',

      // Extended Stack (Router, UI, etc.)
      'expo-router': '~6.0.21',
      'react-native-safe-area-context': '5.3.0',
      'react-native-screens': '~4.16.0', // Updated for compatibility
      'expo-linking': '~7.1.3',
      'expo-constants': '~18.0.12',
      'expo-status-bar': '~2.2.2',
      'react-native-reanimated': '~3.17.4',
      'react-native-gesture-handler': '~2.24.0',
      '@expo/vector-icons': '^14.1.0',

      // Template Essentials (from user screenshot)
      '@lucide/lab': '^0.1.2',
      '@react-navigation/bottom-tabs': '^7.2.0',
      '@react-navigation/native': '^7.0.14',
      'expo-blur': '~14.1.3',
      'expo-camera': '~16.1.5',
      'expo-font': '~13.2.2',
      'expo-haptics': '~14.1.3',
      'expo-linear-gradient': '~14.1.3',
      'expo-splash-screen': '~0.30.6',
      'expo-symbols': '~0.4.3',
      'expo-system-ui': '~5.0.5',
      'expo-web-browser': '~14.1.5',
      'lucide-react-native': '^0.475.0',
      'react-native-svg': '15.11.2',
      'react-native-url-polyfill': '^2.0.0',
      'react-native-webview': '13.13.5'
    };

    // Apply strict overrides to dependencies
    if (pkg.dependencies) {
      for (const [dep, version] of Object.entries(STRICT_EXPO_54_VERSIONS)) {
        if (pkg.dependencies[dep]) {
          pkg.dependencies[dep] = version;
          fixed = true;
        }
      }
    }

    // Apply strict overrides to devDependencies OR inject if required
    if (isE2B) {
      pkg.devDependencies = pkg.devDependencies || {};

      // Force specific devDeps
      const devDepsToEnforce = ['@types/react', '@types/react-dom', 'typescript', '@expo/metro-config'];
      for (const dep of devDepsToEnforce) {
        pkg.devDependencies[dep] = STRICT_EXPO_54_VERSIONS[dep];
        fixed = true;
      }

      // Explicitly remove deprecated @types/react-native to prevent conflicts
      if (pkg.devDependencies?.['@types/react-native']) {
        delete pkg.devDependencies['@types/react-native'];
        fixed = true;
      }
      if (pkg.dependencies?.['@types/react-native']) {
        delete pkg.dependencies['@types/react-native'];
        fixed = true;
      }

      // Ensure tunneling
      if (!pkg.devDependencies['@expo/ngrok']) {
        pkg.devDependencies['@expo/ngrok'] = '^4.1.0';
        fixed = true;
      }
    }

    // Ensure react-native-web is present for Web Mode
    if (isE2B && !pkg.dependencies?.['react-native-web']) {
      pkg.dependencies = pkg.dependencies || {};
      pkg.dependencies['react-native-web'] = STRICT_EXPO_54_VERSIONS['react-native-web'];
      pkg.dependencies['react-dom'] = STRICT_EXPO_54_VERSIONS['react-dom'];
      fixed = true;
    }

    if (fixed) {
      logger.info('[Validator] Package.json validation: Auto-fixed', { scripts: pkg.scripts, fixedDeps: true });
      return JSON.stringify(pkg, null, 2);
    }

    logger.info('[Validator] Package.json validation: OK', pkg.scripts);
    return content;
  } catch (err) {
    logger.error('[Validator] Failed to validate package.json', err);
    return content; // Return original on parse error
  }
}
