import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { WordCategoryType } from '../types/words';
import { getApiUrl, SERVER_CONFIG } from '../config/server';

type CategoriesData = {
  languages: string[];
  categories: WordCategoryType[];
};

interface WordCategoriesContextType {
  categoriesData: CategoriesData | null;
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
}

const WordCategoriesContext = createContext<WordCategoriesContextType | undefined>(undefined);

interface WordCategoriesProviderProps {
  children: ReactNode;
}

export const WordCategoriesProvider: React.FC<WordCategoriesProviderProps> = ({ children }) => {
  const [categoriesData, setCategoriesData] = useState<CategoriesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(getApiUrl(SERVER_CONFIG.ENDPOINTS.WORD_CATEGORIES));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCategoriesData(data);
    } catch (err) {
      console.error('Failed to fetch word categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load word categories');
    } finally {
      setLoading(false);
    }
  };

  const refreshCategories = async (): Promise<void> => {
    await fetchCategories();
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const value: WordCategoriesContextType = {
    categoriesData,
    loading,
    error,
    refreshCategories,
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
