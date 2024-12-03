module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@assets': './src/assets',
          },
        },
      ],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blacklist: null,
          whitelist: [
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY',
            'PAYSTACK_PUBLIC_KEY',
            'PAYSTACK_SECRET_KEY'
          ],
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
