import React from 'react';
import { searchYouTube } from '../../../config/api';
import { enrichWithLengths } from '../videoMethods';

export type SearchResult = {
  url: string;
  thumbnail: string | null;
  title: string;
  description?: string;
  length?: string;
};

export const useVideoSearch = () => {
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = React.useState<boolean>(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  const runYouTubeSearch = React.useCallback(async (rawQuery: string) => {
    const q = (rawQuery || '').trim();
    if (!q) return;
    
    setSearchLoading(true);
    setSearchError(null);
    
    try {
      const data = await searchYouTube(q);
      const results = Array.isArray(data) ? data : Array.isArray((data || {}).results) ? (data.results as any[]) : [];
      const typed = (results as Array<{ url: string; thumbnail: string | null; title: string; description?: string }>)
        .map((r) => ({ ...r }));
      const enriched = await enrichWithLengths(typed);
      setSearchResults(enriched as SearchResult[]);
    } catch (e) {
      setSearchResults([]);
      setSearchError('Failed to search YouTube.');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const clearSearch = React.useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
    setSearchLoading(false);
  }, []);

  return {
    searchResults,
    searchLoading,
    searchError,
    runYouTubeSearch,
    clearSearch,
  };
};

