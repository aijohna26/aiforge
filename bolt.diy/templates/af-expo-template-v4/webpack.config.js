const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@react-navigation', 'expo-router'],
      },
    },
    argv
  );

  // Ensure correct module resolution for WebContainer
  config.resolve.modules = [
    path.resolve(__dirname, 'node_modules'),
    'node_modules',
    ...(config.resolve.modules || []),
  ];

  // Add alias for expo modules to help with WebContainer resolution
  config.resolve.alias = {
    ...config.resolve.alias,
    'expo-linking': path.resolve(__dirname, 'node_modules/expo-linking'),
    'expo-router': path.resolve(__dirname, 'node_modules/expo-router'),
    '@react-navigation/native': path.resolve(__dirname, 'node_modules/@react-navigation/native'),
  };

  // Add fallbacks for node modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: false,
    stream: false,
    buffer: false,
  };

  // Ensure extensions are resolved
  config.resolve.extensions = [
    '.web.tsx',
    '.web.ts',
    '.web.jsx',
    '.web.js',
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
    '.json',
    ...(config.resolve.extensions || []),
  ];

  return config;
};
