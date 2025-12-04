import React from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import * as RNFS from 'react-native-fs';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { fetchTranslation as fetchTranslationCommon } from '../utils/translation';
import { parseYandexImageUrlsFromHtml, fetchImageUrls as fetchImageUrlsCommon, type ImageScrapeCallbacks } from '../screens/practice/common';
import TranslationPanel, { type TranslationPanelState } from '../components/TranslationPanel';
import { useLoginGate } from '../contexts/LoginGateContext';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from './useTranslation';
import { createAndSaveWord } from '../services/wordService';
import { cleanWordForTranslation } from '../common';

export const useTranslationAndImages = (
  learningLanguage: string | null,
  nativeLanguage: string | null,
  imageScrape: { url: string; word: string } | null,
  setImageScrape: React.Dispatch<React.SetStateAction<{ url: string; word: string } | null>>,
  imageScrapeResolveRef: React.MutableRefObject<((urls: string[]) => void) | null>,
  imageScrapeRejectRef: React.MutableRefObject<((err?: unknown) => void) | null>,
  languageMappings: Record<string, string> = {},
) => {
  const [translationPanel, setTranslationPanel] = React.useState<TranslationPanelState | null>(null);
  const { showLoginGate } = useLoginGate();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const extractClauseAroundWord = (sentence: string | undefined, word: string): string | undefined => {
    if (!sentence) return undefined;
    const lowerSentence = sentence.toLowerCase();
    const lowerWord = word.toLowerCase();
    const index = lowerSentence.indexOf(lowerWord);

    if (index === -1) return undefined;

    let start = index;
    while (start > 0 && !['.', ','].includes(sentence[start - 1])) {
      start--;
    }

    let end = index + lowerWord.length;
    while (end < sentence.length && !['.', ','].includes(sentence[end])) {
      end++;
    }

    return sentence.slice(start, end).trim();
  };

  const openPanel = (word: string, sentence?: string) => {
    // Remove spaces and special characters from the beginning and end
    // This removes punctuation and symbols while preserving letters and numbers (including Unicode)
    const cleanedWord = cleanWordForTranslation(word);
    const clause = extractClauseAroundWord(sentence, cleanedWord);
    setTranslationPanel({ word: cleanedWord, translation: '', sentence: clause, images: [], imagesLoading: true, translationLoading: true });
    fetchTranslation(cleanedWord)
      .then((t) => {
        setTranslationPanel(prev => (prev && prev.word === cleanedWord ? { ...prev, translation: t || prev.translation, translationLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel(prev => (prev && prev.word === cleanedWord ? { ...prev, translationLoading: false } : prev));
      });
    fetchImageUrls(cleanedWord)
      .then((imgs) => {
        setTranslationPanel(prev => (prev && prev.word === cleanedWord ? { ...prev, images: imgs, imagesLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel(prev => (prev && prev.word === cleanedWord ? { ...prev, images: [], imagesLoading: false } : prev));
      });
  };

  const saveCurrentWord = async () => {
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
  };

  const fetchTranslation = async (word: string): Promise<string> => 
    fetchTranslationCommon(word, learningLanguage, nativeLanguage, languageMappings);

  const fetchImageUrls = async (word: string): Promise<string[]> => {
    if (imageScrape) {
      return [];
    }
    
    const callbacks: ImageScrapeCallbacks = {
      onImageScrapeStart: (url: string, word: string) => {
        setImageScrape({ url, word });
      },
      onImageScrapeComplete: (urls: string[]) => {
        imageScrapeResolveRef.current?.(urls);
        imageScrapeResolveRef.current = null;
        imageScrapeRejectRef.current = null;
        setImageScrape(null);
      },
      onImageScrapeError: () => {
        imageScrapeResolveRef.current?.([]);
        imageScrapeResolveRef.current = null;
        imageScrapeRejectRef.current = null;
        setImageScrape(null);
      }
    };

    return new Promise<string[]>((resolve, reject) => {
      imageScrapeResolveRef.current = resolve;
      imageScrapeRejectRef.current = reject;
      
      fetchImageUrlsCommon(word, callbacks);
    }).catch(() => [] as string[]);
  };

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'pointerdown') {
        if (translationPanel) setTranslationPanel(null);
        return;
      }
      const sentence = typeof data.sentence === 'string' ? extractClauseAroundWord(data.sentence, data.word) : undefined;
      if ((data?.type === 'wordClick' || data?.type === 'longpress' || data?.type === 'selection') && typeof data.word === 'string' && data.word.length > 0) {
        openPanel(data.word, sentence || undefined);
      }
      if (data?.type === 'linkClick') {
        if (Platform.OS === 'android') {
          try { ToastAndroid.show(t('screens.surf.longPressToSelectWord'), ToastAndroid.SHORT); } catch (e) {}
        }
      }
    } catch {
      // ignore malformed messages
    }
  };

  const onScrapeMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'imageScrapeUrls' && Array.isArray(data.urls)) {
        const urls: string[] = (data.urls as unknown[])
          .map((u) => (typeof u === 'string' ? u : ''))
          .filter((u) => !!u)
          .slice(0, 6);
        imageScrapeResolveRef.current?.(urls);
        imageScrapeResolveRef.current = null;
        imageScrapeRejectRef.current = null;
        setImageScrape(null);
        return;
      }
      if (data && data.type === 'imageScrapeHtml' && typeof data.html === 'string') {
        const urls = parseYandexImageUrlsFromHtml(data.html);
        imageScrapeResolveRef.current?.(urls);
        imageScrapeResolveRef.current = null;
        imageScrapeRejectRef.current = null;
        setImageScrape(null);
      }
    } catch {
      imageScrapeResolveRef.current?.([]);
      imageScrapeResolveRef.current = null;
      imageScrapeRejectRef.current = null;
      setImageScrape(null);
    }
  };

  // Auto-fetch images when word changes (translation is handled in openPanel)
  React.useEffect(() => {
    if (translationPanel && translationPanel.word && translationPanel.imagesLoading) {
      // Only fetch images here, translation is already handled in openPanel
      fetchImageUrls(translationPanel.word)
        .then((imgs) => {
          setTranslationPanel(prev => (prev && prev.word === translationPanel.word ? 
            { ...prev, images: imgs, imagesLoading: false } : prev));
        })
        .catch(() => {
          setTranslationPanel(prev => (prev && prev.word === translationPanel.word ? 
            { ...prev, images: [], imagesLoading: false } : prev));
        });
    }
  }, [translationPanel?.word, translationPanel?.imagesLoading, fetchImageUrls, setTranslationPanel]);

  return {
    translationPanel,
    setTranslationPanel,
    openPanel,
    saveCurrentWord,
    onMessage,
    onScrapeMessage,
  };
};
