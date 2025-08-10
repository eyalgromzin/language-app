module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-webview)/)'
  ],
  moduleNameMapper: {
    '^react-native-webview$': '<rootDir>/__mocks__/react-native-webview.js',
  },
};
