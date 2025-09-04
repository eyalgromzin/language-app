import { useState, useEffect, useCallback } from 'react';
import { cachedApiService, type CacheableEndpoint } from '../services/cachedApiService';

// Hook return type
interface UseCachedApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearCache: () => Promise<void>;
}

// Hook options
interface UseCachedApiOptions {
  autoFetch?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for using cached API endpoints
 * @param endpoint The cacheable endpoint to use
 * @param params Parameters for the API call (optional)
 * @param options Hook options
 * @returns Object with data, loading state, error, and utility functions
 */
export function useCachedApi<T>(
  endpoint: CacheableEndpoint,
  params?: any,
  options: UseCachedApiOptions = {}
): UseCachedApiReturn<T> {
  const { autoFetch = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result: T;
      
      switch (endpoint) {
        case 'HARMFUL_WORDS':
          result = await cachedApiService.getHarmfulWords() as T;
          break;
          
        case 'TRANSLATE':
          if (!params?.word || !params?.fromLanguageSymbol || !params?.toLanguageSymbol) {
            throw new Error('Missing required parameters for translation');
          }
          result = await cachedApiService.translateWord(
            params.word,
            params.fromLanguageSymbol,
            params.toLanguageSymbol
          ) as T;
          break;
          
        case 'LIBRARY_GET_META':
          result = await cachedApiService.getLibraryMeta() as T;
          break;
          
        case 'GET_LANGUAGES':
          result = await cachedApiService.getLanguages() as T;
          break;
          
        case 'BABY_STEPS_GET':
          if (!params?.language) {
            throw new Error('Missing language parameter for baby steps');
          }
          result = await cachedApiService.getBabySteps(params.language) as T;
          break;
          
        case 'BABY_STEPS_GET_STEP':
          if (!params?.language || !params?.stepId) {
            throw new Error('Missing required parameters for baby step');
          }
          result = await cachedApiService.getBabyStep(params.language, params.stepId) as T;
          break;
          
        default:
          throw new Error(`Unsupported endpoint: ${endpoint}`);
      }
      
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [endpoint, params, onSuccess, onError]);

  // Clear cache function
  const clearCache = useCallback(async () => {
    try {
      await cachedApiService.clearEndpointCache(endpoint);
      setData(null);
      setError(null);
    } catch (err) {
      console.error('[useCachedApi] Failed to clear cache:', err);
    }
  }, [endpoint]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache,
  };
}

/**
 * Hook for harmful words with caching
 */
export function useHarmfulWords() {
  return useCachedApi<string[]>('HARMFUL_WORDS');
}

/**
 * Hook for translation with caching
 */
export function useTranslation(
  word: string,
  fromLanguage: string,
  toLanguage: string,
  autoFetch = true
) {
  return useCachedApi<string>('TRANSLATE', { word, fromLanguageSymbol: fromLanguage, toLanguageSymbol: toLanguage }, { autoFetch });
}

/**
 * Hook for library metadata with caching
 */
export function useLibraryMeta() {
  return useCachedApi<any>('LIBRARY_GET_META');
}

/**
 * Hook for languages with caching
 */
export function useLanguages() {
  return useCachedApi<Array<{ id: number; name: string; symbol: string }>>('GET_LANGUAGES');
}

/**
 * Hook for baby steps with caching
 */
export function useBabySteps(language: string) {
  return useCachedApi<any>('BABY_STEPS_GET', { language });
}

/**
 * Hook for specific baby step with caching
 */
export function useBabyStep(language: string, stepId: string) {
  return useCachedApi<any>('BABY_STEPS_GET_STEP', { language, stepId });
}

// Export the main hook and specific hooks
export default useCachedApi;
