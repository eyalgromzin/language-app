module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-webview)/)'
  ],
  moduleNameMapper: {
    '^react-native-svg$': '<rootDir>/__mocks__/react-native-svg.js',
    '^react-native-webview$': '<rootDir>/__mocks__/react-native-webview.js',
    '^react-native-youtube-iframe$': '<rootDir>/__mocks__/empty.js',
    '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^react-native-fs$': '<rootDir>/__mocks__/react-native-fs.js',
    '^react-native-vector-icons/.+$': '<rootDir>/__mocks__/react-native-vector-icons.js',
    '^react-native-tts$': '<rootDir>/__mocks__/react-native-tts.js',
    '^@react-native-documents/picker$': '<rootDir>/__mocks__/react-native-document-picker.js',
    '^@epubjs-react-native/core$': '<rootDir>/__mocks__/empty.js',
    '^@epubjs-react-native/file-system$': '<rootDir>/__mocks__/empty.js',
    '^youtube-transcript$': '<rootDir>/__mocks__/empty.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/language-learn-server/'],
};
