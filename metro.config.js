const { getDefaultConfig } = require('@expo/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  watchFolders: [__dirname],
  resolver: {
    ...defaultConfig.resolver,
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg']
  },
  transformer: {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer')
  }
};
