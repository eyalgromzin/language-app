import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { languagesService } from '../services/languages';

interface LanguageState {
  learningLanguage: string | null;
  nativeLanguage: string | null;
  isLoading: boolean;
}

interface LanguageContextType extends LanguageState {
  setLearningLanguage: (language: string | null) => Promise<void>;
  setNativeLanguage: (language: string | null) => Promise<void>;
  refreshLanguages: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [languageState, setLanguageState] = useState<LanguageState>({
    learningLanguage: null,
    nativeLanguage: null,
    isLoading: true,
  });

  const loadLanguages = async (): Promise<void> => {
    try {
      setLanguageState(prev => ({ ...prev, isLoading: true }));
      
      const entries = await AsyncStorage.multiGet([
        'language.learning',
        'language.native',
      ]);
      
      const map = Object.fromEntries(entries);
      const learningRaw = map['language.learning'];
      const nativeRaw = map['language.native'];
      
      // Convert stored symbols to display names
      let learningVal = null;
      let nativeVal = null;
      
      if (typeof learningRaw === 'string' && learningRaw.trim().length > 0) {
        try {
          const language = await languagesService.getLanguageBySymbol(learningRaw);
          learningVal = language?.name ? language.name.charAt(0).toUpperCase() + language.name.slice(1) : learningRaw;
        } catch (error) {
          console.error('Error fetching learning language:', error);
          learningVal = learningRaw;
        }
      }
      
      if (typeof nativeRaw === 'string' && nativeRaw.trim().length > 0) {
        try {
          const language = await languagesService.getLanguageBySymbol(nativeRaw);
          nativeVal = language?.name ? language.name.charAt(0).toUpperCase() + language.name.slice(1) : nativeRaw;
        } catch (error) {
          console.error('Error fetching native language:', error);
          nativeVal = nativeRaw;
        }
      }
      
      setLanguageState({
        learningLanguage: learningVal,
        nativeLanguage: nativeVal,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading languages:', error);
      setLanguageState({
        learningLanguage: null,
        nativeLanguage: null,
        isLoading: false,
      });
    }
  };

  const setLearningLanguage = async (language: string | null): Promise<void> => {
    try {
      if (language) {
        // Find the language by display name and store the symbol
        const languageObj = await languagesService.getLanguageByName(language);
        const symbolToStore = languageObj?.symbol || language;
        await AsyncStorage.setItem('language.learning', symbolToStore);
      } else {
        await AsyncStorage.removeItem('language.learning');
      }
      
      // Update local state immediately
      setLanguageState(prev => ({
        ...prev,
        learningLanguage: language,
      }));
    } catch (error) {
      console.error('Error setting learning language:', error);
    }
  };

  const setNativeLanguage = async (language: string | null): Promise<void> => {
    try {
      if (language) {
        // Find the language by display name and store the symbol
        const languageObj = await languagesService.getLanguageByName(language);
        const symbolToStore = languageObj?.symbol || language;
        await AsyncStorage.setItem('language.native', symbolToStore);
      } else {
        await AsyncStorage.removeItem('language.native');
      }
      
      // Update local state immediately
      setLanguageState(prev => ({
        ...prev,
        nativeLanguage: language,
      }));
    } catch (error) {
      console.error('Error setting native language:', error);
    }
  };

  const refreshLanguages = async (): Promise<void> => {
    await loadLanguages();
  };

  // Load languages on mount
  useEffect(() => {
    loadLanguages();
  }, []);

  const contextValue: LanguageContextType = {
    ...languageState,
    setLearningLanguage,
    setNativeLanguage,
    refreshLanguages,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
