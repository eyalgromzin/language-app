import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, TextInput, StyleSheet, Text, Platform, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, ToastAndroid, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import YoutubePlayer from 'react-native-youtube-iframe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TranslationPanel, { type TranslationPanelState } from '../../components/TranslationPanel';
import { fetchTranslation as fetchTranslationCommon } from '../../utils/translation';
import * as RNFS from 'react-native-fs';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { parseYandexImageUrlsFromHtml } from '../practice/common';
import {
  extractYouTubeVideoId,
  normalizeYouTubeUrl as normalizeYouTubeUrlUtil,
  mapLanguageNameToYoutubeCode as mapLanguageNameToYoutubeCodeUtil,
  enrichWithLengths,
  getVideoTranscript,
  fetchYouTubeTitleById,
  imageScrapeInjection,
  tokenizeTranscriptLine,
  formatTimestamp,
} from './videoMethods';



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
  onToggleFavouritesList: () => void;
  showAuxButtons: boolean;
  isFavourite: boolean;
  onToggleFavourite: () => void;
};

const SearchBar: React.FC<SearchBarProps> = ({ inputUrl, onChangeText, onSubmit, onOpenPress, urlInputRef, onFocus, onBlur, onOpenLibrary, onToggleHistory, onToggleFavouritesList, showAuxButtons, isFavourite, onToggleFavourite }) => {
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
        <TouchableOpacity
          onPress={onToggleFavourite}
          style={styles.libraryBtn}
          accessibilityRole="button"
          accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name={isFavourite ? 'star' : 'star-outline'} size={20} color={isFavourite ? '#f59e0b' : '#007AFF'} />
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
              onPress={() => {
                try {
                  Alert.alert(
                    'Menu',
                    undefined,
                    [
                      { text: 'history', onPress: onToggleHistory },
                      { text: 'favourites list', onPress: onToggleFavouritesList },
                      { text: 'Cancel', style: 'cancel' },
                    ],
                    { cancelable: true }
                  );
                } catch {
                  // Fallback: toggle history
                  onToggleHistory();
                }
              }}
              style={styles.libraryBtn}
              accessibilityRole="button"
              accessibilityLabel="Open menu"
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#007AFF" />
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
  const [showFavouritesList, setShowFavouritesList] = React.useState<boolean>(false);
  const [nowPlayingVideos, setNowPlayingVideos] = React.useState<Array<{ url: string; thumbnail: string; title: string; description?: string; length?: string }>>([]);
  const [nowPlayingLoading, setNowPlayingLoading] = React.useState<boolean>(false);
  const [nowPlayingError, setNowPlayingError] = React.useState<string | null>(null);
  const [hidePlayback, setHidePlayback] = React.useState<boolean>(false);

  type FavouriteItem = { url: string; name: string; typeId?: number; typeName?: string; levelName?: string };
  const FAVOURITES_KEY = 'video.favourites';
  const [favourites, setFavourites] = React.useState<FavouriteItem[]>([]);
  const [showAddFavouriteModal, setShowAddFavouriteModal] = React.useState<boolean>(false);
  const [newFavName, setNewFavName] = React.useState<string>('');
  const [newFavUrl, setNewFavUrl] = React.useState<string>('');
  const [newFavLevelName, setNewFavLevelName] = React.useState<string | null>('easy');
  const [showLevelOptions, setShowLevelOptions] = React.useState<boolean>(false);

  const normalizeYouTubeUrl = React.useCallback(normalizeYouTubeUrlUtil, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet([FAVOURITES_KEY, 'surf.favourites']);
        if (!mounted) return;
        const map = Object.fromEntries(entries);
        const rawVideo = map[FAVOURITES_KEY];
        const rawSurf = map['surf.favourites'];
        const parseList = (raw: string | null | undefined): FavouriteItem[] => {
          try {
            const arr = JSON.parse(raw || '[]');
            if (!Array.isArray(arr)) return [];
            const mapped: FavouriteItem[] = arr
              .map((it: any) => {
                if (typeof it === 'string') {
                  const u = normalizeYouTubeUrl(it);
                  const nm = u;
                  return { url: u, name: nm, typeName: 'video' } as FavouriteItem;
                }
                if (it && typeof it === 'object' && typeof it.url === 'string') {
                  const u = normalizeYouTubeUrl(it.url);
                  const nm = typeof it.name === 'string' && it.name.trim().length > 0 ? it.name : u;
                  const tid = typeof it.typeId === 'number' ? it.typeId : undefined;
                  const tn = typeof it.typeName === 'string' ? it.typeName : undefined;
                  const ln = typeof it.levelName === 'string' ? it.levelName : (typeof it.level === 'string' ? it.level : undefined);
                  return { url: u, name: nm, typeId: tid, typeName: tn, levelName: ln } as FavouriteItem;
                }
                return null;
              })
              .filter((x): x is FavouriteItem => !!x);
            return mapped;
          } catch { return []; }
        };

        let videoFavs = parseList(rawVideo);
        if (videoFavs.length === 0) {
          const surfFavs = parseList(rawSurf);
          const isYouTube = (u: string) => /youtube\.com|youtu\.be/.test(u);
          const migrated = surfFavs
            .filter(item => (item.typeName === 'video') || isYouTube(item.url))
            .map(item => ({ ...item, typeName: 'video' as const }));
          if (migrated.length > 0) {
            videoFavs = migrated;
            try { await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(videoFavs)); } catch {}
          }
        }
        setFavourites(videoFavs);
      } catch {
        if (!mounted) return;
        setFavourites([]);
      }
    })();
    return () => { mounted = false; };
  }, [normalizeYouTubeUrl]);

  const saveFavourites = React.useCallback(async (next: FavouriteItem[]) => {
    setFavourites(next);
    try { await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const addToFavourites = React.useCallback(async (favUrl: string, name?: string, levelName?: string | null) => {
    if (!favUrl) return;
    const normalized = normalizeYouTubeUrl(favUrl);
    const safeName = (name || currentVideoTitle || '').trim() || normalized;
    const next: FavouriteItem[] = [
      { url: normalized, name: safeName, typeName: 'video', levelName: levelName || undefined },
      ...favourites.filter((f) => f.url !== normalized),
    ].slice(0, 200);
    await saveFavourites(next);
  }, [normalizeYouTubeUrl, currentVideoTitle, favourites, saveFavourites]);

  const removeFromFavourites = React.useCallback(async (favUrl: string) => {
    if (!favUrl) return;
    const normalized = normalizeYouTubeUrl(favUrl);
    const next = favourites.filter((f) => f.url !== normalized);
    await saveFavourites(next);
  }, [normalizeYouTubeUrl, favourites, saveFavourites]);

  const currentCanonicalUrl = React.useMemo(() => normalizeYouTubeUrl((url || inputUrl || '').trim()), [url, inputUrl, normalizeYouTubeUrl]);
  const isFavourite = favourites.some((f) => f.url === currentCanonicalUrl && !!currentCanonicalUrl);

  const onToggleFavourite = React.useCallback(() => {
    const targetUrl = currentCanonicalUrl;
    if (!targetUrl) {
      try { if (Platform.OS === 'android') ToastAndroid.show('Invalid URL', ToastAndroid.SHORT); else Alert.alert('Invalid URL'); } catch {}
      return;
    }
    if (isFavourite) {
      const onYes = async () => {
        await removeFromFavourites(targetUrl);
        try { if (Platform.OS === 'android') ToastAndroid.show('Removed from favourites', ToastAndroid.SHORT); else Alert.alert('Removed'); } catch {}
      };
      try {
        Alert.alert(
          'Favourites',
          'already in favourites, remove it ?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: onYes },
          ],
          { cancelable: true },
        );
      } catch {
        onYes();
      }
      return;
    }
    setNewFavUrl(targetUrl);
    setNewFavName((currentVideoTitle || '').trim() || targetUrl);
    setNewFavLevelName('easy');
    setShowLevelOptions(false);
    setShowAddFavouriteModal(true);
  }, [currentCanonicalUrl, isFavourite, removeFromFavourites, addToFavourites, currentVideoTitle]);

  // Hidden WebView state to scrape lazy-loaded image results (same approach as Surf/Books)
  const [imageScrape, setImageScrape] = React.useState<null | { url: string; word: string }>(null);
  const imageScrapeResolveRef = React.useRef<((urls: string[]) => void) | null>(null);
  const imageScrapeRejectRef = React.useRef<((err?: unknown) => void) | null>(null);
  const hiddenWebViewRef = React.useRef<WebView>(null);

  const lastUpsertedUrlRef = React.useRef<string | null>(null);

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

  const mapLanguageNameToYoutubeCode = React.useCallback(mapLanguageNameToYoutubeCodeUtil, []);

  const upsertNowPlayingForCurrent = React.useCallback(async () => {
    try {
      const postUrl = (url || inputUrl || '').trim();
      if (!postUrl) return;
      if (lastUpsertedUrlRef.current === postUrl) return;
      lastUpsertedUrlRef.current = postUrl;

      const symbol = mapLanguageNameToYoutubeCode(learningLanguage);
      const title = (currentVideoTitle && currentVideoTitle.trim()) ? currentVideoTitle : postUrl;
      const thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined;

      await fetch('http://localhost:3000/video/now-playing/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          languageSymbol: symbol,
          title,
          url: postUrl,
          ...(thumb ? { thumbnailUrl: thumb } : {}),
        }),
      });
    } catch {}
  }, [url, inputUrl, learningLanguage, currentVideoTitle, videoId, mapLanguageNameToYoutubeCode]);

  

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
      setNowPlayingLoading(true);
      setNowPlayingError(null);
      try {
        const response = await fetch('http://localhost:3000/video/now-playing', {
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
  }, [learningLanguage, mapLanguageNameToYoutubeCode, enrichWithLengths]);

  

  const fetchTranslation = async (word: string): Promise<string> => fetchTranslationCommon(word, learningLanguage, nativeLanguage);

  

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
    setHidePlayback(false);
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

  // Handle deep navigation from Library with a YouTube URL
  React.useEffect(() => {
    const urlFromRoute = (route as any)?.params?.youtubeUrl;
    if (!urlFromRoute) return;
    const titleFromRoute = (route as any)?.params?.youtubeTitle;
    openStartupVideo(String(urlFromRoute), typeof titleFromRoute === 'string' ? titleFromRoute : undefined);
    setHidePlayback(false);
    try { (navigation as any)?.setParams?.({ youtubeUrl: undefined, youtubeTitle: undefined }); } catch {}
  }, [(route as any)?.params?.youtubeUrl]);

  

  

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
    if (!id) {
      setHidePlayback(true);
      return runYouTubeSearch(inputUrl);
    }
    // If a valid video id/URL was provided, show playback
    setHidePlayback(false);
    setUrl(inputUrl);
  }, [inputUrl, runYouTubeSearch]);

  const handleOpenPress = React.useCallback(() => {
    const id = extractYouTubeVideoId(inputUrl);
    if (!id) {
      setHidePlayback(true);
      runYouTubeSearch(inputUrl);
      return;
    }

    if (!videoId) {
      setHidePlayback(false);
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
      setHidePlayback(false);
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

  const onSelectFavourite = (fav: FavouriteItem) => {
    setShowFavouritesList(false);
    openStartupVideo(fav.url, fav.name);
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
    return (
      <>
        <Text style={styles.sectionTitle}>now playing by other people</Text>
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
        onFocus={() => { setIsInputFocused(true); setShowHistory(false); setShowFavouritesList(false); }}
        onBlur={() => { setIsInputFocused(false); }}
        onOpenLibrary={() => navigation.navigate('Library')}
        onToggleHistory={() => { setShowHistory(prev => !prev); setShowFavouritesList(false); }}
        onToggleFavouritesList={() => { setShowFavouritesList(prev => !prev); setShowHistory(false); }}
        showAuxButtons={true}
        isFavourite={isFavourite}
        onToggleFavourite={onToggleFavourite}
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
      {showFavouritesList && !isInputFocused && favourites.length > 0 ? (
        <View style={styles.suggestionsContainer}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 240 }}>
            {favourites.map((f) => (
              <TouchableOpacity key={f.url} style={styles.suggestionItem} onPress={() => onSelectFavourite(f)}>
                <Ionicons name="star" size={16} color="#f59e0b" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText} numberOfLines={1}>{(f.name || f.url)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}
      {videoId && !hidePlayback ? (
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
                setHidePlayback(false);
                // Ensure we record history whenever playback starts
                (async () => {
                  try { await saveHistory(url || inputUrl, currentVideoTitle); } catch {}
                })();
                (async () => { try { await upsertNowPlayingForCurrent(); } catch {} })();
              }
              if (state === 'paused' || state === 'ended') setIsPlaying(false);
            }}
          />
        </View>
        </>
      ) : (
        <Text style={styles.helper}>Enter a valid YouTube link or 11-character ID to load the video.</Text>
      )}

      {!hidePlayback && <Transcript />}

      {!searchLoading && !searchError && searchResults.length === 0 ? <NowPlaying /> : null}

      <ImageScrape />

      <SearchResults />

      {!isPlaying && !hidePlayback && !nowPlayingLoading && !nowPlayingError && nowPlayingVideos.length === 0 && <NewestVideos />}

      <TranslationPanel
        panel={translationPanel}
        onSave={saveCurrentWord}
        onClose={() => setTranslationPanel(null)}
      />

      <Modal
        visible={showAddFavouriteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddFavouriteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to favourites</Text>
            <Text style={styles.inputLabel}>Level</Text>
            <TouchableOpacity
              onPress={() => setShowLevelOptions(prev => !prev)}
              style={styles.modalInput}
              activeOpacity={0.7}
            >
              <Text style={{ color: newFavLevelName ? '#111827' : '#9ca3af' }}>
                {newFavLevelName || 'Select level'}
              </Text>
            </TouchableOpacity>
            {showLevelOptions && (
              <View style={[styles.modalInput, { paddingVertical: 0, marginTop: 8 }]}> 
                {['easy','easy-medium','medium','medium-hard','hard'].map((lv) => (
                  <TouchableOpacity
                    key={lv}
                    onPress={() => { setNewFavLevelName(lv); setShowLevelOptions(false); }}
                    style={{ paddingVertical: 10 }}
                  >
                    <Text style={{ color: '#111827' }}>{lv}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newFavName}
              onChangeText={setNewFavName}
              placeholder="Enter a name"
            />
            <Text style={styles.inputLabel}>URL</Text>
            <TextInput
              style={styles.modalInput}
              value={newFavUrl}
              onChangeText={setNewFavUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
              <TouchableOpacity onPress={() => setShowAddFavouriteModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const u = normalizeYouTubeUrl(newFavUrl || currentCanonicalUrl);
                  const nm = (newFavName || '').trim();
                  if (!u) {
                    try { if (Platform.OS === 'android') ToastAndroid.show('Invalid URL', ToastAndroid.SHORT); else Alert.alert('Invalid URL'); } catch {}
                    return;
                  }
                  await addToFavourites(u, nm, newFavLevelName);
                  setShowAddFavouriteModal(false);
                  try { if (Platform.OS === 'android') ToastAndroid.show('Added to favourites', ToastAndroid.SHORT); else Alert.alert('Added'); } catch {}
                }}
                style={[styles.modalCloseBtn, { backgroundColor: '#007AFF' }]}
              >
                <Text style={[styles.modalCloseText, { color: 'white' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    color: '#374151',
    marginTop: 8,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 13,
    color: '#374151',
  },
});

export default VideoScreen;
