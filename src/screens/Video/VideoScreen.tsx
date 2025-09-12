import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, TextInput, StyleSheet, Text, Platform, ScrollView, TouchableOpacity, Alert, ToastAndroid, NativeModules } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TranslationPanel, { type TranslationPanelState } from '../../components/TranslationPanel';
import { fetchTranslation as fetchTranslationCommon } from '../../utils/translation';
import * as RNFS from 'react-native-fs';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { parseYandexImageUrlsFromHtml, fetchImageUrls as fetchImageUrlsCommon, type ImageScrapeCallbacks } from '../practice/common';
import {
  extractYouTubeVideoId,
  normalizeYouTubeUrl as normalizeYouTubeUrlUtil,
  mapLanguageNameToYoutubeCode as mapLanguageNameToYoutubeCodeUtil,
  enrichWithLengths,
  getVideoTranscript,
  fetchYouTubeTitleById,
  imageScrapeInjection,
} from './videoMethods';
import Transcript from './Transcript';
import harmfulWordsService from '../../services/harmfulWordsService';
import { useLoginGate } from '../../contexts/LoginGateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import wordCountService from '../../services/wordCountService';
import { 
  upsertVideoNowPlaying, 
  getVideoNowPlaying, 
  searchYouTube, 
  addUrlToLibrary 
} from '../../config/api';
import {
  VideoPlayer,
  VideoList,
  SuggestionsDropdown,
  ImageScrape,
} from '../../components/Video';
import AddToFavouritesDialog from '../../components/AddToFavouritesDialog';
import VideoOptionsMenu from '../../components/Video/VideoOptionsMenu';
import linkingService from '../../services/linkingService';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';



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
  onOptionsButtonPress: (position: { x: number; y: number; width: number; height: number }) => void;
  currentCanonicalUrl: string;
  t: (key: string) => string;
};

