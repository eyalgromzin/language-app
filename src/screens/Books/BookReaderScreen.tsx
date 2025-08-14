import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Reader, ReaderProvider } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as RNFS from 'react-native-fs';

type StoredBook = {
  id: string;
  title: string;
  author?: string;
  coverUri?: string;
  filePath: string;
  addedAt: string;
  lastPositionCfi?: string;
};

const STORAGE_KEY = 'books.library';

type RouteParams = { id: string };

function BookReaderScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width, height } = useWindowDimensions();

  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [bookTitle, setBookTitle] = React.useState<string>('');
  const [src, setSrc] = React.useState<string | null>(null);
  const [initialCfi, setInitialCfi] = React.useState<string | undefined>(undefined);

  const bookId: string | undefined = (route?.params as RouteParams | undefined)?.id;

  React.useEffect(() => {
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
        if (!cancelled) {
          setBookTitle(book.title || '');
          setSrc(localPath);
          setInitialCfi(book.lastPositionCfi);
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

  const persistCfi = React.useCallback(async (cfi: string | null) => {
    try {
      if (!bookId) return;
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = json ? JSON.parse(json) : [];
      const books: StoredBook[] = Array.isArray(parsed) ? parsed : [];
      const next = books.map((b) => (b.id === bookId ? { ...b, lastPositionCfi: cfi || undefined } : b));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next, null, 2));
    } catch {
      // ignore
    }
  }, [bookId]);

  const goBack = () => navigation.goBack();

  const handleLocationChange = React.useCallback((totalLocations: number, currentLocation: any) => {
    const cfi: string | null = currentLocation?.start?.cfi ?? currentLocation?.end?.cfi ?? null;
    void persistCfi(cfi);
  }, [persistCfi]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{bookTitle || 'Reader'}</Text>
        <View style={{ width: 56 }} />
      </View>

      <View style={styles.readerContainer}>
        {loading && (
          <View style={styles.center}> 
            <ActivityIndicator />
          </View>
        )}
        {!!error && !loading && (
          <View style={styles.center}>
            <Text style={{ color: '#dc2626' }}>{error}</Text>
          </View>
        )}
        {!!src && !loading && !error && (
          <ReaderProvider>
            <Reader
              src={src}
              width={width}
              height={height - 56}
              fileSystem={useFileSystem}
              initialLocation={initialCfi}
              onLocationChange={handleLocationChange}
              onDisplayError={(reason: string) => setError(reason || 'Failed to display book')}
              onReady={() => setError(null)}
            />
          </ReaderProvider>
        )}
      </View>
    </View>
  );
}


export default BookReaderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { paddingVertical: 8, paddingHorizontal: 8 },
  backText: { color: '#007AFF', fontWeight: '700' },
  title: { flex: 1, textAlign: 'center', fontWeight: '700' },
  readerContainer: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});


