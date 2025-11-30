import React from 'react';
import { getVideoNowPlaying } from '../../../config/api';

export type NowPlayingVideo = {
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
  length?: string;
};

type UseNowPlayingOptions = {
  learningLanguage?: string | null;
  mapLanguageNameToYoutubeCode: (lang: string | null, mappings: any) => string;
  languageMappings: any;
};

export const useNowPlaying = ({
  learningLanguage,
  mapLanguageNameToYoutubeCode,
  languageMappings,
}: UseNowPlayingOptions) => {
  const [nowPlayingVideos, setNowPlayingVideos] = React.useState<NowPlayingVideo[]>([]);
  const [nowPlayingLoading, setNowPlayingLoading] = React.useState<boolean>(false);
  const [nowPlayingError, setNowPlayingError] = React.useState<string | null>(null);

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

    if (!learningLanguage) return;
    
    const symbol = mapLanguageNameToYoutubeCode(learningLanguage, languageMappings);
    fetchNowPlaying(symbol);
    return () => { cancelled = true; };
  }, [learningLanguage, mapLanguageNameToYoutubeCode, languageMappings]);

  return {
    nowPlayingVideos,
    nowPlayingLoading,
    nowPlayingError,
  };
};

