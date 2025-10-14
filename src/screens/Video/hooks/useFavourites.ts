import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, ToastAndroid } from 'react-native';
import harmfulWordsService from '../../../services/harmfulWordsService';
import { addUrlToLibrary } from '../../../config/api';

export type FavouriteItem = { 
  url: string; 
  name: string; 
  typeId?: number; 
  typeName?: string; 
  levelName?: string;
};

const FAVOURITES_KEY = 'video.favourites';

type UseFavouritesOptions = {
  normalizeYouTubeUrl: (url: string) => string;
  currentVideoTitle?: string;
  learningLanguage?: string | null;
};

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

export const useFavourites = ({ 
  normalizeYouTubeUrl, 
  currentVideoTitle, 
  learningLanguage 
}: UseFavouritesOptions) => {
  const [favourites, setFavourites] = React.useState<FavouriteItem[]>([]);

  const parseList = React.useCallback((raw: string | null | undefined): FavouriteItem[] => {
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
  }, [normalizeYouTubeUrl]);

  // Load favourites on mount
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet([FAVOURITES_KEY, 'surf.favourites']);
        if (!mounted) return;
        const map = Object.fromEntries(entries);
        const rawVideo = map[FAVOURITES_KEY];
        const rawSurf = map['surf.favourites'];

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
  }, [normalizeYouTubeUrl, parseList]);

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
  }, [normalizeYouTubeUrl, parseList]);

  const addToFavourites = React.useCallback(async (
    favUrl: string, 
    name: string, 
    typeId: number, 
    typeName: string, 
    levelName?: string
  ) => {
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
        
        await addUrlToLibrary(normalized, typeName, safeLevel, safeName, lang, 'youtube');
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

  return {
    favourites,
    addToFavourites,
    removeFromFavourites,
    refreshFavourites,
  };
};

