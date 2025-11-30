import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';

const STORAGE_KEY = 'books.library';

type StoredBook = {
  id: string;
  title: string;
  author?: string;
  coverUri?: string;
  filePath: string;
  format?: 'epub' | 'pdf';
  addedAt: string;
  lastPositionCfi?: string;
  lastPdfPage?: number;
  lastOpenedAt?: string;
};

type BookLoaderResult = {
  loading: boolean;
  error: string | null;
  bookTitle: string;
  src: string | null;
  initialCfi: string | undefined;
  bookFormat: 'epub' | 'pdf';
  bookId: string | undefined;
};

export function useBookLoader(bookId: string | undefined): BookLoaderResult {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [src, setSrc] = useState<string | null>(null);
  const [initialCfi, setInitialCfi] = useState<string | undefined>(undefined);
  const [bookFormat, setBookFormat] = useState<'epub' | 'pdf'>('epub');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        if (!bookId) {
          setError('Missing book id');
          return;
        }
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = json ? JSON.parse(json) : [];
        const books: StoredBook[] = Array.isArray(parsed) ? parsed : [];
        const book = books.find((b) => b.id === bookId);
        if (!book) {
          setError('Book not found');
          return;
        }
        // Update last opened timestamp for recents ordering
        try {
          const nowIso = new Date().toISOString();
          const updated = books.map((b) => (b.id === bookId ? { ...b, lastOpenedAt: nowIso } : b));
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated, null, 2));
        } catch {}
        const localPath = /^file:\/\//.test(book.filePath) ? book.filePath : `file://${book.filePath}`;
        // Verify file exists to provide better error messages
        try {
          const exists = await RNFS.exists(localPath.replace(/^file:\/\//, ''));
          if (!exists) {
            if (!cancelled) {
              setError('Local file not found. Try re-importing the book.');
            }
            return;
          }
        } catch {}
        const detectedFormat: 'epub' | 'pdf' = (book.format === 'pdf' || /\.pdf$/i.test(book.filePath)) ? 'pdf' : 'epub';
        if (!cancelled) {
          setBookTitle(book.title || '');
          setBookFormat(detectedFormat);
          if (detectedFormat === 'epub') {
            setSrc(localPath);
            setInitialCfi(book.lastPositionCfi);
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load book');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookId]);

  return {
    loading,
    error,
    bookTitle,
    src,
    initialCfi,
    bookFormat,
  };
}
