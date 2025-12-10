import React from 'react';
import { extractYouTubeVideoId, fetchYouTubeTitleById, getVideoTranscript } from '../videoMethods';
import { upsertVideoNowPlaying } from '../../../config/api';
import type { YoutubeIframeRef } from 'react-native-youtube-iframe';
import type { TranscriptSegment } from './useVideoTranscript';

type UseVideoActionsOptions = {
  url: string;
  inputUrl: string;
  setUrl: (url: string) => void;
  setInputUrl: (url: string) => void;
  setCurrentVideoTitle: (title: string) => void;
  setHidePlayback: (hide: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  playerRef: React.RefObject<YoutubeIframeRef | null>;
  setTranscript: (transcript: TranscriptSegment[]) => void;
  setTranscriptError: (error: string | null) => void;
  setLoadingTranscript: (loading: boolean) => void;
  learningLanguage?: string | null;
  mapLanguageNameToYoutubeCode: (lang: string | null, mappings: any) => string;
  languageMappings: any;
  currentVideoTitle: string;
  saveHistory: (url: string, title?: string) => Promise<void>;
  transcript: TranscriptSegment[];
  isPlaying: boolean;
  currentPlayerTime: number;
  runYouTubeSearch: (query: string) => void;
};

export const useVideoActions = ({
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
}: UseVideoActionsOptions) => {
  const lastUpsertedUrlRef = React.useRef<string | null>(null);

  const openStartupVideo = React.useCallback(async (urlString: string, title?: string) => {
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
      const langCode = mapLanguageNameToYoutubeCode(learningLanguage ?? null, languageMappings);
      const segments = await getVideoTranscript(id, langCode);
      setTranscript(segments);
    } catch (err) {
      setTranscript([]);
      setTranscriptError('Unable to fetch transcript for this video.');
    } finally {
      setLoadingTranscript(false);
    }
    try { await saveHistory(urlString, title); } catch {}
  }, [
    setCurrentVideoTitle,
    setInputUrl,
    setUrl,
    setHidePlayback,
    setTranscript,
    setTranscriptError,
    setLoadingTranscript,
    setIsPlaying,
    learningLanguage,
    mapLanguageNameToYoutubeCode,
    languageMappings,
    saveHistory,
  ]);

  const upsertNowPlayingForCurrent = React.useCallback(async () => {
    try {
      const videoUrl = (url || inputUrl || '').trim();
      if (!videoUrl) return;
      if (lastUpsertedUrlRef.current === videoUrl) return;
      lastUpsertedUrlRef.current = videoUrl;

      const symbol = mapLanguageNameToYoutubeCode(learningLanguage ?? null, languageMappings);
      const title = (currentVideoTitle && currentVideoTitle.trim()) ? currentVideoTitle : videoUrl;

      await upsertVideoNowPlaying(videoUrl, title, symbol);
    } catch {}
  }, [url, inputUrl, learningLanguage, currentVideoTitle, mapLanguageNameToYoutubeCode, languageMappings]);

  const handleSubmit = React.useCallback(() => {
    const id = extractYouTubeVideoId(inputUrl);
    if (!id) {
      setHidePlayback(true);
      return runYouTubeSearch(inputUrl);
    }
    setHidePlayback(false);
    setUrl(inputUrl);
  }, [inputUrl, runYouTubeSearch, setHidePlayback, setUrl]);

  const handleOpenPress = React.useCallback(() => {
    const id = extractYouTubeVideoId(inputUrl);
    if (!id) {
      setHidePlayback(true);
      runYouTubeSearch(inputUrl);
      return;
    }

    const videoId = extractYouTubeVideoId(url);
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
            const langCode = mapLanguageNameToYoutubeCode(learningLanguage ?? null, languageMappings);
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
          const langCode = mapLanguageNameToYoutubeCode(learningLanguage ?? null, languageMappings);
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
  }, [
    inputUrl,
    url,
    transcript.length,
    isPlaying,
    currentPlayerTime,
    learningLanguage,
    languageMappings,
    mapLanguageNameToYoutubeCode,
    setHidePlayback,
    setUrl,
    setCurrentVideoTitle,
    setLoadingTranscript,
    setTranscriptError,
    setTranscript,
    setIsPlaying,
    saveHistory,
    currentVideoTitle,
    runYouTubeSearch,
    playerRef,
  ]);

  return {
    openStartupVideo,
    upsertNowPlayingForCurrent,
    handleSubmit,
    handleOpenPress,
  };
};

