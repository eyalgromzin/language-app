import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { WordCategoryType } from '../types/words';
import { cachedApiService } from '../services/cachedApiService';

type CategoriesData = {
  languages: string[];
  categories: WordCategoryType[];
};

interface WordCategoriesContextType {
  categoriesData: CategoriesData | null;
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
  refreshCategories: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const WordCategoriesContext = createContext<WordCategoriesContextType | undefined>(undefined);

interface WordCategoriesProviderProps {
  children: ReactNode;
}

export const WordCategoriesProvider: React.FC<WordCategoriesProviderProps> = ({ children }) => {
  const [categoriesData, setCategoriesData] = useState<CategoriesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  const fetchCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching word categories with caching...');
      
      const data = await cachedApiService.getWordCategories();
      console.log('Word categories data received:', data);
      console.log('Data type:', typeof data);
      console.log('Data keys:', data ? Object.keys(data) : 'null');
      console.log('Categories array:', data?.categories);
      console.log('Categories array type:', typeof data?.categories);
      console.log('Categories is array:', Array.isArray(data?.categories));
      console.log('Number of categories:', data?.categories?.length || 0);
      
      // Validate the data structure
      if (!data || !data.categories || !Array.isArray(data.categories)) {
        console.error('Invalid categories data structure:', data);
        setError('Invalid data structure received from server');
        setCategoriesData(null);
        return;
      }
      
      setCategoriesData(data);
      // For now, we'll assume it's not from cache on first load
      // The cache status will be more accurate in subsequent calls
      setIsFromCache(false);
    } catch (err) {
      console.error('Failed to fetch word categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load word categories');
      setCategoriesData(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async (): Promise<void> => {
    // Clear cache to force fresh data
    await clearCache();
    await fetchCategories();
  };

  const clearCache = async (): Promise<void> => {
    try {
      await cachedApiService.clearWordCategoriesCache();
      console.log('Word categories cache cleared');
    } catch (err) {
      console.error('Failed to clear word categories cache:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const value: WordCategoriesContextType = {
    categoriesData,
    loading,
    error,
    isFromCache,
    refreshCategories,
    clearCache,
  };

  return (
    <WordCategoriesContext.Provider value={value}>
      {children}
    </WordCategoriesContext.Provider>
  );
};

export const useWordCategories = (): WordCategoriesContextType => {
  const context = useContext(WordCategoriesContext);
  if (context === undefined) {
    throw new Error('useWordCategories must be used within a WordCategoriesProvider');
  }
  return context;
};
