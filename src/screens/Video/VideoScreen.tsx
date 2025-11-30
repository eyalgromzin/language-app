import React, { useRef } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, TextInput, StyleSheet, Text, Platform, ScrollView, Alert, ToastAndroid } from 'react-native';
import TranslationPanel, { type TranslationPanelState } from '../../components/TranslationPanel';
import { fetchTranslation as fetchTranslationCommon } from '../../utils/translation';
import * as RNFS from 'react-native-fs';
import {
  extractYouTubeVideoId,
  normalizeYouTubeUrl as normalizeYouTubeUrlUtil,
  mapLanguageNameToYoutubeCode as mapLanguageNameToYoutubeCodeUtil,
  enrichWithLengths,
  fetchYouTubeTitleById,
  getVideoTranscript,
} from './videoMethods';
import Transcript from './Transcript';
import { useLoginGate } from '../../contexts/LoginGateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useLanguage } from '../../contexts/LanguageContext';
import wordCountService from '../../services/wordCountService';
import { 
  upsertVideoNowPlaying, 
  getVideoNowPlaying, 
  searchYouTube, 
} from '../../config/api';
import {
  VideoPlayer,
  SuggestionsDropdown,
} from '../../components/Video';
import AddToFavouritesDialog from '../../components/AddToFavouritesDialog';
import VideoOptionsMenu from '../../components/Video/VideoOptionsMenu';
import linkingService from '../../services/linkingService';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import { SearchBar, HelperMessage, ImageScrapeComponent, NewestVideos, NowPlaying, SearchResults } from './components';
import { useFavourites, useHistory, useVideoTranscript, useImageScraper } from './hooks';
import type { FavouriteItem, HistoryEntry } from './hooks';
import type { YoutubeIframeRef } from '../../components/react-native-youtube-iframe-local';

function VideoScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { languageMappings } = useLanguageMappings();
  const { showLoginGate } = useLoginGate();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { learningLanguage, nativeLanguage } = useLanguage();
  const [inputUrl, setInputUrl] = React.useState<string>('');
  const [url, setUrl] = React.useState<string>('');
  const videoId = React.useMemo(() => extractYouTubeVideoId(url) ?? '', [url]);
  const playerRef = useRef<YoutubeIframeRef | null>(null);
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
  const [showHistory, setShowHistory] = React.useState<boolean>(false);
  const [showFavouritesList, setShowFavouritesList] = React.useState<boolean>(false);
  const [nowPlayingVideos, setNowPlayingVideos] = React.useState<Array<{ url: string; thumbnail: string; title: string; description?: string; length?: string }>>([]);
  const [nowPlayingLoading, setNowPlayingLoading] = React.useState<boolean>(false);
  const [nowPlayingError, setNowPlayingError] = React.useState<string | null>(null);
  const [hidePlayback, setHidePlayback] = React.useState<boolean>(false);
  const [showOptionsMenuGlobal, setShowOptionsMenuGlobal] = React.useState<boolean>(false);
  const [optionsButtonPositionGlobal, setOptionsButtonPositionGlobal] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isFullScreen, setIsFullScreen] = React.useState<boolean>(false);
  const [showAddFavouriteModal, setShowAddFavouriteModal] = React.useState<boolean>(false);

  const normalizeYouTubeUrl = React.useCallback(normalizeYouTubeUrlUtil, []);
  const mapLanguageNameToYoutubeCode = React.useCallback(mapLanguageNameToYoutubeCodeUtil, []);

  // Custom hooks
  const { favourites, addToFavourites, removeFromFavourites, refreshFavourites } = useFavourites({ 
    normalizeYouTubeUrl, 
    currentVideoTitle, 
    learningLanguage 
  });
  
  const { savedHistory, saveHistory } = useHistory(currentVideoTitle);
  
  const { 
    transcript, 
    loading: loadingTranscript, 
    error: transcriptError,
    setTranscript,
    setLoading: setLoadingTranscript,
    setError: setTranscriptError,
  } = useVideoTranscript({ 
    videoId, 
    learningLanguage, 
    mapLanguageNameToYoutubeCode,
    languageMappings 
  });

  const { 
    imageScrape, 
    hiddenWebViewRef, 
    fetchImageUrls, 
    onScrapeMessage, 
    onImageScrapeError 
  } = useImageScraper();

  const lastUpsertedUrlRef = React.useRef<string | null>(null);

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
  }, [currentCanonicalUrl, isFavourite, removeFromFavourites, t]);

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
  }, [currentCanonicalUrl, currentVideoTitle, t]);

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
    try { playerRef.current?.seekTo?.(0, true); } catch {}
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
    setCurrentVideoTitle('');
    setIsFullScreen(false);
    try { scrollViewRef.current?.scrollTo?.({ y: 0, animated: false }); } catch {}
  }, [setTranscript, setTranscriptError]);

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
    try { playerRef.current?.seekTo?.(segmentOffset, true); } catch {}
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
        playerRef.current?.seekTo?.(0, true);
      } catch {}
      setIsPlaying(false);
      return;
    }
  }, [inputUrl, videoId, transcript.length, isPlaying, currentPlayerTime, learningLanguage, languageMappings]);

  


  const onSelectHistory = (entry: HistoryEntry) => {
    setShowHistory(false);
    openStartupVideo(entry.url, entry.title);
  };

  const onSelectFavourite = (fav: FavouriteItem) => {
    setShowFavouritesList(false);
    openStartupVideo(fav.url, fav.name);
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
        <HelperMessage t={t} />
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

      {!isFullScreen && !searchLoading && !searchError && searchResults.length === 0 ? (
        <NowPlaying
          videos={nowPlayingVideos}
          loading={nowPlayingLoading}
          error={nowPlayingError}
          onVideoPress={openStartupVideo}
          t={t}
        />
      ) : null}

      <ImageScrapeComponent
        imageScrape={imageScrape}
        hiddenWebViewRef={hiddenWebViewRef}
        onScrapeMessage={onScrapeMessage}
        onImageScrapeError={onImageScrapeError}
      />

      <SearchResults
        videos={searchResults}
        loading={searchLoading}
        error={searchError}
        onVideoPress={openStartupVideo}
        t={t}
      />

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
});

export default VideoScreen;
