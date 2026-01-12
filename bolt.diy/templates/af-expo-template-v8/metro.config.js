const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// CRITICAL: Block macOS metadata files from being bundled
config.resolver.blacklistRE = /\/\._.*/;

// Optimize worker count for E2B (prevents CPU starvation/timeouts)
config.maxWorkers = 2;



// Optimize for web platform
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs'];

// CRITICAL: Add asset extensions for images and other media files
// This fixes "unsupported file type: undefined" errors for images
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'ico',
  'webp',
  'svg',
  'ttf',
  'otf',
  'woff',
  'woff2',
];

// Platform-specific extensions
config.resolver.platforms = ['web', 'ios', 'android'];

// CRITICAL: Configure path alias for @/ imports
// This must match tsconfig.json paths
config.resolver.extraNodeModules = {
  '@': __dirname,
};

module.exports = config;
