import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'books.library';

export function useBookPosition(bookId: string | undefined) {
  const persistCfi = useCallback(
    async (cfi: string | null) => {
      try {
        if (!bookId) return;
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = json ? JSON.parse(json) : [];
        const books = Array.isArray(parsed) ? parsed : [];
        const next = books.map((b: any) => (b.id === bookId ? { ...b, lastPositionCfi: cfi || undefined } : b));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next, null, 2));
      } catch {
        // ignore
      }
    },
    [bookId]
  );

  const handleLocationChange = useCallback(
    (totalLocations: number, currentLocation: any) => {
      const cfi: string | null = currentLocation?.start?.cfi ?? currentLocation?.end?.cfi ?? null;
      void persistCfi(cfi);
    },
    [persistCfi]
  );

  return {
    handleLocationChange,
  };
}
