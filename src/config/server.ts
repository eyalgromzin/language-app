import { Platform } from 'react-native';

// Server configuration
export const SERVER_CONFIG = {
  // For development, use device IP address for Android and localhost for iOS
  // For production, this should be your actual server URL
  BASE_URL: __DEV__ 
    ? (Platform.OS === 'android' ? 'http://localhost:3000' : 'http://localhost:3000')
    : 'https://your-production-server.com',
  
  // API endpoints
  ENDPOINTS: {
    WORD_CATEGORIES: '/word-categories',
    WORD_CATEGORY_BY_ID: '/word-categories',
    TRANSLATE: '/translate',
    TRANSCRIPT: '/transcript',
    YOUTUBE_SEARCH: '/youtube/search',
    VIDEO_STARTUP: '/getVideoStartupPage',
  },
};

// Helper function to get full URL for an endpoint
export const getApiUrl = (endpoint: string): string => {
  return `${SERVER_CONFIG.BASE_URL}${endpoint}`;
};
