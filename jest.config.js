module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-webview)/)'
  ],
  moduleNameMapper: {
    '^react-native-webview$': '<rootDir>/__mocks__/react-native-webview.js',
    '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^react-native-fs$': '<rootDir>/__mocks__/react-native-fs.js',
    '^react-native-vector-icons/.+$': '<rootDir>/__mocks__/react-native-vector-icons.js',
    '^react-native-tts$': '<rootDir>/__mocks__/react-native-tts.js',
  },
};
