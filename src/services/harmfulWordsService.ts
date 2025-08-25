import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_CONFIG } from '../config/api';

const HARMFUL_WORDS_KEY = 'harmful.words';
const HARMFUL_WORDS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface HarmfulWordsCache {
  words: string[];
  timestamp: number;
}

class HarmfulWordsService {
  private cachedWords: string[] = [];
  private lastFetchTime: number = 0;

  async getHarmfulWords(): Promise<string[]> {
    try {
      console.log('[HarmfulWords] Starting getHarmfulWords...');
      
      // Check if we have cached words and they're still valid
      const cached = await this.getCachedWords();
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log('[HarmfulWords] Using cached words, cache is still valid');
        this.cachedWords = cached.words;
        return this.cachedWords;
      }

      console.log('[HarmfulWords] Cache invalid or missing, fetching from server...');
      console.log('[HarmfulWords] API URL:', getApiUrl(API_CONFIG.ENDPOINTS.HARMFUL_WORDS));
      
      // Fetch from server
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HARMFUL_WORDS));
      console.log('[HarmfulWords] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const words = await response.json();
      console.log('[HarmfulWords] Received words from server:', words.length, 'words');
      this.cachedWords = words;
      this.lastFetchTime = Date.now();

      // Cache the words
      await this.cacheWords(words);
      console.log('[HarmfulWords] Words cached successfully');

      return words;
    } catch (error) {
      console.error('[HarmfulWords] Failed to fetch harmful words:', error);
      
      // Return cached words if available, even if expired
      const cached = await this.getCachedWords();
      if (cached) {
        console.log('[HarmfulWords] Using expired cached words as fallback');
        this.cachedWords = cached.words;
        return cached.words;
      }

      console.log('[HarmfulWords] No cached words available, returning empty array');
      // Return empty array as fallback
      return [];
    }
  }

  async checkUrl(url: string): Promise<{ isHarmful: boolean; matchedWords: string[] }> {
    try {
      const words = await this.getHarmfulWords();
      const lowerUrl = url.toLowerCase();
      const matchedWords = words.filter(word => lowerUrl.includes(word.toLowerCase()));

      return {
        isHarmful: matchedWords.length > 0,
        matchedWords
      };
    } catch (error) {
      console.error('Failed to check URL:', error);
      return {
        isHarmful: false,
        matchedWords: []
      };
    }
  }

  async refreshWords(): Promise<string[]> {
    // Clear cache and fetch fresh data
    await AsyncStorage.removeItem(HARMFUL_WORDS_KEY);
    this.cachedWords = [];
    this.lastFetchTime = 0;
    
    return this.getHarmfulWords();
  }

  private async getCachedWords(): Promise<HarmfulWordsCache | null> {
    try {
      const cached = await AsyncStorage.getItem(HARMFUL_WORDS_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Failed to get cached words:', error);
      return null;
    }
  }

  private async cacheWords(words: string[]): Promise<void> {
    try {
      const cache: HarmfulWordsCache = {
        words,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(HARMFUL_WORDS_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to cache words:', error);
    }
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < HARMFUL_WORDS_CACHE_DURATION;
  }

  // Method to update server URL (useful for different environments)
  setServerUrl(url: string): void {
    // This method is kept for backward compatibility
    // The server URL is now managed through the API config
    console.warn('setServerUrl is deprecated. Use updateServerUrl from config/api instead.');
  }
}

export const harmfulWordsService = new HarmfulWordsService();
export default harmfulWordsService;
