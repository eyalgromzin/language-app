import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, TextInput, StyleSheet, Text, Platform, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import YoutubePlayer from 'react-native-youtube-iframe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TranslationPanel, { type TranslationPanelState } from '../../components/TranslationPanel';
import { fetchTranslation as fetchTranslationCommon } from '../../utils/translation';
import * as RNFS from 'react-native-fs';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // If a raw 11-char ID is provided
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  // Common URL patterns
  const patterns = [
    /(?:v=|vi=)([a-zA-Z0-9_-]{11})/, // https://www.youtube.com/watch?v=VIDEOID
    /(?:\/v\/|\/vi\/)([a-zA-Z0-9_-]{11})/, // https://www.youtube.com/v/VIDEOID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/, // https://youtu.be/VIDEOID
    /(?:embed\/)([a-zA-Z0-9_-]{11})/, // https://www.youtube.com/embed/VIDEOID
    /(?:shorts\/)([a-zA-Z0-9_-]{11})/, // https://www.youtube.com/shorts/VIDEOID
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

type SearchBarProps = {
  inputUrl: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onOpenPress: () => void;
  urlInputRef: React.RefObject<TextInput> | React.MutableRefObject<TextInput | null>;
  onFocus: () => void;
  onBlur: () => void;
  onOpenLibrary: () => void;
  onToggleHistory: () => void;
  showAuxButtons: boolean;
};

const SearchBar: React.FC<SearchBarProps> = ({ inputUrl, onChangeText, onSubmit, onOpenPress, urlInputRef, onFocus, onBlur, onOpenLibrary, onToggleHistory, showAuxButtons }) => {
  return (
    <View id="searchBar">
      <View style={styles.inputRow}>
        <TextInput
          ref={urlInputRef}
          value={inputUrl}
          onChangeText={onChangeText}
          placeholder="Paste a YouTube URL (or video ID)"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={Platform.OS === 'ios' ? 'url' : 'default'}
          style={[styles.input, { flex: 1 }]}
          accessibilityLabel="YouTube URL input"
          onSubmitEditing={onSubmit}
          returnKeyType="go"
          blurOnSubmit={false}
          selectTextOnFocus
          onFocus={() => {
            try {
              onFocus();
              urlInputRef.current?.setNativeProps({ selection: { start: 0, end: inputUrl.length } });
            } catch {}
          }}
          onBlur={onBlur}
          onPressIn={() => {
            try {
              urlInputRef.current?.focus();
              urlInputRef.current?.setNativeProps({ selection: { start: 0, end: inputUrl.length } });
            } catch {}
          }}
        />
        <TouchableOpacity
          style={styles.goButton}
          onPress={onOpenPress}
          accessibilityRole="button"
          accessibilityLabel="Open video"
        >
          <Text style={styles.goButtonText}>Go</Text>
        </TouchableOpacity>
        {showAuxButtons ? (
          <>
            <TouchableOpacity
              onPress={onOpenLibrary}
              style={styles.libraryBtn}
              accessibilityRole="button"
              accessibilityLabel="Open Library"
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            >
              <Ionicons name="albums-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onToggleHistory}
              style={styles.libraryBtn}
              accessibilityRole="button"
              accessibilityLabel="Show history"
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            >
              <Ionicons name="time-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
};

function VideoScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [inputUrl, setInputUrl] = React.useState<string>('');
  const [url, setUrl] = React.useState<string>('');
  const videoId = React.useMemo(() => extractYouTubeVideoId(url) ?? '', [url]);
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);
  const [transcript, setTranscript] = React.useState<Array<{ text: string; duration: number; offset: number }>>([]);
  const [loadingTranscript, setLoadingTranscript] = React.useState<boolean>(false);
  const [transcriptError, setTranscriptError] = React.useState<string | null>(null);
  const playerRef = React.useRef<any>(null);
  const [playerReady, setPlayerReady] = React.useState<boolean>(false);
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const scrollViewRef = React.useRef<any>(null);
  const lineOffsetsRef = React.useRef<Record<number, number>>({});
  const urlInputRef = React.useRef<TextInput>(null);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [translationPanel, setTranslationPanel] = React.useState<TranslationPanelState | null>(null);
  const [selectedWordKey, setSelectedWordKey] = React.useState<string | null>(null);
  const [startupVideos, setStartupVideos] = React.useState<Array<{ url: string; thumbnail: string; title: string; description: string; length?: string }>>([]);
  const [startupVideosLoading, setStartupVideosLoading] = React.useState<boolean>(false);
  const [startupVideosError, setStartupVideosError] = React.useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = React.useState<string>('');
  const [searchResults, setSearchResults] = React.useState<Array<{ url: string; thumbnail: string | null; title: string; description?: string; length?: string }>>([]);
  const [searchLoading, setSearchLoading] = React.useState<boolean>(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = React.useState<boolean>(false);
  type HistoryEntry = { url: string; title: string };
  const [savedHistory, setSavedHistory] = React.useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = React.useState<boolean>(false);
  const [nowPlayingVideos, setNowPlayingVideos] = React.useState<Array<{ url: string; thumbnail: string; title: string; description?: string; length?: string }>>([]);
  const [nowPlayingLoading, setNowPlayingLoading] = React.useState<boolean>(false);
  const [nowPlayingError, setNowPlayingError] = React.useState<string | null>(null);

  // Hidden WebView state to scrape lazy-loaded image results (same approach as Surf/Books)
  const [imageScrape, setImageScrape] = React.useState<null | { url: string; word: string }>(null);
  const imageScrapeResolveRef = React.useRef<((urls: string[]) => void) | null>(null);
  const imageScrapeRejectRef = React.useRef<((err?: unknown) => void) | null>(null);
  const hiddenWebViewRef = React.useRef<WebView>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);
        if (!mounted) return;
        const map = Object.fromEntries(entries);
        setLearningLanguage(map['language.learning'] ?? null);
        setNativeLanguage(map['language.native'] ?? null);
      } catch {
        if (!mounted) return;
        setLearningLanguage(null);
        setNativeLanguage(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const mapLanguageNameToYoutubeCode = React.useCallback((name: string | null): string => {
    const mapping: Record<string, string> = {
      English: 'en',
      Spanish: 'es',
      French: 'fr',
      German: 'de',
      Italian: 'it',
      Portuguese: 'pt',
      Russian: 'ru',
      'Chinese (Mandarin)': 'zh',
      Japanese: 'ja',
      Korean: 'ko',
      Arabic: 'ar',
      Hindi: 'hi',
      Turkish: 'tr',
      Polish: 'pl',
      Dutch: 'nl',
      Greek: 'el',
      Swedish: 'sv',
      Norwegian: 'no',
      Finnish: 'fi',
      Czech: 'cs',
      Ukrainian: 'uk',
      Hebrew: 'he',
      Thai: 'th',
      Vietnamese: 'vi',
    };
    if (!name) return 'en';
    return mapping[name] || 'en';
  }, []);

  const fetchYouTubeLengthString = React.useCallback(async (id: string): Promise<string | null> => {
    const fmt = (seconds: number): string => {
      const total = Math.max(0, Math.floor(Number(seconds) || 0));
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const secs = total % 60;
      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
      return `${minutes}:${String(secs).padStart(2, '0')}`;
    };
    try {
      const res = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`);
      if (!res.ok) return null;
      const html = await res.text();
      let m = html.match(/\"lengthSeconds\":\"(\d+)\"/);
      if (m && m[1]) {
        const secs = Math.max(0, parseInt(m[1], 10) || 0);
        return fmt(secs);
      }
      m = html.match(/\"approxDurationMs\":\"(\d+)\"/);
      if (m && m[1]) {
        const ms = Math.max(0, parseInt(m[1], 10) || 0);
        const secs = Math.floor(ms / 1000);
        return fmt(secs);
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const enrichWithLengths = React.useCallback(async <T extends { url: string }>(items: T[], concurrency = 4): Promise<Array<T & { length?: string }>> => {
    const out: Array<T & { length?: string }> = new Array(items.length);
    let nextIndex = 0;
    const worker = async () => {
      while (true) {
        const idx = nextIndex++;
        if (idx >= items.length) return;
        const item = items[idx];
        const id = extractYouTubeVideoId(item.url);
        if (!id) {
          out[idx] = { ...item } as any;
          continue;
        }
        const len = await fetchYouTubeLengthString(id);
        out[idx] = { ...item, length: len || undefined } as any;
      }
    };
    const workers = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, () => worker());
    await Promise.all(workers);
    return out;
  }, [fetchYouTubeLengthString]);

  React.useEffect(() => {
    let cancelled = false;
    const fetchStartupVideos = async (langSymbol: string) => {
      setStartupVideosLoading(true);
      setStartupVideosError(null);
      try {
        const response = await fetch('http://localhost:3000/getVideoStartupPage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbol: langSymbol }),
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        const typed = (results as Array<{ url: string; thumbnail: string; title: string; description: string }>);
        const enriched = await enrichWithLengths(typed);
        if (!cancelled) setStartupVideos(enriched);
      } catch (e) {
        if (!cancelled) {
          setStartupVideos([]);
          setStartupVideosError('Failed to load startup videos.');
        }
      } finally {
        if (!cancelled) setStartupVideosLoading(false);
      }
    };
    const symbol = mapLanguageNameToYoutubeCode(learningLanguage);
    fetchStartupVideos(symbol);
    return () => { cancelled = true; };
  }, [learningLanguage, mapLanguageNameToYoutubeCode]);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!videoId) {
        setTranscript([]);
        setTranscriptError(null);
        setLoadingTranscript(false);
        return;
      }
      // Intentionally do not auto-fetch here to avoid duplicate/conflicting requests.
      // Fetch is performed explicitly via sendGetTranscript when user presses Go.
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [videoId, learningLanguage, mapLanguageNameToYoutubeCode]);

  React.useEffect(() => {
    let cancelled = false;
    const fetchNowPlaying = async (langSymbol: string) => {
      if (!videoId) {
        if (!cancelled) {
          setNowPlayingVideos([]);
          setNowPlayingError(null);
          setNowPlayingLoading(false);
        }
        return;
      }
      setNowPlayingLoading(true);
      setNowPlayingError(null);
      try {
        const response = await fetch('http://localhost:3000/now-playing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ languageSymbol: langSymbol }),
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        const normalized = (results as any[]).map(r => ({
          url: r.url,
          thumbnail: (r.thumbnail ?? r.thumbnailUrl ?? '') as string,
          title: r.title,
          description: r.description,
        }));
        const enriched = await enrichWithLengths(normalized as Array<{ url: string; thumbnail: string; title: string; description?: string }>);
        if (!cancelled) setNowPlayingVideos(enriched);
      } catch (e) {
        if (!cancelled) {
          setNowPlayingVideos([]);
          setNowPlayingError('Failed to load now-playing videos.');
        }
      } finally {
        if (!cancelled) setNowPlayingLoading(false);
      }
    };
    const symbol = mapLanguageNameToYoutubeCode(learningLanguage);
    fetchNowPlaying(symbol);
    return () => { cancelled = true; };
  }, [videoId, learningLanguage, mapLanguageNameToYoutubeCode, enrichWithLengths]);

  type TranscriptSegment = { text: string; duration: number; offset: number };
  
  const getVideoTranscript = async (video: string, lang: string): Promise<TranscriptSegment[]> => {
    const response = await fetch('http://localhost:3000/transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ video, lang }),
    });

    if (!response.ok) {
      throw new Error(`Transcript request failed: ${response.status}`);
    }

    const data = await response.json();
    return data as TranscriptSegment[]; 
  };

  const fetchTranslation = async (word: string): Promise<string> => fetchTranslationCommon(word, learningLanguage, nativeLanguage);

  const fetchYouTubeTitleById = async (id: string): Promise<string> => {
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`);
      if (!res.ok) return '';
      const data = await res.json();
      const t = typeof (data as any)?.title === 'string' ? (data as any).title : '';
      return t;
    } catch {
      return '';
    }
  };

  const openStartupVideo = async (urlString: string, title?: string) => {
    const id = extractYouTubeVideoId(urlString);
    if (!id) {
      setTranscript([]);
      setTranscriptError('Unable to open this video. Invalid URL or ID.');
      setIsPlaying(false);
      return;
    }
    setCurrentVideoTitle(title || '');
    setInputUrl(urlString);
    setUrl(urlString);
    setTranscript([]);
    setTranscriptError(null);
    setLoadingTranscript(true);
    try {
      const langCode = mapLanguageNameToYoutubeCode(learningLanguage);
      const segments = await getVideoTranscript(id, langCode);
      setTranscript(segments);
    } catch (err) {
      setTranscript([]);
      setTranscriptError('Unable to fetch transcript for this video.');
    } finally {
      setLoadingTranscript(false);
    }
    setIsPlaying(true);
    try { await saveHistory(urlString, title); } catch {}
  };

  const resetVideoScreenState = React.useCallback(() => {
    try { playerRef.current?.seekTo?.(0); } catch {}
    try { playerRef.current?.pauseVideo?.(); } catch {}
    setIsPlaying(false);
    setPlayerReady(false);
    setCurrentTime(0);
    setActiveIndex(null);
    lineOffsetsRef.current = {};
    setInputUrl('');
    setUrl('');
    setTranscript([]);
    setTranscriptError(null);
    setSelectedWordKey(null);
    setTranslationPanel(null);
    setImageScrape(null);
    setCurrentVideoTitle('');
    try { scrollViewRef.current?.scrollTo?.({ y: 0, animated: false }); } catch {}
  }, []);

  React.useEffect(() => {
    const ts = (route as any)?.params?.resetAt;
    if (!ts) return;
    resetVideoScreenState();
  }, [(route as any)?.params?.resetAt, resetVideoScreenState]);

  const imageScrapeInjection = `
    (function() {
      var MAX_TIME = 12000;
      var INTERVAL_MS = 250;
      var start = Date.now();
      var pollTimer = null;
      var scrollTimer = null;

      function normalizeUrl(u) {
        if (!u) return null;
        var url = ('' + u).trim();
        if (!url) return null;
        if (url.indexOf('//') === 0) return 'https:' + url;
        return url;
      }

      function collectUrls() {
        var urls = [];
        try {
          var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
          for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            try {
              var candidate = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original') || '';
              var n = normalizeUrl(candidate);
              if (n && urls.indexOf(n) === -1) urls.push(n);
            } catch (e) {}
          }
        } catch (e) {}
        return urls;
      }

      function done() {
        try {
          var urls = collectUrls().slice(0, 12);
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'imageScrapeUrls', urls: urls })
          );
        } catch(e) {}
        if (pollTimer) clearInterval(pollTimer);
        if (scrollTimer) clearInterval(scrollTimer);
      }

      function step() {
        if (collectUrls().length >= 6) return done();
        if (Date.now() - start > MAX_TIME) return done();
      }

      var y = 0;
      scrollTimer = setInterval(function(){
        try {
          y += 800;
          window.scrollTo(0, y);
          window.dispatchEvent(new Event('scroll'));
        } catch(e) {}
      }, 200);

      pollTimer = setInterval(step, INTERVAL_MS);
      step();
    })();
    true;
  `;

  const parseYandexImageUrlsFromHtml = (html: string): string[] => {
    try {
      const results: string[] = [];
      const imgTagRegex = /<img\b[^>]*class=(["'])([^"']*?)\1[^>]*>/gi;
      let match: RegExpExecArray | null;
      while ((match = imgTagRegex.exec(html)) !== null) {
        const classAttr = match[2] || '';
        if (
          classAttr.indexOf('ImagesContentImage-Image') !== -1 &&
          classAttr.indexOf('ImagesContentImage-Image_clickable') !== -1
        ) {
          const tag = match[0];
          let url: string | null = null;
          const srcsetMatch = /srcset=(["'])([^"']+?)\1/i.exec(tag);
          if (srcsetMatch && srcsetMatch[2]) {
            url = srcsetMatch[2].split(',')[0].trim().split(/\s+/)[0];
          }
          if (!url) {
            const dataSrcMatch = /data-src=(["'])([^"']+?)\1/i.exec(tag);
            if (dataSrcMatch && dataSrcMatch[2]) url = dataSrcMatch[2];
          }
          if (!url) {
            const srcMatch = /src=(["'])([^"']+?)\1/i.exec(tag);
            if (srcMatch && srcMatch[2]) url = srcMatch[2];
          }
          if (url) {
            let normalized = url;
            if (normalized.startsWith('//')) normalized = 'https:' + normalized;
            else if (normalized.startsWith('/')) normalized = 'https://yandex.com' + normalized;
            if (!results.includes(normalized)) {
              results.push(normalized);
              if (results.length >= 6) break;
            }
          }
        }
      }
      return results.slice(0, 6);
    } catch {
      return [];
    }
  };

  const fetchImageUrls = async (word: string): Promise<string[]> => {
    const searchUrl = `https://yandex.com/images/search?text=${encodeURIComponent(word)}`;
    if (imageScrape) {
      return [];
    }
    const result: string[] = await new Promise<string[]>((resolve, reject) => {
      imageScrapeResolveRef.current = resolve;
      imageScrapeRejectRef.current = reject;
      setImageScrape({ url: searchUrl, word });
    }).catch(() => [] as string[]);
    if (Array.isArray(result) && result.length > 0) return result.slice(0, 6);
    return [];
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

  const openPanel = (word: string, sentence?: string) => {
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
  };

  const saveCurrentWord = async () => {
    if (!translationPanel) return;
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
      if (!exists) normalized.push(entry);

      await RNFS.writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf8');
    } catch (e) {
      // ignore errors silently
    }
  };

  const tokenizeTranscriptLine = React.useCallback((text: string): Array<{ value: string; isWord: boolean }> => {
    const re = /[\p{L}\p{N}'’\-]+|\s+|[^\s\p{L}\p{N}]/gu;
    const out: Array<{ value: string; isWord: boolean }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const tok = m[0];
      const isWord = /[\p{L}\p{N}'’\-]+/u.test(tok);
      out.push({ value: tok, isWord });
    }
    if (out.length === 0) out.push({ value: text, isWord: true });
    return out;
  }, []);

  const formatTimestamp = React.useCallback((seconds: number): string => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }, []);

  React.useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const t = await playerRef.current?.getCurrentTime?.();
        if (!cancelled && typeof t === 'number' && !Number.isNaN(t)) {
          setCurrentTime(t);
        }
      } catch {}
    }, 500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [playerReady]);

  React.useEffect(() => {
    if (!transcript || transcript.length === 0) {
      setActiveIndex(null);
      return;
    }
    const idx = transcript.findIndex((seg) => currentTime >= seg.offset && currentTime < seg.offset + seg.duration);
    if (idx !== -1) {
      setActiveIndex(idx);
      return;
    }
    let lastIdx: number | null = null;
    for (let i = 0; i < transcript.length; i++) {
      if (currentTime >= transcript[i].offset) lastIdx = i;
      else break;
    }
    setActiveIndex(lastIdx);
  }, [currentTime, transcript]);

  React.useEffect(() => {
    if (activeIndex == null) return;
    const y = lineOffsetsRef.current[activeIndex];
    if (typeof y !== 'number') return;
    try {
      scrollViewRef.current?.scrollTo?.({ y: Math.max(y - 80, 0), animated: true });
    } catch {}
  }, [activeIndex]);

  const runYouTubeSearch = React.useCallback((rawQuery: string) => {
    const q = (rawQuery || '').trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchError(null);
    (async () => {
      try {
        const response = await fetch('http://localhost:3000/youtube/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        const results = Array.isArray(data) ? data : Array.isArray((data || {}).results) ? (data.results as any[]) : [];
        const typed = (results as Array<{ url: string; thumbnail: string | null; title: string; description?: string }>)
          .map((r) => ({ ...r }));
        const enriched = await enrichWithLengths(typed);
        setSearchResults(enriched as Array<{ url: string; thumbnail: string | null; title: string; description?: string; length?: string }>);
      } catch (e) {
        setSearchResults([]);
        setSearchError('Failed to search YouTube.');
      } finally {
        setSearchLoading(false);
      }
    })();
  }, []);

  const handleSubmit = React.useCallback(() => {
    const id = extractYouTubeVideoId(inputUrl);
    if (!id) return runYouTubeSearch(inputUrl);
    // If a valid video id/URL was provided, behave like pressing Open
    setUrl(inputUrl);
  }, [inputUrl, runYouTubeSearch]);

  const handleOpenPress = React.useCallback(() => {
    const id = extractYouTubeVideoId(inputUrl);
    if (!id) {
      runYouTubeSearch(inputUrl);
      return;
    }

    if (!videoId) {
      setUrl(inputUrl);
      setCurrentVideoTitle('');
      (async () => {
        const t = await fetchYouTubeTitleById(id);
        if (t) setCurrentVideoTitle(t);
      })();
      if (transcript.length === 0) {
        (async () => {
          setLoadingTranscript(true);
          setTranscriptError(null);
          try {
            const langCode = mapLanguageNameToYoutubeCode(learningLanguage);
            const segments = await getVideoTranscript(id, langCode);
            setTranscript(segments);
          } catch (err) {
            setTranscript([]);
            setTranscriptError('Unable to fetch transcript for this video.');
          } finally {
            setLoadingTranscript(false);
          }
        })();
      }
      setIsPlaying(true);
      (async () => { try { await saveHistory(inputUrl, currentVideoTitle); } catch {} })();
      return;
    }

    if (id && id !== videoId) {
      setUrl(inputUrl);
      setCurrentVideoTitle('');
      (async () => {
        const t = await fetchYouTubeTitleById(id);
        if (t) setCurrentVideoTitle(t);
      })();
      setTranscript([]);
      setTranscriptError(null);
      (async () => {
        setLoadingTranscript(true);
        try {
          const langCode = mapLanguageNameToYoutubeCode(learningLanguage);
          const segments = await getVideoTranscript(id, langCode);
          setTranscript(segments);
        } catch (err) {
          setTranscript([]);
          setTranscriptError('Unable to fetch transcript for this video.');
        } finally {
          setLoadingTranscript(false);
        }
      })();
      setIsPlaying(true);
      (async () => { try { await saveHistory(inputUrl, currentVideoTitle); } catch {} })();
      return;
    }

    if (isPlaying || (typeof currentTime === 'number' && currentTime > 0.1)) {
      try {
        playerRef.current?.seekTo?.(0);
      } catch {}
      setIsPlaying(false);
      return;
    }
  }, [inputUrl, videoId, transcript.length, isPlaying, currentTime, learningLanguage]);

  

  // --- History management ---
  const HISTORY_KEY = 'video.history';
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (!mounted) return;
        const arr = JSON.parse(raw || '[]');
        if (Array.isArray(arr)) {
          // Migrate from [string] -> [{ url, title }]
          const normalized: HistoryEntry[] = arr
            .map((item: any) => {
              if (typeof item === 'string') {
                const u = (item || '').trim();
                return u ? { url: u, title: '' } : null;
              }
              if (item && typeof item.url === 'string') {
                const u = (item.url || '').trim();
                const t = typeof item.title === 'string' ? item.title : '';
                return u ? { url: u, title: t } : null;
              }
              return null;
            })
            .filter(Boolean) as HistoryEntry[];
          setSavedHistory(normalized);
        } else {
          setSavedHistory([]);
        }
      } catch {
        if (!mounted) return;
        setSavedHistory([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveHistory = async (entryUrl: string, entryTitle?: string) => {
    const normalizedUrl = (entryUrl || '').trim();
    if (!normalizedUrl) return;
    const providedTitle = (entryTitle || currentVideoTitle || '').trim();
    setSavedHistory(prev => {
      const existing = prev.find(h => h.url === normalizedUrl);
      const titleToUse = providedTitle || (existing?.title ?? '');
      const newEntry: HistoryEntry = { url: normalizedUrl, title: titleToUse };
      const next = [newEntry, ...prev.filter(h => h.url !== normalizedUrl)];
      const limited = next.slice(0, 50);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(limited)).catch(() => {});
      return limited;
    });
  };

  const onSelectHistory = (entry: HistoryEntry) => {
    setShowHistory(false);
    openStartupVideo(entry.url, entry.title);
  };

  const NewestVideos = () => {
    return (
      <>
        <Text style={styles.sectionTitle}>newest videos</Text>
        {startupVideosLoading ? (
          <View style={styles.centered}><ActivityIndicator /></View>
        ) : startupVideosError ? (
          <Text style={[styles.helper, { color: '#cc3333' }]}>{startupVideosError}</Text>
        ) : startupVideos.length > 0 ? (
          <View style={styles.videosList}>
            {startupVideos.map((v, idx) => (
              <TouchableOpacity key={`${v.url}-${idx}`} style={styles.videoItem} onPress={() => openStartupVideo(v.url, v.title)} activeOpacity={0.7}>
                <View style={styles.thumbWrapper}>
                  <Image source={{ uri: v.thumbnail }} style={styles.videoThumb} />
                  {v.length ? (
                    <View style={styles.thumbBadge}><Text style={styles.thumbBadgeText}>{v.length}</Text></View>
                  ) : null}
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{v.title}</Text>
                  <Text style={styles.videoDescription} numberOfLines={3}>{v.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.helper}>No videos yet.</Text>
        )}
      </>
    );
  };

  const NowPlaying = () => {
    if (!videoId) return null;
    return (
      <>
        <Text style={styles.sectionTitle}>now playing</Text>
        {nowPlayingLoading ? (
          <View style={styles.centered}><ActivityIndicator /></View>
        ) : nowPlayingError ? (
          <Text style={[styles.helper, { color: '#cc3333' }]}>{nowPlayingError}</Text>
        ) : nowPlayingVideos.length > 0 ? (
          <View style={styles.videosList}>
            {nowPlayingVideos.map((v, idx) => (
              <TouchableOpacity key={`${v.url}-${idx}`} style={styles.videoItem} onPress={() => openStartupVideo(v.url, v.title)} activeOpacity={0.7}>
                <View style={styles.thumbWrapper}>
                  <Image source={{ uri: v.thumbnail }} style={styles.videoThumb} />
                  {v.length ? (
                    <View style={styles.thumbBadge}><Text style={styles.thumbBadgeText}>{v.length}</Text></View>
                  ) : null}
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{v.title}</Text>
                  {v.description ? (
                    <Text style={styles.videoDescription} numberOfLines={3}>{v.description}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.helper}>No suggestions.</Text>
        )}
      </>
    );
  };

  const SearchResults = () => {
    if (!searchLoading && !searchError && searchResults.length === 0) return null;
    return (
      <>
        <Text style={styles.sectionTitle}>search results</Text>
        {searchLoading ? (
          <View style={styles.centered}><ActivityIndicator /></View>
        ) : searchError ? (
          <Text style={[styles.helper, { color: '#cc3333' }]}>{searchError}</Text>
        ) : searchResults.length > 0 ? (
          <View style={styles.videosList}>
            {searchResults.map((v, idx) => (
              <TouchableOpacity key={`${v.url}-${idx}`} style={styles.videoItem} onPress={() => openStartupVideo(v.url, v.title)} activeOpacity={0.7}>
                <View style={styles.thumbWrapper}>
                  {v.thumbnail ? (
                    <Image source={{ uri: v.thumbnail }} style={styles.videoThumb} />
                  ) : (
                    <View style={[styles.videoThumb, { backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: '#666', fontSize: 12 }}>No image</Text>
                    </View>
                  )}
                  {v.length ? (
                    <View style={styles.thumbBadge}><Text style={styles.thumbBadgeText}>{v.length}</Text></View>
                  ) : null}
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{v.title}</Text>
                  <Text style={styles.videoDescription} numberOfLines={3}>{v.description || ''}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.helper}>No results.</Text>
        )}
      </>
    );
  };

  const Transcript = () => {
    return (
      <>
      {videoId ? (
        <View style={{ marginTop: 16, marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Transcript</Text>
          {loadingTranscript ? (
            <View style={styles.centered}>
              <ActivityIndicator />
              <Text style={styles.helper}>Fetching transcript…</Text>
            </View>
          ) : transcriptError ? (
            <Text style={[styles.helper, { color: '#cc3333' }]}>{transcriptError}</Text>
          ) : transcript.length > 0 ? (
            <ScrollView style={styles.transcriptBox} ref={scrollViewRef} nestedScrollEnabled>
              {transcript.map((seg, index) => {
                const tokens = tokenizeTranscriptLine(seg.text);
                return (
                  <View
                    key={`${seg.offset}-${index}`}
                    onLayout={(e) => {
                      const y = e.nativeEvent.layout.y;
                      lineOffsetsRef.current[index] = y;
                    }}
                  >
                    <Text style={styles.transcriptTime}>{formatTimestamp(seg.offset)}</Text>
                    <Text
                      style={[
                        styles.transcriptLine,
                        activeIndex === index ? styles.transcriptLineActive : null,
                      ]}
                    >
                      {tokens.map((tok, tIdx) => {
                        const key = `${index}:${tIdx}`;
                        if (!tok.isWord) {
                          return (
                            <Text key={key}>
                              {tok.value}
                            </Text>
                          );
                        }
                        const isSelected = selectedWordKey === key;
                        return (
                          <Text
                            key={key}
                            onPress={() => {
                              setSelectedWordKey(key);
                              try { playerRef.current?.pauseVideo?.(); } catch {}
                              try { playerRef.current?.seekTo?.(seg.offset); } catch {}
                              setIsPlaying(false);
                              setCurrentTime(seg.offset);
                              openPanel(tok.value, seg.text);
                            }}
                            style={isSelected ? styles.transcriptWordSelected : undefined}
                          >
                            {tok.value}
                          </Text>
                        );
                      })}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.helper}>No transcript lines to display.</Text>
          )}
        </View>
      ) : null}
      </>
    );
  };

  const ImageScrape = () => {
    return (
      <>{imageScrape && (
        <View style={{ position: 'absolute', left: -10000, top: 0, width: 360, height: 1200, opacity: 0 }}>
          <WebView
            ref={hiddenWebViewRef}
            source={{ uri: imageScrape.url }}
            style={{ width: '100%', height: '100%' }}
            injectedJavaScript={imageScrapeInjection}
            injectedJavaScriptBeforeContentLoaded={imageScrapeInjection}
            onMessage={onScrapeMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            onLoad={() => {
              try { hiddenWebViewRef.current?.injectJavaScript(imageScrapeInjection); } catch (e) {}
            }}
            onError={() => {
              imageScrapeRejectRef.current?.();
              imageScrapeResolveRef.current = null;
              imageScrapeRejectRef.current = null;
              setImageScrape(null);
            }}
          />
        </View>
      )}</>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
    >
      <SearchBar
        inputUrl={inputUrl}
        onChangeText={setInputUrl}
        onSubmit={handleSubmit}
        onOpenPress={handleOpenPress}
        urlInputRef={urlInputRef}
        onFocus={() => { setIsInputFocused(true); setShowHistory(false); }}
        onBlur={() => { setIsInputFocused(false); }}
        onOpenLibrary={() => navigation.navigate('Library')}
        onToggleHistory={() => setShowHistory(prev => !prev)}
        showAuxButtons={true}
      />
      {showHistory && !isInputFocused && savedHistory.length > 0 ? (
        <View style={styles.suggestionsContainer}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
            {savedHistory.map((h) => (
              <TouchableOpacity key={h.url} style={styles.suggestionItem} onPress={() => onSelectHistory(h)}>
                <Ionicons name="time-outline" size={16} color="#4b5563" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText} numberOfLines={1}>{h.title?.trim() ? h.title : h.url}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
      {videoId ? (
        <>
        {currentVideoTitle ? <Text style={styles.nowPlayingTitle} numberOfLines={2}>{currentVideoTitle}</Text> : null}
        <View style={styles.playerWrapper}>
          <YoutubePlayer
            height={220}
            play={isPlaying}
            videoId={videoId}
            webViewProps={{
              allowsFullscreenVideo: true,
            }}
            ref={playerRef}
            onReady={() => setPlayerReady(true)}
            onChangeState={(state) => {
              if (state === 'playing') {
                setIsPlaying(true);
                // Ensure we record history whenever playback starts
                (async () => {
                  try { await saveHistory(url || inputUrl, currentVideoTitle); } catch {}
                })();
              }
              if (state === 'paused' || state === 'ended') setIsPlaying(false);
            }}
          />
        </View>
        <NowPlaying />
        </>
      ) : (
        <Text style={styles.helper}>Enter a valid YouTube link or 11-character ID to load the video.</Text>
      )}

      <Transcript />

      <ImageScrape />

      <SearchResults />

      <NewestVideos />

      <TranslationPanel
        panel={translationPanel}
        onSave={saveCurrentWord}
        onClose={() => setTranslationPanel(null)}
      />


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  libraryBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  goButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  helper: {
    color: '#888',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  videosList: {
    marginBottom: 12,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  thumbWrapper: {
    width: 120,
    height: 68,
    marginRight: 10,
    position: 'relative',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  thumbBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thumbBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 13,
    color: '#555',
  },
  centered: {
    alignItems: 'center',
  },
  suggestionsContainer: {
    marginTop: -4,
    marginBottom: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    fontSize: 14,
    color: '#111827',
    flexShrink: 1,
  },
  transcriptBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    maxHeight: 230,
  },
  transcriptLine: {
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
    marginBottom: 6,
  },
  transcriptLineActive: {
    color: '#007AFF',
    fontWeight: '700',
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  transcriptWordSelected: {
    backgroundColor: 'rgba(255,235,59,0.9)',
    borderRadius: 2,
  },
  transcriptTime: {
    color: '#666',
    fontSize: 12,
    marginBottom: 2,
  },
  nowPlayingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111',
  },
});

export default VideoScreen;
