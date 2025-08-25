// API Configuration
export const API_CONFIG = {
  // Development server URL - update this for production
  SERVER_URL: 'http://localhost:3000',
  
  // API endpoints
  ENDPOINTS: {
    HARMFUL_WORDS: '/harmful-words',
    TRANSLATE: '/translate',
    YOUTUBE_SEARCH: '/youtube/search',
    VIDEO_STARTUP: '/getVideoStartupPage',
    LIBRARY_ADD_URL: '/library/addUrl',
    VIDEO_NOW_PLAYING: '/video/now-playing/upsert',
    CACHE_LAST_WORDS: '/cache/last-words',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.SERVER_URL}${endpoint}`;
};

// Helper function to update server URL (useful for different environments)
export const updateServerUrl = (newUrl: string): void => {
  API_CONFIG.SERVER_URL = newUrl;
};
