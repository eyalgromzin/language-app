
// API Configuration
export const API_CONFIG = {
  // Production server URL with fallback to localhost
  SERVER_URL: 'https://language-learn-server.onrender.com',
  // SERVER_URL: 'http://localhost:3000',
  
  // API endpoints
  ENDPOINTS: {
    HARMFUL_WORDS: '/harmful-words',  //
    TRANSLATE: '/translate',  //
    YOUTUBE_SEARCH: '/youtube/search',
    VIDEO_STARTUP: '/getVideoStartupPage',
    LIBRARY_ADD_URL: '/library/addUrl',
    LIBRARY_GET_META: '/library/getMeta', //
    SEARCH_LIBRARY_WITH_CRITERIAS: '/library/searchWithCriterias',
    GET_LANGUAGES: '/languages',  //
    VIDEO_NOW_PLAYING_UPSERT: '/video/now-playing/upsert',
    VIDEO_NOW_PLAYING_GET: '/video/now-playing',
    BABY_STEPS_GET: '/baby-steps/get',  //
    BABY_STEPS_GET_STEP: '/baby-steps/get-step',  //
    TRANSCRIPT: '/transcript',
    WORD_CATEGORY_BY_ID: '/word-categories', // Added for word categories
    REPORT_WEBSITE: '/report-website', // Added for reporting websites
    STARTUP_DATA: '/startup-data', // Added for startup data
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

// Generic API request function
const apiRequest = async <T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  const url = getApiUrl(endpoint);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`[API] Request failed for ${url}:`, error);
    throw error;
  }
};

// Translation API
export const translateWord = async (
  word: string,
  fromLanguageSymbol: string,
  toLanguageSymbol: string
): Promise<string> => {
  const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.TRANSLATE), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      word,
      fromLanguageSymbol,
      toLanguageSymbol,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation request failed: ${response.status}`);
  }

  const text = await response.text();
  return text.trim();
};

// Baby Steps API
export const getBabySteps = async (language: string): Promise<any> => {
  return apiRequest(API_CONFIG.ENDPOINTS.BABY_STEPS_GET, {
    method: 'POST',
    body: JSON.stringify({ language }),
  });
};

// Get specific baby step
export const getBabyStep = async (language: string, stepId: string): Promise<any> => {
  return apiRequest(API_CONFIG.ENDPOINTS.BABY_STEPS_GET_STEP, {
    method: 'POST',
    body: JSON.stringify({ language, stepId }),
  });
};

// Library API
export const getLibraryMeta = async (): Promise<any> => {
  return apiRequest(API_CONFIG.ENDPOINTS.LIBRARY_GET_META);
};

export const getLanguages = async (): Promise<Array<{ id: number; name: string; symbol: string }>> => {
  return apiRequest(API_CONFIG.ENDPOINTS.GET_LANGUAGES);
};

export const searchLibraryWithCriterias = async (
  languageOrSymbol: string,
  type?: string,
  level?: string,
  media?: string
): Promise<any> => {
  const body: any = {
    languageOrSymbol
  };
  if (type) body.type = type;
  if (level) body.level = level;
  if (media) body.media = media;

  return apiRequest(API_CONFIG.ENDPOINTS.SEARCH_LIBRARY_WITH_CRITERIAS, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const addUrlToLibrary = async (
  url: string,
  type: string,
  level: string,
  name: string,
  language: string,
  media: string = 'web'
): Promise<any> => {
  return apiRequest(API_CONFIG.ENDPOINTS.LIBRARY_ADD_URL, {
    method: 'POST',
    body: JSON.stringify({
      url,
      type,
      level,
      name,
      language,
      media,
    }),
  });
};

// Video API
export const getVideoStartupPage = async (symbol?: string): Promise<any> => {
  return apiRequest(API_CONFIG.ENDPOINTS.VIDEO_STARTUP, {
    method: 'POST',
    body: JSON.stringify({ symbol }),
  });
};

export const upsertVideoNowPlaying = async (
  url: string,
  title: string,
  language: string
): Promise<any> => {
  return apiRequest(API_CONFIG.ENDPOINTS.VIDEO_NOW_PLAYING_UPSERT, {
    method: 'POST',
    body: JSON.stringify({
      url,
      title,
      language,
    }),
  });
};

export const getVideoNowPlaying = async (symbol?: string): Promise<any> => {
  const data = await apiRequest(API_CONFIG.ENDPOINTS.VIDEO_NOW_PLAYING_GET, {
    method: 'POST',
    body: JSON.stringify({ languageSymbol: symbol }),
  });
  return data;
};

export const searchYouTube = async (query: string): Promise<any> => {
  return apiRequest(API_CONFIG.ENDPOINTS.YOUTUBE_SEARCH, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
};

export const getVideoTranscript = async (
  video: string,
  lang: string
): Promise<any> => {
  return apiRequest(API_CONFIG.ENDPOINTS.TRANSCRIPT, {
    method: 'POST',
    body: JSON.stringify({ video, lang }),
  });
};

// Harmful Words API
export const getHarmfulWords = async (): Promise<any> => {
  return apiRequest(API_CONFIG.ENDPOINTS.HARMFUL_WORDS);
};

// Word Categories API
export const getWordCategoryById = async (categoryId: string): Promise<any> => {
  return apiRequest(`${API_CONFIG.ENDPOINTS.WORD_CATEGORY_BY_ID}/${categoryId}`);
};

// Report Website API
export const reportWebsite = async (url: string): Promise<any> => {
  return apiRequest(API_CONFIG.ENDPOINTS.REPORT_WEBSITE, {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
};

// Startup Data API
export const getStartupData = async (): Promise<{ support_email: string }> => {
  return apiRequest(API_CONFIG.ENDPOINTS.STARTUP_DATA);
};

// External APIs (not our server)
export const getYouTubeOembed = async (videoId: string): Promise<any> => {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube oembed request failed: ${response.status}`);
  }
  return response.json();
};

export const getYouTubePage = async (videoId: string): Promise<string> => {
  const url = `https://www.youtube.com/watch?v=${videoId}&hl=en`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube page request failed: ${response.status}`);
  }
  return response.text();
};

export const getMyMemoryTranslation = async (
  word: string,
  fromCode: string,
  toCode: string
): Promise<any> => {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${encodeURIComponent(fromCode)}|${encodeURIComponent(toCode)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MyMemory translation request failed: ${response.status}`);
  }
  return response.json();
};
