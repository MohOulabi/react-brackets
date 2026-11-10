const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);
const repository = path.resolve(__dirname, '../..');

// In this repository, read the library from its TypeScript source, so a change shows without a build.
const sources = {
  '@react-brackets/native': 'packages/native/src/index.ts',
  '@react-brackets/core': 'packages/core/src/index.ts',
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const source = sources[moduleName];
  if (source) return { type: 'sourceFile', filePath: path.join(repository, source) };
  return context.resolveRequest(context, moduleName, platform);
};

// Uniwind wraps everything else, as it asks.
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
