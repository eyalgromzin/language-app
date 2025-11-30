import React from 'react';
import type { TranslationPanelState } from '../../../components/TranslationPanel';
import { fetchTranslation as fetchTranslationCommon } from '../../../utils/translation';
import { createAndSaveWord } from '../../../services/wordService';

type UseTranslationPanelOptions = {
  learningLanguage?: string | null;
  nativeLanguage?: string | null;
  languageMappings: any;
  showLoginGate: () => void;
  isAuthenticated: boolean;
  fetchImageUrls: (word: string) => Promise<string[]>;
};

export const useTranslationPanel = ({
  learningLanguage,
  nativeLanguage,
  languageMappings,
  showLoginGate,
  isAuthenticated,
  fetchImageUrls,
}: UseTranslationPanelOptions) => {
  const [translationPanel, setTranslationPanel] = React.useState<TranslationPanelState | null>(null);
  const [selectedWordKey, setSelectedWordKey] = React.useState<string | null>(null);

  const fetchTranslation = React.useCallback(
    async (word: string): Promise<string> => 
      fetchTranslationCommon(word, learningLanguage, nativeLanguage, languageMappings),
    [learningLanguage, nativeLanguage, languageMappings]
  );

  const openPanel = React.useCallback((word: string, sentence?: string) => {
    setTranslationPanel({ word, translation: '', sentence, images: [], imagesLoading: true, translationLoading: true });
    fetchTranslation(word)
      .then((t) => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, translation: t || prev.translation, translationLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, translationLoading: false } : prev));
      });
    fetchImageUrls(word)
      .then((imgs) => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, images: imgs, imagesLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, images: [], imagesLoading: false } : prev));
      });
  }, [fetchTranslation, fetchImageUrls]);

  const saveCurrentWord = React.useCallback(async () => {
    if (!translationPanel) return;
    
    await createAndSaveWord(
      translationPanel.word,
      translationPanel.translation,
      translationPanel.sentence || '',
      {
        checkAuthentication: true,
        showLoginGate,
        isAuthenticated,
        incrementWordCount: 'incrementTranslationsSaved',
        duplicateCheckMode: 'wordAndSentence',
        showMessages: false,
      }
    );
  }, [translationPanel, showLoginGate, isAuthenticated]);

  const closePanel = React.useCallback(() => {
    setTranslationPanel(null);
    setSelectedWordKey(null);
  }, []);

  return {
    translationPanel,
    selectedWordKey,
    setSelectedWordKey,
    openPanel,
    saveCurrentWord,
    closePanel,
  };
};

