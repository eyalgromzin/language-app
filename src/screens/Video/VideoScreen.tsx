import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, Platform, ScrollView, Alert, ToastAndroid } from 'react-native';
import TranslationPanel from '../../components/TranslationPanel';
import {
  extractYouTubeVideoId,
  normalizeYouTubeUrl as normalizeYouTubeUrlUtil,
  mapLanguageNameToYoutubeCode as mapLanguageNameToYoutubeCodeUtil,
} from './videoMethods';
import Transcript from './Transcript';
import { useLoginGate } from '../../contexts/LoginGateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  VideoPlayer,
  SuggestionsDropdown,
} from '../../components/Video';
import AddToFavouritesDialog from '../../components/AddToFavouritesDialog';
import VideoOptionsMenu from '../../components/Video/VideoOptionsMenu';
import linkingService from '../../services/linkingService';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import { SearchBar, HelperMessage, ImageScrapeComponent, NowPlaying, SearchResults } from './components';
import {
  useFavourites,
  useHistory,
  useVideoTranscript,
  useImageScraper,
  useVideoState,
  useVideoSearch,
  useNowPlaying,
  useTranslationPanel,
  useVideoActions,
} from './hooks';
import type { FavouriteItem, HistoryEntry } from './hooks';

function VideoScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { languageMappings } = useLanguageMappings();
  const { showLoginGate } = useLoginGate();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { learningLanguage, nativeLanguage } = useLanguage();

  const normalizeYouTubeUrl = React.useCallback(normalizeYouTubeUrlUtil, []);
  const mapLanguageNameToYoutubeCode = React.useCallback(mapLanguageNameToYoutubeCodeUtil, []);

  // Video state management
  const videoState = useVideoState();
  const {
    inputUrl,
    setInputUrl,
    url,
    setUrl,
    videoId,
    playerRef,
    playerReady,
    setPlayerReady,
    currentPlayerTime,
    setCurrentPlayerTime,
    activeTranscriptIndex,
    setActiveTranscriptIndex,
    scrollViewRef,
    lineOffsetsRef,
    urlInputRef,
    isPlaying,
    setIsPlaying,
    currentVideoTitle,
    setCurrentVideoTitle,
    hidePlayback,
    setHidePlayback,
    isFullScreen,
    setIsFullScreen,
    isInputFocused,
    setIsInputFocused,
    showHistory,
    setShowHistory,
    showFavouritesList,
    setShowFavouritesList,
    showOptionsMenuGlobal,
    setShowOptionsMenuGlobal,
    optionsButtonPositionGlobal,
    setOptionsButtonPositionGlobal,
    showAddFavouriteModal,
    setShowAddFavouriteModal,
  } = videoState;

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

  const { searchResults, searchLoading, searchError, runYouTubeSearch } = useVideoSearch();

  const { nowPlayingVideos, nowPlayingLoading, nowPlayingError } = useNowPlaying({
    learningLanguage,
    mapLanguageNameToYoutubeCode,
    languageMappings,
  });

  const {
    translationPanel,
    selectedWordKey,
    setSelectedWordKey,
    openPanel,
    saveCurrentWord,
    closePanel,
  } = useTranslationPanel({
    learningLanguage,
    nativeLanguage,
    languageMappings,
    showLoginGate,
    isAuthenticated,
    fetchImageUrls,
  });

  const {
    openStartupVideo,
    upsertNowPlayingForCurrent,
    handleSubmit,
    handleOpenPress,
  } = useVideoActions({
    url,
    inputUrl,
    setUrl,
    setInputUrl,
    setCurrentVideoTitle,
    setHidePlayback,
    setIsPlaying,
    playerRef,
    setTranscript,
    setTranscriptError,
    setLoadingTranscript,
    learningLanguage,
    mapLanguageNameToYoutubeCode,
    languageMappings,
    currentVideoTitle,
    saveHistory,
    transcript,
    isPlaying,
    currentPlayerTime,
    runYouTubeSearch,
  });

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
  }, [currentCanonicalUrl, isFavourite, removeFromFavourites, t, setShowAddFavouriteModal]);

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

  // Set up minute-based upsert timer
  React.useEffect(() => {
    if (!isPlaying || !url || !learningLanguage) {
      return;
    }
    upsertNowPlayingForCurrent();
  }, [isPlaying, url, learningLanguage, upsertNowPlayingForCurrent]);

  



  React.useEffect(() => {
    if (!videoId) {
      setTranscript([]);
      setTranscriptError(null);
      setLoadingTranscript(false);
      return;
    }
    // Intentionally do not auto-fetch here to avoid duplicate/conflicting requests.
    // Fetch is performed explicitly via sendGetTranscript when user presses Go.
  }, [videoId, setTranscript, setTranscriptError, setLoadingTranscript]);

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
    closePanel();
    setCurrentVideoTitle('');
    setIsFullScreen(false);
    try { scrollViewRef.current?.scrollTo?.({ y: 0, animated: false }); } catch {}
  }, [
    playerRef,
    setIsPlaying,
    setPlayerReady,
    setCurrentPlayerTime,
    setActiveTranscriptIndex,
    lineOffsetsRef,
    setInputUrl,
    setUrl,
    setTranscript,
    setTranscriptError,
    setSelectedWordKey,
    closePanel,
    setCurrentVideoTitle,
    setIsFullScreen,
    scrollViewRef,
  ]);

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

  

  


  const handleTranscriptPressOnWord = React.useCallback((payload: { key: string; segmentOffset: number; word: string; sentence: string }) => {
    const { key, segmentOffset, word, sentence } = payload;
    setSelectedWordKey(key);
    // Only seek if video is currently playing - don't start playback if it's paused
    if (isPlaying) {
      try { playerRef.current?.pauseVideo?.(); } catch {}
      try { playerRef.current?.seekTo?.(segmentOffset, true); } catch {}
    }
    setIsPlaying(false);
    setCurrentPlayerTime(segmentOffset);
    openPanel(word, sentence);
  }, [openPanel, isPlaying, setSelectedWordKey, setIsPlaying, setCurrentPlayerTime, playerRef]);

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


  


  const onSelectHistory = (entry: HistoryEntry) => {
    setShowHistory(false);
    openStartupVideo(entry.url, entry.title);
  };

  const onSelectFavourite = (fav: FavouriteItem) => {
    setShowFavouritesList(false);
    openStartupVideo(fav.url, fav.name);
  };

  return (
    <View style={styles.wrapper}>
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

        {!isFullScreen && (
          <SearchResults
            videos={searchResults}
            loading={searchLoading}
            error={searchError}
            onVideoPress={openStartupVideo}
            t={t}
          />
        )}

        {/* {!isPlaying && !hidePlayback && !nowPlayingLoading && !nowPlayingError && nowPlayingVideos.length === 0 && <NewestVideos />} */}

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
      
      <TranslationPanel
        panel={translationPanel}
        onSave={saveCurrentWord}
        onClose={closePanel}
        onRetranslate={(word: string) => {
          openPanel(word, translationPanel?.sentence);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
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
