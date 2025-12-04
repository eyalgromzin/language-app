import { useState, useCallback } from 'react';
import { Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTranslation as fetchTranslationCommon } from '../../../utils/translation';
import { createAndSaveWord } from '../../../services/wordService';
import { cleanWordForTranslation } from '../../../common';
import type { TranslationPanelState } from '../../../components/TranslationPanel';
import type { ImageScrapeCallbacks } from '../../practice/common';

type UseBookTranslationParams = {
  languageMappings: any;
  fetchImageUrls: (word: string) => Promise<string[]>;
  showLoginGate: () => void;
  isAuthenticated: boolean;
};

export function useBookTranslation({
  languageMappings,
  fetchImageUrls,
  showLoginGate,
  isAuthenticated,
}: UseBookTranslationParams) {
  const [translationPanel, setTranslationPanel] = useState<TranslationPanelState | null>(null);

  const fetchTranslation = useCallback(async (word: string): Promise<string> => {
    const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);
    const map = Object.fromEntries(entries);
    const learningRaw = map['language.learning'];
    const nativeRaw = map['language.native'];
    return await fetchTranslationCommon(word, learningRaw, nativeRaw, languageMappings);
  }, [languageMappings]);

  const openPanel = useCallback((word: string, sentence?: string) => {
    // Remove spaces and special characters from the beginning and end
    // This removes punctuation and symbols while preserving letters and numbers (including Unicode)
    const cleanedWord = cleanWordForTranslation(word);
    // Capitalize first letter for translation search
    const capitalizedWord = cleanedWord.length > 0 
      ? cleanedWord.charAt(0).toUpperCase() + cleanedWord.slice(1)
      : cleanedWord;
    setTranslationPanel({ word: cleanedWord, translation: '', sentence, images: [], imagesLoading: true, translationLoading: true });
    fetchTranslation(capitalizedWord)
      .then((translation) => {
        setTranslationPanel((prev) => (prev && prev.word === cleanedWord ? { ...prev, translation: translation || prev.translation, translationLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel((prev) => (prev && prev.word === cleanedWord ? { ...prev, translationLoading: false } : prev));
      });
    fetchImageUrls(cleanedWord)
      .then((imgs) => {
        setTranslationPanel((prev) => (prev && prev.word === cleanedWord ? { ...prev, images: imgs, imagesLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel((prev) => (prev && prev.word === cleanedWord ? { ...prev, images: [], imagesLoading: false } : prev));
      });
  }, [fetchTranslation, fetchImageUrls]);

  const handleWebViewMessage = useCallback((payload: any) => {
    try {
      // The Reader component already parses WebView messages and passes the object here.
      let data: any = payload;
      if (!data || typeof data !== 'object') {
        const raw = payload?.nativeEvent?.data;
        data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
      if (data && (data.type === 'readerTouchStart' || data.__READER_TOUCH_START__ === true)) {
        Keyboard.dismiss();
        setTranslationPanel(null);
        return;
      }
      if (data && data.type === 'wordTap' && data.word) {
        const w: string = String(data.word);
        const s: string | undefined = typeof data.sentence === 'string' ? data.sentence : undefined;
        openPanel(w, s);
        return;
      }
    } catch {}
  }, [openPanel]);

  const saveCurrentWord = useCallback(async () => {
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
        showMessages: true,
      }
    );
  }, [translationPanel, showLoginGate, isAuthenticated]);

  return {
    translationPanel,
    setTranslationPanel,
    openPanel,
    handleWebViewMessage,
    saveCurrentWord,
  };
}
