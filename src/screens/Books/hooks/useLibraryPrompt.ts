import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchLibraryWithCriterias } from '../../../config/api';
import { toLanguageSymbol, normalizeUrl } from '../../../common';

const OPENED_BEFORE_KEY = 'books.openedBefore';
const BOOK_LIBRARY_STATUS_KEY = 'books.libraryStatus';
const PROMPT_TS_KEY = 'books.addUrlPromptedAt';
const BOOK_URLS_KEY = 'books.bookUrlById';

export function useLibraryPrompt(
  bookId: string | undefined,
  learningLanguage: string | null,
  bookTitle: string | null,
  onShowAddBookModal: () => void
): void {
  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;
    const nowIso = new Date().toISOString();
    const markPromptShownNow = async () => {
      try {
        const raw = await AsyncStorage.getItem(PROMPT_TS_KEY);
        const map = raw ? JSON.parse(raw) : {};
        const next = { ...(map && typeof map === 'object' ? map : {}), [bookId]: nowIso };
        await AsyncStorage.setItem(PROMPT_TS_KEY, JSON.stringify(next));
      } catch {}
    };
    (async () => {
      try {
        // Guard: only prompt starting from the 2nd time the user opens this book
        try {
          const rawOpened = await AsyncStorage.getItem(OPENED_BEFORE_KEY);
          const openedMap = rawOpened ? JSON.parse(rawOpened) : {};
          const openedBefore = !!(openedMap && typeof openedMap === 'object' && openedMap[bookId]);
          if (!openedBefore) return; // first open -> do not prompt
        } catch {}

        // 1) Check last prompt timestamp
        const rawTs = await AsyncStorage.getItem(PROMPT_TS_KEY);
        const tsMap = rawTs ? JSON.parse(rawTs) : {};
        const lastIso: string | undefined = tsMap && typeof tsMap === 'object' ? tsMap[bookId] : undefined;
        if (lastIso) {
          const last = new Date(lastIso).getTime();
          const weekMs = 7 * 24 * 60 * 60 * 1000;
          if (Number.isFinite(last) && Date.now() - last < weekMs) return; // Not yet time
        }

        // 2) Resolve a previously saved URL for this book, if any
        const rawUrls = await AsyncStorage.getItem(BOOK_URLS_KEY);
        const urlMap = rawUrls ? JSON.parse(rawUrls) : {};
        const savedUrl: string | undefined = urlMap && typeof urlMap === 'object' ? urlMap[bookId] : undefined;

        const normalizedSaved = savedUrl ? normalizeUrl(savedUrl) : '';
        let existsInLibrary = false;

        // First check local storage for cached library status
        if (normalizedSaved) {
          try {
            const rawStatus = await AsyncStorage.getItem(BOOK_LIBRARY_STATUS_KEY);
            const statusMap = rawStatus ? JSON.parse(rawStatus) : {};
            const cachedStatus = statusMap[normalizedSaved];

            if (cachedStatus === true) {
              // Book is confirmed to be in library from cache
              existsInLibrary = true;
            } else if (cachedStatus === false) {
              // Book is confirmed to NOT be in library from cache
              existsInLibrary = false;
            } else {
              // No cache, need to query server
              try {
                const json: { urls?: { url: string }[] } = await searchLibraryWithCriterias(
                  toLanguageSymbol(learningLanguage || ''),
                  undefined,
                  undefined,
                  'book'
                );
                const list = Array.isArray(json?.urls) ? json.urls : [];
                existsInLibrary = list.some(
                  (it) => (it && typeof it.url === 'string' ? it.url.trim() : '') === normalizedSaved
                );

                // Cache the result for future use
                const nextStatus = { ...statusMap, [normalizedSaved]: existsInLibrary };
                await AsyncStorage.setItem(BOOK_LIBRARY_STATUS_KEY, JSON.stringify(nextStatus));
              } catch {}
            }
          } catch {}
        }

        if (cancelled) return;

        const openAddDialog = async () => {
          onShowAddBookModal();
          await markPromptShownNow();
        };

        if (existsInLibrary) {
          // If it exists, directly open add dialog (e.g., to add another source)
          await openAddDialog();
          return;
        }

        const onYes = async () => {
          await markPromptShownNow();
          onShowAddBookModal();
        };
        const onNo = async () => {
          await markPromptShownNow();
        };

        try {
          console.log('Add book to library');
          Alert.alert(
            'Add book to library',
            'would you like to add a url where to download this book to library ? so that everyone would enjoy it? ',
            [
              { text: 'No', style: 'cancel', onPress: onNo },
              { text: 'Yes', onPress: onYes },
            ],
            { cancelable: true }
          );
        } catch {
          await onYes();
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId, learningLanguage, bookTitle, onShowAddBookModal]);
}
