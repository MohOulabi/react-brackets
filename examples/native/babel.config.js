module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Unistyles only rewrites the files of its own example.
    plugins: [['react-native-unistyles/plugin', { root: 'src/examples/unistyles' }]],
  };
};
