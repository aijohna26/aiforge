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
export function validatePackageJson(filePath: string, content: string, isE2BContext: boolean = false): string {
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
    const isE2B = isE2BContext || (isServerSide && hasE2BApiKey);

    const expoStartCommand = isE2B
      ? 'EXPO_NO_TELEMETRY=1 npx --yes expo start --web --port 8082'
      : 'EXPO_NO_TELEMETRY=1 npx --yes expo start --tunnel';

    // Ensure dev script exists with correct mode
    if (!pkg.scripts.dev || (pkg.scripts.dev.includes('expo start') && !pkg.scripts.dev.includes('--host 0.0.0.0'))) {
      pkg.scripts.dev = expoStartCommand;
      logger.warn(`[Validator] Auto-fixed dev script for ${isE2B ? 'E2B (web mode)' : 'local (tunnel mode)'}`);
      fixed = true;
    }

    // Ensure start script exists with correct mode
    if (!pkg.scripts.start || (pkg.scripts.start.includes('expo start') && !pkg.scripts.start.includes('--host 0.0.0.0'))) {
      pkg.scripts.start = expoStartCommand;
      logger.warn(`[Validator] Auto-fixed start script for ${isE2B ? 'E2B (web mode)' : 'local (tunnel mode)'}`);
      fixed = true;
    }

    // CRITICAL: Remove forbidden scripts that cause failures
    if (pkg.scripts['start:web']) {
      delete pkg.scripts['start:web'];
      logger.warn('[Validator] Removed forbidden "start:web" script');
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

    // GLOBAL CLEANUP: Remove deprecated or conflicting packages
    // @types/react-native is deprecated and included in react-native now
    if (pkg.devDependencies?.['@types/react-native']) {
      delete pkg.devDependencies['@types/react-native'];
      fixed = true;
    }
    if (pkg.dependencies?.['@types/react-native']) {
      delete pkg.dependencies['@types/react-native'];
      fixed = true;
    }



    // CRITICAL: Strictly enforce Expo SDK 54 "Golden Set" versions
    // This overrides any hallucinated or mismatched versions from the LLM
    // These versions are taken from the template package.json and verified against Expo warnings
    const STRICT_EXPO_54_VERSIONS: Record<string, string> = {
      // Core SDK 54 versions
      'expo': '~54.0.31',
      'react': '19.1.0',
      'react-dom': '19.1.0',
      'react-native': '0.81.5',
      'react-native-web': '~0.21.2',
      'babel-preset-expo': '~54.0.0',
      '@types/react': '~19.1.10',
      'typescript': '^5.3.3',

      // Expo Router & Navigation
      'expo-router': '~6.0.21',
      'react-native-safe-area-context': '5.6.0',
      'react-native-screens': '~4.16.0',
      'expo-linking': '~8.0.11',
      'expo-constants': '~18.0.13',
      'expo-status-bar': '~3.0.9',
      '@react-navigation/bottom-tabs': '^7.2.0',
      '@react-navigation/native': '^7.0.14',

      // Animation & Gestures - CRITICAL: These were causing warnings
      'react-native-reanimated': '~4.1.1',  // Was 3.16.7, needs to be ~4.1.1
      'react-native-gesture-handler': '~2.28.0',  // Was 2.20.2, needs to be ~2.28.0
      '@react-native-async-storage/async-storage': '2.2.0',  // Was 1.23.1

      // UI & Icons
      '@expo/vector-icons': '^15.0.3',  // Was 14.1.0, needs to be ^15.0.3
      '@lucide/lab': '^0.1.2',
      'lucide-react-native': '^0.562.0',

      // Expo Modules - CRITICAL: Match exact versions from warnings
      'expo-asset': '~12.0.2',
      'expo-blur': '~15.0.8',
      'expo-camera': '~17.0.10',
      'expo-font': '~14.0.10',
      'expo-image': '~2.0.0',
      'expo-haptics': '~15.0.8',
      'expo-linear-gradient': '~15.0.8',
      'expo-secure-store': '~15.0.8',
      'expo-splash-screen': '~31.0.13',  // Was 0.29.24, needs to be ~31.0.13
      'expo-sqlite': '~16.0.10',
      'expo-symbols': '~1.0.8',  // Was 0.2.2, needs to be ~1.0.8
      'expo-system-ui': '~6.0.9',
      'expo-web-browser': '~15.0.10',

      // Other essentials
      'react-native-svg': '15.12.1',
      'react-native-url-polyfill': '^2.0.0',
      'react-native-webview': '13.15.0',
      'react-native-worklets': '0.5.1',
      'zustand': '^5.0.3',

      // Dev dependencies (kept here for version enforcement)
      '@babel/core': '^7.20.0',
      'babel-plugin-module-resolver': '^5.0.0'
    };

    const REQUIRED_EXPO_DEPENDENCIES = [
      '@expo/vector-icons',
      '@lucide/lab',
      '@react-native-async-storage/async-storage',
      '@react-navigation/bottom-tabs',
      '@react-navigation/native',
      'expo',
      'expo-asset',
      'expo-blur',
      'expo-camera',
      'expo-constants',
      'expo-font',
      'expo-haptics',
      'expo-linear-gradient',
      'expo-linking',
      'expo-router',
      'expo-secure-store',
      'expo-splash-screen',
      'expo-sqlite',
      'expo-status-bar',
      'expo-symbols',
      'expo-system-ui',
      'expo-web-browser',
      'lucide-react-native',
      'react',
      'react-dom',
      'react-native',
      'react-native-gesture-handler',
      'react-native-reanimated',
      'react-native-safe-area-context',
      'react-native-screens',
      'react-native-svg',
      'react-native-url-polyfill',
      'react-native-web',
      'react-native-webview',
      'react-native-worklets',
      'zustand',
    ];

    const REQUIRED_EXPO_DEV_DEPENDENCIES = [
      '@babel/core',
      '@types/react',
      'babel-plugin-module-resolver',
      'babel-preset-expo',
      'typescript',
    ];

    // Apply strict overrides and inject missing dependencies
    pkg.dependencies = pkg.dependencies || {};
    for (const dep of REQUIRED_EXPO_DEPENDENCIES) {
      const version = STRICT_EXPO_54_VERSIONS[dep];
      if (!pkg.dependencies[dep]) {
        pkg.dependencies[dep] = version;
        fixed = true;
      } else if (version && pkg.dependencies[dep] !== version) {
        pkg.dependencies[dep] = version;
        fixed = true;
      }
    }

    // Apply strict overrides and inject missing devDependencies
    pkg.devDependencies = pkg.devDependencies || {};
    for (const dep of REQUIRED_EXPO_DEV_DEPENDENCIES) {
      const version = STRICT_EXPO_54_VERSIONS[dep] || pkg.devDependencies[dep];
      if (!pkg.devDependencies[dep] && version) {
        pkg.devDependencies[dep] = version;
        fixed = true;
      } else if (version && pkg.devDependencies[dep] && pkg.devDependencies[dep] !== version) {
        pkg.devDependencies[dep] = version;
        fixed = true;
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

      // CRITICAL: Ensure babel-plugin-module-resolver is present for @/ path aliases
      if (!pkg.devDependencies['babel-plugin-module-resolver']) {
        pkg.devDependencies['babel-plugin-module-resolver'] = '^5.0.0';
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

      // react-native-worklets is required by Reanimated in SDK 54

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
