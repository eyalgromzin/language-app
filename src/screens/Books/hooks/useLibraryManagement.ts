import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLibraryMeta, addUrlToLibrary } from '../../../config/api';
import { normalizeUrl, toLanguageSymbol } from '../../../common';

const BOOK_LIBRARY_STATUS_KEY = 'books.libraryStatus';
const BOOK_URLS_KEY = 'books.bookUrlById';

export function useLibraryManagement(bookId: string | undefined, learningLanguage: string | null, bookTitle: string | null) {
  const [itemTypes, setItemTypes] = useState<string[]>([]);

  // Fetch library metadata for item types
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json: { itemTypes?: string[] } = await getLibraryMeta();
        if (!cancelled && Array.isArray(json.itemTypes)) setItemTypes(json.itemTypes);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const validateType = (t?: string | null): string => {
    const v = (t || '').toLowerCase().trim();
    if (itemTypes.map((x) => x.toLowerCase()).includes(v)) return v;
    return 'any';
  };

  const postAddBookUrlToLibrary = async (url: string, typeName?: string | null, displayName?: string | null) => {
    try {
      const normalizedUrl = normalizeUrl(url);
      if (!normalizedUrl) return;
      const lang = toLanguageSymbol(learningLanguage || '');
      const safeType = validateType(typeName);
      const safeName = (displayName || bookTitle || 'Book').trim() || 'Book';
      await addUrlToLibrary(normalizedUrl, safeType, 'easy', safeName, lang, 'book');

      // Cache that this URL is now in the library
      try {
        const rawStatus = await AsyncStorage.getItem(BOOK_LIBRARY_STATUS_KEY);
        const statusMap = rawStatus ? JSON.parse(rawStatus) : {};
        const nextStatus = { ...statusMap, [normalizedUrl]: true };
        await AsyncStorage.setItem(BOOK_LIBRARY_STATUS_KEY, JSON.stringify(nextStatus));
      } catch {}

      // Persist this URL for future existence checks per book
      if (bookId) {
        try {
          const raw = await AsyncStorage.getItem(BOOK_URLS_KEY);
          const map = raw ? JSON.parse(raw) : {};
          const next = { ...(map && typeof map === 'object' ? map : {}), [bookId]: normalizedUrl };
          await AsyncStorage.setItem(BOOK_URLS_KEY, JSON.stringify(next));
        } catch {}
      }
    } catch {}
  };

  return {
    itemTypes,
    postAddBookUrlToLibrary,
  };
}
