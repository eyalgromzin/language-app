import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OPENED_BEFORE_KEY = 'books.openedBefore';

export function useOpenedBeforeMarker(bookId: string | undefined): void {
  useEffect(() => {
    if (!bookId) return;
    return () => {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(OPENED_BEFORE_KEY);
          const map = raw ? JSON.parse(raw) : {};
          const next = { ...(map && typeof map === 'object' ? map : {}), [bookId]: true };
          await AsyncStorage.setItem(OPENED_BEFORE_KEY, JSON.stringify(next));
        } catch {}
      })();
    };
  }, [bookId]);
}
