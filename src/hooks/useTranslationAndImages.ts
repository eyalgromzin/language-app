import React from 'react';
import { Alert, Platform, ToastAndroid } from 'react-native';
import * as RNFS from 'react-native-fs';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { fetchTranslation as fetchTranslationCommon } from '../utils/translation';
import { parseYandexImageUrlsFromHtml, fetchImageUrls as fetchImageUrlsCommon, type ImageScrapeCallbacks } from '../screens/practice/common';
import TranslationPanel, { type TranslationPanelState } from '../components/TranslationPanel';
import { useLoginGate } from '../contexts/LoginGateContext';
import { useAuth } from '../contexts/AuthContext';
import wordCountService from '../services/wordCountService';

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
    const clause = extractClauseAroundWord(sentence, word);
    setTranslationPanel({ word, translation: '', sentence: clause, images: [], imagesLoading: true, translationLoading: true });
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
  };

  const saveCurrentWord = async () => {
    if (!translationPanel) return;
    
    // Check if user is authenticated, if not, check word count and show login gate
    if (!isAuthenticated) {
      await wordCountService.initialize();
      const currentCount = wordCountService.getWordCount();
      
      // Show login gate if this would be the 3rd word (after saving, count would be 3)
      if (currentCount.totalWordsAdded >= 2) {
        showLoginGate();
        return;
      }
    }

    const entry = {
      word: translationPanel.word,
      translation: translationPanel.translation,
      sentence: translationPanel.sentence || '',
      addedAt: new Date().toISOString(),
      numberOfCorrectAnswers: {
        missingLetters: 0,
        missingWords: 0,
        chooseTranslation: 0,
        chooseWord: 0,
        memoryGame: 0,
        writeTranslation: 0,
        writeWord: 0,
      },
    } as const;

    const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;
    try {
      let current: unknown = [];
      try {
        const content = await RNFS.readFile(filePath, 'utf8');
        current = JSON.parse(content);
      } catch {
        current = [];
      }
      const arr = Array.isArray(current) ? current : [];

      const normalize = (it: any) => {
        const base = it && typeof it === 'object' ? it : {};
        const noa = (base as any).numberOfCorrectAnswers || {};
        const safeNoa = {
          missingLetters: Math.max(0, Number(noa.missingLetters) || 0),
          missingWords: Math.max(0, Number(noa.missingWords) || 0),
          chooseTranslation: Math.max(0, Number(noa.chooseTranslation) || 0),
          chooseWord: Math.max(0, Number(noa.chooseWord) || 0),
          memoryGame: Math.max(0, Number(noa.memoryGame) || 0),
          writeTranslation: Math.max(0, Number(noa.writeTranslation) || 0),
          writeWord: Math.max(0, Number(noa.writeWord) || 0),
        };
        return { ...base, numberOfCorrectAnswers: safeNoa };
      };
      const normalized = arr.map(normalize);

      const exists = normalized.some(
        (it: any) => it && typeof it === 'object' && it.word === entry.word && it.sentence === entry.sentence
      );
      
      if (!exists) {
        normalized.push(entry);
        
        // Increment word count for translations
        if (!isAuthenticated) {
          await wordCountService.incrementTranslationsSaved();
        }
      }

      await RNFS.writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf8');
      if (Platform.OS === 'android') {
        ToastAndroid.show('Saved', ToastAndroid.SHORT);
      } else {
        Alert.alert('Saved', 'Word added to your list.');
      }
    } catch (e) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to save', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Failed to save the word.');
      }
    }
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
          try { ToastAndroid.show('long press to select word', ToastAndroid.SHORT); } catch (e) {}
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

  // Auto-fetch translation and images when word changes
  React.useEffect(() => {
    if (translationPanel && translationPanel.word && 
        (translationPanel.translationLoading || translationPanel.imagesLoading)) {
      // Fetch translation
      fetchTranslation(translationPanel.word)
        .then((t) => {
          setTranslationPanel(prev => (prev && prev.word === translationPanel.word ? 
            { ...prev, translation: t || prev.translation, translationLoading: false } : prev));
        })
        .catch(() => {
          setTranslationPanel(prev => (prev && prev.word === translationPanel.word ? 
            { ...prev, translationLoading: false } : prev));
        });

      // Fetch images
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
  }, [translationPanel?.word, translationPanel?.translationLoading, translationPanel?.imagesLoading, fetchTranslation, fetchImageUrls, setTranslationPanel]);

  return {
    translationPanel,
    setTranslationPanel,
    openPanel,
    saveCurrentWord,
    onMessage,
    onScrapeMessage,
  };
};
