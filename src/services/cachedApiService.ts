import { apiCacheService, type CacheableEndpoint } from './apiCacheService';
import {
  getHarmfulWords,
  translateWord,
  getLibraryMeta,
  getLanguages,
  getBabySteps,
  getBabyStep,
  getWordCategoryById,
} from '../config/api';
import { getApiUrl, SERVER_CONFIG } from '../config/server';

// Cached API service class
class CachedApiService {
  /**
   * Get harmful words with caching
   */
  async getHarmfulWords(): Promise<string[]> {
    const cacheKey: CacheableEndpoint = 'HARMFUL_WORDS';
    
    // Try to get from cache first
    const cached = await apiCacheService.getCachedData<string[]>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Fetch from API if not cached
    try {
      const data = await getHarmfulWords();
      
      // Cache the response
      await apiCacheService.setCachedData(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('[CachedApi] Failed to fetch harmful words:', error);
      throw error;
    }
  }

  /**
   * Translate word with caching
   */
  async translateWord(
    word: string,
    fromLanguageSymbol: string,
    toLanguageSymbol: string
  ): Promise<string> {
    const cacheKey: CacheableEndpoint = 'TRANSLATE';
    const params = { word, fromLanguageSymbol, toLanguageSymbol };
    
    // Try to get from cache first
    const cached = await apiCacheService.getCachedData<string>(cacheKey, params);
    if (cached) {
      return cached;
    }
    
    // Fetch from API if not cached
    try {
      const data = await translateWord(word, fromLanguageSymbol, toLanguageSymbol);
      
      // Cache the response
      await apiCacheService.setCachedData(cacheKey, data, params);
      
      return data;
    } catch (error) {
      console.error('[CachedApi] Failed to translate word:', error);
      throw error;
    }
  }

  /**
   * Get library metadata with caching
   */
  async getLibraryMeta(): Promise<any> {
    const cacheKey: CacheableEndpoint = 'LIBRARY_GET_META';
    
    // Try to get from cache first
    const cached = await apiCacheService.getCachedData<any>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Fetch from API if not cached
    try {
      const data = await getLibraryMeta();
      
      // Cache the response
      await apiCacheService.setCachedData(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('[CachedApi] Failed to fetch library metadata:', error);
      throw error;
    }
  }

  /**
   * Get languages with caching
   */
  async getLanguages(): Promise<Array<{ id: number; name: string; symbol: string }>> {
    const cacheKey: CacheableEndpoint = 'GET_LANGUAGES';
    
    // Try to get from cache first
    const cached = await apiCacheService.getCachedData<Array<{ id: number; name: string; symbol: string }>>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Fetch from API if not cached
    try {
      const data = await getLanguages();
      
      // Cache the response
      await apiCacheService.setCachedData(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('[CachedApi] Failed to fetch languages:', error);
      throw error;
    }
  }

  /**
   * Get baby steps with caching
   */
  async getBabySteps(language: string): Promise<any> {
    const cacheKey: CacheableEndpoint = 'BABY_STEPS_GET';
    const params = { language };
    
    // Try to get from cache first
    const cached = await apiCacheService.getCachedData<any>(cacheKey, params);
    if (cached) {
      return cached;
    }
    
    // Fetch from API if not cached
    try {
      const data = await getBabySteps(language);
      
      // Cache the response
      await apiCacheService.setCachedData(cacheKey, data, params);
      
      return data;
    } catch (error) {
      console.error('[CachedApi] Failed to fetch baby steps:', error);
      throw error;
    }
  }

  /**
   * Get specific baby step with caching
   */
  async getBabyStep(language: string, stepId: string): Promise<any> {
    const cacheKey: CacheableEndpoint = 'BABY_STEPS_GET_STEP';
    const params = { language, stepId };
    
    // Try to get from cache first
    const cached = await apiCacheService.getCachedData<any>(cacheKey, params);
    if (cached) {
      return cached;
    }
    
    // Fetch from API if not cached
    try {
      const data = await getBabyStep(language, stepId);
      
      // Cache the response
      await apiCacheService.setCachedData(cacheKey, data, params);
      
      return data;
    } catch (error) {
      console.error('[CachedApi] Failed to fetch baby step:', error);
      throw error;
    }
  }

  /**
   * Get word categories with caching
   */
  async getWordCategories(): Promise<any> {
    const cacheKey: CacheableEndpoint = 'WORD_CATEGORIES';
    
    // Try to get from cache first
    const cached = await apiCacheService.getCachedData<any>(cacheKey);
    if (cached) {
      console.log('[CachedApi] Word categories loaded from cache');
      console.log('[CachedApi] Cached data structure:', cached);
      console.log('[CachedApi] Cached categories array:', cached?.categories);
      return cached;
    }
    
    // Fetch from API if not cached
    try {
      const url = getApiUrl(SERVER_CONFIG.ENDPOINTS.WORD_CATEGORIES);
      console.log('[CachedApi] Fetching word categories from server:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[CachedApi] Word categories data received from server:', data);
      console.log('[CachedApi] Data type:', typeof data);
      console.log('[CachedApi] Data keys:', Object.keys(data));
      console.log('[CachedApi] Categories array:', data?.categories);
      console.log('[CachedApi] Categories array type:', typeof data?.categories);
      console.log('[CachedApi] Categories is array:', Array.isArray(data?.categories));
      
      // Validate the data structure before caching
      if (!data || !data.categories || !Array.isArray(data.categories)) {
        console.error('[CachedApi] Invalid data structure received from server:', data);
        throw new Error('Invalid data structure received from server');
      }
      
      // Cache the response
      await apiCacheService.setCachedData(cacheKey, data);
      console.log('[CachedApi] Word categories data cached for 1 week');
      
      return data;
    } catch (error) {
      console.error('[CachedApi] Failed to fetch word categories:', error);
      throw error;
    }
  }

  /**
   * Get word category by ID with caching
   */
  async getWordCategoryById(id: string): Promise<any> {
    const cacheKey: CacheableEndpoint = 'WORD_CATEGORY_BY_ID';
    const params = { id };

    // // Try to get from cache first
    // const cached = await apiCacheService.getCachedData<any>(cacheKey, params);
    // if (cached) {
    //   return cached;
    // }

    // Fetch from API if not cached
    try {
      const data = await getWordCategoryById(id);

      // Cache the response
      await apiCacheService.setCachedData(cacheKey, data, params);

      return data;
    } catch (error) {
      console.error('[CachedApi] Failed to fetch word category by ID:', error);
      throw error;
    }
  }

  /**
   * Clear cache for a specific endpoint
   */
  async clearEndpointCache(endpoint: CacheableEndpoint): Promise<void> {
    await apiCacheService.clearEndpointCache(endpoint);
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    await apiCacheService.clearCache();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await apiCacheService.getCacheStats();
  }

  /**
   * Force cleanup of expired entries
   */
  async forceCleanup(): Promise<void> {
    await apiCacheService.forceCleanup();
  }

  /**
   * Clear word categories cache specifically
   */
  async clearWordCategoriesCache(): Promise<void> {
    await apiCacheService.clearEndpointCache('WORD_CATEGORIES');
  }
}

// Export singleton instance
export const cachedApiService = new CachedApiService();

// Export types for external use
export type { CacheableEndpoint };