const SearchBar: React.FC<SearchBarProps> = ({ inputUrl, onChangeText, onSubmit, onOpenPress, urlInputRef, onFocus, onBlur, onOpenLibrary, onToggleHistory, onToggleFavouritesList, showAuxButtons, isFavourite, onToggleFavourite, onOptionsButtonPress, currentCanonicalUrl, t }) => {
  const [showOptionsMenu, setShowOptionsMenu] = React.useState(false);
  const [optionsButtonPosition, setOptionsButtonPosition] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const optionsButtonRef = React.useRef<any>(null);

  return (
    <>
      <View style={styles.searchSection}>
        <View style={styles.inputRow}>
          <TextInput
            ref={urlInputRef}
            value={inputUrl}
            onChangeText={onChangeText}
            placeholder={t('screens.video.searchPlaceholder')}
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={Platform.OS === 'ios' ? 'url' : 'default'}
            style={[styles.input, { flex: 1 }]}
            accessibilityLabel={t('screens.video.accessibilityLabels.youtubeUrlInput')}
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
            accessibilityLabel={t('screens.video.accessibilityLabels.openVideo')}
          >
            <Text style={styles.goButtonText}>{t('screens.video.goButton')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleFavourite}
            style={[styles.libraryBtn, !currentCanonicalUrl && styles.libraryBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel={isFavourite ? t('screens.video.removeFromFavourites') : t('screens.video.addToFavourites')}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            disabled={!currentCanonicalUrl}
          >
            <Ionicons 
              name={isFavourite ? 'star' : 'star-outline'} 
              size={20} 
              color={!currentCanonicalUrl ? '#cbd5e1' : (isFavourite ? '#f59e0b' : '#64748b')} 
            />
          </TouchableOpacity>
          {showAuxButtons ? (
            <>
              <TouchableOpacity
                onPress={onOpenLibrary}
                style={styles.libraryBtn}
                accessibilityRole="button"
                accessibilityLabel={t('screens.video.accessibilityLabels.openLibrary')}
                hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
              >
                <Ionicons name="albums-outline" size={20} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity
                ref={optionsButtonRef}
                onPress={() => {
                  if (optionsButtonRef.current) {
                    optionsButtonRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                      onOptionsButtonPress({ x: pageX, y: pageY, width, height });
                    });
                  }
                }}
                style={styles.libraryBtn}
                accessibilityRole="button"
                accessibilityLabel={t('screens.video.accessibilityLabels.openMenu')}
                hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
              >
                <Ionicons name="ellipsis-vertical" size={18} color="#64748b" />
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </>
  );
};

function VideoScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { languageMappings } = useLanguageMappings();
  const { showLoginGate } = useLoginGate();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
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
  const [currentPlayerTime, setCurrentPlayerTime] = React.useState<number>(0);
  const [activeTranscriptIndex, setActiveTranscriptIndex] = React.useState<number | null>(null);
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
  const [showOptionsMenuGlobal, setShowOptionsMenuGlobal] = React.useState<boolean>(false);
  const [optionsButtonPositionGlobal, setOptionsButtonPositionGlobal] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isFullScreen, setIsFullScreen] = React.useState<boolean>(false);

  
  type FavouriteItem = { url: string; name: string; typeId?: number; typeName?: string; levelName?: string };
  const FAVOURITES_KEY = 'video.favourites';
  const [favourites, setFavourites] = React.useState<FavouriteItem[]>([]);
  const [showAddFavouriteModal, setShowAddFavouriteModal] = React.useState<boolean>(false);

  const normalizeYouTubeUrl = React.useCallback(normalizeYouTubeUrlUtil, []);

  const validateLevel = (l?: string | number | null): string => {
    const LEVELS = ['easy','easy-medium','medium','medium-hard','hard'] as const;
    if (typeof l === 'number') {
      const byIndex = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, l - 1))];
      return byIndex || 'easy';
    }
    const v = (l || '').toLowerCase().trim();
    return (LEVELS as readonly string[]).includes(v) ? v : 'easy';
  };

  const toLanguageSymbol = (input: string | null): 'en' | 'es' => {
    const v = (input || '').toLowerCase().trim();
    if (v === 'es' || v === 'spanish') return 'es';
    if (v === 'en' || v === 'english') return 'en';
    if (v === 'español') return 'es';
    return 'en';
  };

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

  const refreshFavourites = React.useCallback(async () => {
    try {
      const entries = await AsyncStorage.multiGet([FAVOURITES_KEY, 'surf.favourites']);
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
    } catch (error) {
      console.error('Failed to refresh favourites:', error);
    }
  }, [normalizeYouTubeUrl]);

  const addToFavourites = React.useCallback(async (favUrl: string, name: string, typeId: number, typeName: string, levelName?: string) => {
    if (!favUrl) return;
    
    // Check for harmful words in the URL
    try {
      const checkResult = await harmfulWordsService.checkUrl(favUrl);
      if (checkResult.isHarmful) {
        const message = `This URL contains inappropriate content and cannot be saved to favorites. Blocked words: ${checkResult.matchedWords.join(', ')}`;
        if (Platform.OS === 'android') {
          ToastAndroid.show(message, ToastAndroid.LONG);
        } else {
          Alert.alert('Content Blocked', message);
        }
        return;
      }
    } catch (error) {
      console.error('Failed to check URL for harmful content:', error);
      // Continue with adding to favorites if check fails
    }
    
    const normalized = normalizeYouTubeUrl(favUrl);
    const safeName = (name || currentVideoTitle || '').trim() || normalized;
    const next: FavouriteItem[] = [
      { url: normalized, name: safeName, typeId, typeName, levelName: levelName || undefined },
      ...favourites.filter((f) => f.url !== normalized),
    ].slice(0, 200);
    await saveFavourites(next);
    
    // Also add to library if learning language is available
    if (learningLanguage) {
      try {
        const lang = toLanguageSymbol(learningLanguage);
        const safeLevel = levelName ? validateLevel(levelName) : 'easy';
        
        await addUrlToLibrary(normalized, typeName, safeLevel, safeName, lang, 'video');
      } catch (libraryError) {
        console.error('Failed to add URL to library:', libraryError);
        // Don't fail the entire operation if library addition fails
      }
    }
  }, [normalizeYouTubeUrl, currentVideoTitle, favourites, saveFavourites, learningLanguage]);

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
      try { if (Platform.OS === 'android') ToastAndroid.show(t('screens.video.invalidUrl'), ToastAndroid.SHORT); else Alert.alert(t('screens.video.invalidUrl')); } catch {}
      return;
    }
    if (isFavourite) {
      const onYes = async () => {
        await removeFromFavourites(targetUrl);
        try { if (Platform.OS === 'android') ToastAndroid.show(t('screens.video.removedFromFavourites'), ToastAndroid.SHORT); else Alert.alert(t('screens.video.removed')); } catch {}
      };
      try {
        Alert.alert(
          t('screens.video.favourites'),
          t('screens.video.alreadyInFavouritesRemove'),
          [
            { text: t('screens.video.no'), style: 'cancel' },
            { text: t('screens.video.yes'), onPress: onYes },
          ],
          { cancelable: true },
        );
      } catch {
        onYes();
      }
      return;
    }
    setShowAddFavouriteModal(true);
  }, [currentCanonicalUrl, isFavourite, removeFromFavourites, addToFavourites, currentVideoTitle]);

  const onShareVideo = React.useCallback(async () => {
    const targetUrl = currentCanonicalUrl;
    if (!targetUrl) {
      try { if (Platform.OS === 'android') ToastAndroid.show(t('screens.video.noVideoToShare'), ToastAndroid.SHORT); else Alert.alert(t('screens.video.noVideoToShare')); } catch {}
      return;
    }
    
    try {
      await linkingService.shareVideo(targetUrl, currentVideoTitle);
    } catch (error) {
      console.error('Error sharing video:', error);
      try { if (Platform.OS === 'android') ToastAndroid.show(t('screens.video.failedToShareVideo'), ToastAndroid.SHORT); else Alert.alert(t('screens.video.failedToShareVideo')); } catch {}
    }
  }, [currentCanonicalUrl, currentVideoTitle]);

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
      const videoUrl = (url || inputUrl || '').trim();
      if (!videoUrl) return;
      if (lastUpsertedUrlRef.current === videoUrl) return;
      lastUpsertedUrlRef.current = videoUrl;

      const symbol = mapLanguageNameToYoutubeCode(learningLanguage, languageMappings);
      const title = (currentVideoTitle && currentVideoTitle.trim()) ? currentVideoTitle : videoUrl;

      await upsertVideoNowPlaying(videoUrl, title, symbol);
    } catch {}
  }, [url, inputUrl, learningLanguage, currentVideoTitle, videoId, mapLanguageNameToYoutubeCode, languageMappings]);

  // Set up minute-based upsert timer
  React.useEffect(() => {
    if (!isPlaying || !url || !learningLanguage) {
      return;
    }

    const upsertNowPlayingVideo = async () => {
      try {
        const videoUrl = (url || inputUrl || '').trim();
        if (!videoUrl) return;

        const symbol = mapLanguageNameToYoutubeCode(learningLanguage, languageMappings);
        const title = (currentVideoTitle && currentVideoTitle.trim()) ? currentVideoTitle : videoUrl;

        await upsertVideoNowPlaying(videoUrl, title, symbol);
      } catch (error) {
        console.error('Failed to upsert now playing:', error);
      }
    }; // Every minute

    upsertNowPlayingVideo();

  }, [isPlaying, languageMappings]);

  



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
  }, [videoId, learningLanguage, mapLanguageNameToYoutubeCode, languageMappings]);

  React.useEffect(() => {
    let cancelled = false;
    const fetchNowPlaying = async (langSymbol: string) => {
      setNowPlayingLoading(true);
      setNowPlayingError(null);
      try {
        const data = await getVideoNowPlaying(langSymbol);
        const results = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
        const normalized = (results as any[]).map(r => ({
          url: r.url,
          thumbnail: (r.thumbnail ?? r.thumbnailUrl ?? '') as string,
          title: r.title,
          description: r.description,
          length: r.length,
        }));
        // getting time for each video takes a long time - should save it in the server with video length already 
        if (!cancelled) setNowPlayingVideos(normalized);
      } catch (e) {
        console.error('Failed to load now-playing videos:', e);
        if (!cancelled) {
          setNowPlayingVideos([]);
          setNowPlayingError('Failed to load now-playing videos.');
        }
      } finally {
        if (!cancelled) setNowPlayingLoading(false);
      }
    };

    if(!learningLanguage) return;
    
    const symbol = mapLanguageNameToYoutubeCode(learningLanguage, languageMappings);
    fetchNowPlaying(symbol);
    return () => { cancelled = true; };
  }, [learningLanguage, mapLanguageNameToYoutubeCode, enrichWithLengths, languageMappings]);

  const fetchTranslation = async (word: string): Promise<string> => fetchTranslationCommon(word, learningLanguage, nativeLanguage, languageMappings);

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
      const langCode = mapLanguageNameToYoutubeCode(learningLanguage, languageMappings);
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
    setCurrentPlayerTime(0);
    setActiveTranscriptIndex(null);
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

  const handleTranscriptPressOnWord = React.useCallback((payload: { key: string; segmentOffset: number; word: string; sentence: string }) => {
    const { key, segmentOffset, word, sentence } = payload;
    setSelectedWordKey(key);
    try { playerRef.current?.pauseVideo?.(); } catch {}
    try { playerRef.current?.seekTo?.(segmentOffset); } catch {}
    setIsPlaying(false);
    setCurrentPlayerTime(segmentOffset);
    openPanel(word, sentence);
  }, [openPanel]);

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
          setCurrentPlayerTime(t);
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
      setActiveTranscriptIndex(null);
      return;
    }
    const idx = transcript.findIndex((seg) => currentPlayerTime + 2 >= seg.offset && currentPlayerTime + 2< seg.offset + seg.duration);
    if (idx !== -1) {
      setActiveTranscriptIndex(idx);
      return;
    }
    let lastIdx: number | null = null;
    for (let i = 0; i < transcript.length; i++) {
      if (currentPlayerTime >= transcript[i].offset) lastIdx = i;
      else break;
    }
    setActiveTranscriptIndex(lastIdx);
  }, [currentPlayerTime, transcript]);

  React.useEffect(() => {
    if (activeTranscriptIndex == null) return;
    const y = lineOffsetsRef.current[activeTranscriptIndex];
    if (typeof y !== 'number') return;
    try {
      scrollViewRef.current?.scrollTo?.({ y: Math.max(y - 80, 0), animated: true });
    } catch {}
  }, [activeTranscriptIndex]);

  const runYouTubeSearch = React.useCallback((rawQuery: string) => {
    const q = (rawQuery || '').trim();
    if (!q) return;
    setSearchLoading(true);
    setSearchError(null);
    (async () => {
      try {
        const data = await searchYouTube(q);
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
            const langCode = mapLanguageNameToYoutubeCode(learningLanguage, languageMappings);
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
          const langCode = mapLanguageNameToYoutubeCode(learningLanguage, languageMappings);
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

    if (isPlaying || (typeof currentPlayerTime === 'number' && currentPlayerTime > 0.1)) {
      try {
        playerRef.current?.seekTo?.(0);
      } catch {}
      setIsPlaying(false);
      return;
    }
  }, [inputUrl, videoId, transcript.length, isPlaying, currentPlayerTime, learningLanguage, languageMappings]);

  

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
      <VideoList
        title={t('screens.video.newestVideos')}
        videos={startupVideos}
        loading={startupVideosLoading}
        error={startupVideosError}
        onVideoPress={openStartupVideo}
        emptyMessage={t('screens.video.noVideosYet')}
      />
    );
  };

  const NowPlaying = () => {
    return (
      <VideoList
        title={t('screens.video.nowPlayingByOthers')}
        videos={nowPlayingVideos}
        loading={nowPlayingLoading}
        error={nowPlayingError}
        onVideoPress={openStartupVideo}
        emptyMessage={t('screens.video.appJustStarted')}
      />
    );
  };

  const SearchResults = () => {
    if (!searchLoading && !searchError && searchResults.length === 0) return null;
    return (
      <VideoList
        title={t('screens.video.searchResults')}
        videos={searchResults}
        loading={searchLoading}
        error={searchError}
        onVideoPress={openStartupVideo}
        emptyMessage={t('screens.video.noResults')}
      />
    );
  };

  

  const ImageScrapeComponent = () => {
    return (
      <ImageScrape
        imageScrape={imageScrape}
        hiddenWebViewRef={hiddenWebViewRef}
        onScrapeMessage={onScrapeMessage}
        onImageScrapeError={() => {
          imageScrapeRejectRef.current?.();
          imageScrapeResolveRef.current = null;
          imageScrapeRejectRef.current = null;
          setImageScrape(null);
        }}
      />
    );
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
      showsVerticalScrollIndicator={false}
    >
      {!isFullScreen && (
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
           onOptionsButtonPress={(position) => {
             setOptionsButtonPositionGlobal(position);
             setShowOptionsMenuGlobal(true);
           }}
           currentCanonicalUrl={currentCanonicalUrl}
           t={t}
        />
      )}
      {!isFullScreen && (
        <SuggestionsDropdown
          showHistory={showHistory}
          showFavourites={showFavouritesList}
          isInputFocused={isInputFocused}
          savedHistory={savedHistory}
          favourites={favourites}
          onSelectHistory={onSelectHistory}
          onSelectFavourite={onSelectFavourite}
        />
      )}
      {videoId && !hidePlayback ? (
        <VideoPlayer
          videoId={videoId}
          isPlaying={isPlaying}
          currentVideoTitle={currentVideoTitle}
          playerRef={playerRef}
          onReady={() => setPlayerReady(true)}
          onChangeState={(state: string) => {
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
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(prev => !prev)}
        />
      ) : (
        <View style={styles.helperContainer}>
          <Text style={styles.helper}>{t('screens.video.enterYouTubeUrlOrSearch')}</Text>
          <Text style={styles.helperSubtext}>{t('screens.video.pasteYouTubeLink')}</Text>
        </View>
      )}

      {!hidePlayback && (
        <Transcript
          videoId={videoId}
          loading={loadingTranscript}
          error={transcriptError}
          transcript={transcript}
          activeIndex={activeTranscriptIndex}
          selectedWordKey={selectedWordKey}
          onWordPress={handleTranscriptPressOnWord}
          scrollViewRef={scrollViewRef}
          lineOffsetsRef={lineOffsetsRef}
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(prev => !prev)}
        />
      )}

      {!isFullScreen && !searchLoading && !searchError && searchResults.length === 0 ? <NowPlaying /> : null}

      <ImageScrapeComponent />

      <SearchResults />

      {/* {!isPlaying && !hidePlayback && !nowPlayingLoading && !nowPlayingError && nowPlayingVideos.length === 0 && <NewestVideos />} */}

              <TranslationPanel
          panel={translationPanel}
          onSave={saveCurrentWord}
          onClose={() => setTranslationPanel(null)}
          onRetranslate={(word: string) => {
            openPanel(word, translationPanel?.sentence);
          }}
        />

      <AddToFavouritesDialog
        visible={showAddFavouriteModal}
        onClose={() => setShowAddFavouriteModal(false)}
        onSuccess={async () => {
          await refreshFavourites();
          if (Platform.OS === 'android') {
            ToastAndroid.show(t('screens.video.addedToFavourites'), ToastAndroid.SHORT);
          } else {
            Alert.alert(t('screens.video.added'));
          }
        }}
        defaultUrl={currentCanonicalUrl}
        defaultName={currentVideoTitle || ''}
        defaultType="video"
        defaultLevel="easy"
        learningLanguage={learningLanguage}
        storageKey="video.favourites"
      />

      <VideoOptionsMenu
        visible={showOptionsMenuGlobal}
        onClose={() => setShowOptionsMenuGlobal(false)}
        onToggleHistory={() => { setShowHistory(prev => !prev); setShowFavouritesList(false); }}
        onToggleFavouritesList={() => { setShowFavouritesList(prev => !prev); setShowHistory(false); }}
        onShare={onShareVideo}
        canShare={!!currentCanonicalUrl}
        buttonPosition={optionsButtonPositionGlobal}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 24,
    backgroundColor: '#f8fafc',
    minHeight: '100%',
    paddingBottom: 40,
  },
  searchSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 16,
    color: '#1a202c',
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 0,
    backgroundColor: '#ffffff',
    color: '#2d3748',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  libraryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  libraryBtnPressed: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    transform: [{ scale: 0.95 }],
  },
  libraryBtnDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  goButton: {
    marginLeft: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#dc2626',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  goButtonPressed: {
    backgroundColor: '#b91c1c',
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.15,
  },
  goButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  helperContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  helper: {
    color: '#475569',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 8,
  },
  helperSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    maxWidth: 280,
  },
  transcriptBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    padding: 20,
    maxHeight: 240,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  transcriptLine: {
    fontSize: 16,
    color: '#2d3748',
    lineHeight: 26,
    marginBottom: 10,
    fontWeight: '400',
  },
  transcriptLineActive: {
    color: '#2563eb',
    fontWeight: '600',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  transcriptWordSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  transcriptTime: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default VideoScreen;
