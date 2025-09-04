import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAppVersion } from '../utils/appVersion';

// Cache configuration
const CACHE_CONFIG = {
  TTL_WEEKS: 1,
  TTL_MS: 1 * 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
  STORAGE_KEY: 'api_cache',
  VERSION_KEY: 'app_version',
  MAX_CACHE_SIZE: 100, // Maximum number of cached items
} as const;

// Cache entry interface
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  endpoint: string;
  params?: string; // Hash of request parameters
}

// Cache storage interface
interface CacheStorage {
  entries: Map<string, CacheEntry>;
  version: string;
  lastCleanup: number;
}

// Supported cache endpoints
export type CacheableEndpoint = 
  | 'HARMFUL_WORDS'
  | 'TRANSLATE'
  | 'LIBRARY_GET_META'
  | 'GET_LANGUAGES'
  | 'BABY_STEPS_GET'
  | 'BABY_STEPS_GET_STEP';

// Cache service class
class ApiCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private currentVersion: string;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.currentVersion = this.getAppVersion();
  }

  /**
   * Get current app version from package.json
   */
  private getAppVersion(): string {
    return getAppVersion();
  }

  /**
   * Initialize the cache service
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (!this.initPromise) {
      this.initPromise = this.loadCacheFromStorage();
    }
    
    await this.initPromise;
    this.initialized = true;
  }

  /**
   * Load cache from AsyncStorage
   */
  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_CONFIG.STORAGE_KEY);
      if (cachedData) {
        const parsed: CacheStorage = JSON.parse(cachedData);
        
        // Check if app version has changed
        if (parsed.version !== this.currentVersion) {
          console.log('[ApiCache] App version changed, clearing cache');
          this.cache.clear();
          await this.saveCacheToStorage();
          return;
        }

        // Check if cache needs cleanup
        if (Date.now() - parsed.lastCleanup > CACHE_CONFIG.TTL_MS) {
          await this.cleanupExpiredEntries();
        }

        // Load valid entries
        for (const [key, entry] of Object.entries(parsed.entries)) {
          if (this.isEntryValid(entry)) {
            this.cache.set(key, entry);
          }
        }
      }
    } catch (error) {
      console.error('[ApiCache] Failed to load cache from storage:', error);
      this.cache.clear();
    }
  }

  /**
   * Save cache to AsyncStorage
   */
  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheData: CacheStorage = {
        entries: Object.fromEntries(this.cache),
        version: this.currentVersion,
        lastCleanup: Date.now(),
      };
      
      await AsyncStorage.setItem(CACHE_CONFIG.STORAGE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('[ApiCache] Failed to save cache to storage:', error);
    }
  }

  /**
   * Check if a cache entry is still valid
   */
  private isEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return now - entry.timestamp < CACHE_CONFIG.TTL_MS;
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const validEntries = new Map<string, CacheEntry>();

    for (const [key, entry] of this.cache.entries()) {
      if (this.isEntryValid(entry)) {
        validEntries.set(key, entry);
      }
    }

    this.cache = validEntries;
    await this.saveCacheToStorage();
  }

  /**
   * Generate cache key for an endpoint and parameters
   */
  private generateCacheKey(endpoint: CacheableEndpoint, params?: any): string {
    const paramsHash = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramsHash}`;
  }

  /**
   * Get cached data for an endpoint
   */
  async getCachedData<T>(endpoint: CacheableEndpoint, params?: any): Promise<T | null> {
    await this.initialize();
    
    const cacheKey = this.generateCacheKey(endpoint, params);
    const entry = this.cache.get(cacheKey);
    
    if (entry && this.isEntryValid(entry)) {
      console.log(`[ApiCache] Cache hit for ${endpoint}`);
      return entry.data as T;
    }
    
    if (entry && !this.isEntryValid(entry)) {
      // Remove expired entry
      this.cache.delete(cacheKey);
      await this.saveCacheToStorage();
    }
    
    return null;
  }

  /**
   * Set cached data for an endpoint
   */
  async setCachedData<T>(endpoint: CacheableEndpoint, data: T, params?: any): Promise<void> {
    await this.initialize();
    
    const cacheKey = this.generateCacheKey(endpoint, params);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      endpoint,
      params: params ? JSON.stringify(params) : undefined,
    };

    // Remove old entry if it exists
    this.cache.delete(cacheKey);
    
    // Add new entry
    this.cache.set(cacheKey, entry);
    
    // Enforce max cache size
    if (this.cache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    await this.saveCacheToStorage();
    console.log(`[ApiCache] Cached data for ${endpoint}`);
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    await this.saveCacheToStorage();
    console.log('[ApiCache] Cache cleared');
  }

  /**
   * Clear cache for a specific endpoint
   */
  async clearEndpointCache(endpoint: CacheableEndpoint): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.endpoint === endpoint) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    await this.saveCacheToStorage();
    console.log(`[ApiCache] Cache cleared for ${endpoint}`);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    size: number;
    lastCleanup: number;
    version: string;
  }> {
    await this.initialize();
    
    return {
      totalEntries: this.cache.size,
      size: this.cache.size,
      lastCleanup: Date.now(),
      version: this.currentVersion,
    };
  }

  /**
   * Force cleanup of expired entries
   */
  async forceCleanup(): Promise<void> {
    await this.cleanupExpiredEntries();
  }
}

// Export singleton instance
export const apiCacheService = new ApiCacheService();

// Export types for external use
export type { CacheableEndpoint, CacheEntry };
