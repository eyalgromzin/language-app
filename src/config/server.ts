// Server configuration
export const SERVER_CONFIG = {
  // For development, use localhost
  // For production, this should be your actual server URL
  BASE_URL: __DEV__ ? 'http://localhost:3000' : 'https://your-production-server.com',
  
  // API endpoints
  ENDPOINTS: {
    WORD_CATEGORIES: '/word-categories',
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
