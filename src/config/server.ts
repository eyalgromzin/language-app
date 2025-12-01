import { Platform } from 'react-native';

// Server configuration
export const SERVER_CONFIG = {
  // For development, use device IP address for Android and localhost for iOS
  // For production, this should be your actual server URL
  BASE_URL: __DEV__ 
    ? (Platform.OS === 'android' ? 'http://localhost:3000' : 'http://localhost:3000')
    : 'https://your-production-server.com'
};
