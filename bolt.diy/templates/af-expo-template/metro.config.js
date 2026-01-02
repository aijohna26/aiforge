const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure node_modules are resolved correctly in WebContainer
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Add explicit module resolution for problematic packages
config.resolver.extraNodeModules = {
  'expo-linking': path.resolve(__dirname, 'node_modules/expo-linking'),
  'expo-router': path.resolve(__dirname, 'node_modules/expo-router'),
  '@react-navigation/native': path.resolve(__dirname, 'node_modules/@react-navigation/native'),
};

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
  'webp',
  'svg',
  'ttf',
  'otf',
  'woff',
  'woff2',
];

// Platform-specific extensions
config.resolver.platforms = ['web', 'ios', 'android'];

module.exports = config;
