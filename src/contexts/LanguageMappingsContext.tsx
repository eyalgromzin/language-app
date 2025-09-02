import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getLanguages } from '../config/api';

interface LanguageMapping {
  id: number;
  name: string;
  symbol: string;
}

interface LanguageMappingsContextType {
  languageMappings: Record<string, string>; // name -> symbol mapping
  isLoading: boolean;
  error: string | null;
  refreshMappings: () => Promise<void>;
}

const LanguageMappingsContext = createContext<LanguageMappingsContextType | undefined>(undefined);

export const useLanguageMappings = () => {
  const context = useContext(LanguageMappingsContext);
  if (context === undefined) {
    throw new Error('useLanguageMappings must be used within a LanguageMappingsProvider');
  }
  return context;
};

interface LanguageMappingsProviderProps {
  children: ReactNode;
}

export const LanguageMappingsProvider: React.FC<LanguageMappingsProviderProps> = ({ children }) => {
  const [languageMappings, setLanguageMappings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLanguages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const languages = await getLanguages();
      
      // Convert array to name -> symbol mapping
      const mappings: Record<string, string> = {};
      languages.forEach(lang => {
        mappings[lang.name] = lang.symbol;
      });
      
      setLanguageMappings(mappings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch languages');
      console.error('Failed to fetch languages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMappings = async () => {
    await fetchLanguages();
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const value: LanguageMappingsContextType = {
    languageMappings,
    isLoading,
    error,
    refreshMappings,
  };

  return (
    <LanguageMappingsContext.Provider value={value}>
      {children}
    </LanguageMappingsContext.Provider>
  );
};
