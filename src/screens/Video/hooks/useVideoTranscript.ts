import React from 'react';
import { getVideoTranscript } from '../videoMethods';

export type TranscriptSegment = { 
  text: string; 
  duration: number; 
  offset: number;
};

type UseVideoTranscriptOptions = {
  videoId: string;
  learningLanguage?: string | null;
  mapLanguageNameToYoutubeCode: (lang: string | null, mappings: any) => string;
  languageMappings: any;
};

export const useVideoTranscript = ({ 
  videoId, 
  learningLanguage, 
  mapLanguageNameToYoutubeCode,
  languageMappings 
}: UseVideoTranscriptOptions) => {
  const [transcript, setTranscript] = React.useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTranscript = React.useCallback(async () => {
    if (!videoId) {
      setTranscript([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const langCode = mapLanguageNameToYoutubeCode(learningLanguage, languageMappings);
      const segments = await getVideoTranscript(videoId, langCode);
      setTranscript(segments);
    } catch (err) {
      setTranscript([]);
      setError('Unable to fetch transcript for this video.');
    } finally {
      setLoading(false);
    }
  }, [videoId, learningLanguage, mapLanguageNameToYoutubeCode, languageMappings]);

  const clearTranscript = React.useCallback(() => {
    setTranscript([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    transcript,
    loading,
    error,
    fetchTranscript,
    clearTranscript,
    setTranscript,
    setLoading,
    setError,
  };
};

