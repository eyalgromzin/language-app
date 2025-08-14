import React from 'react';
import { ActivityIndicator, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

type StoredBook = {
  id: string;            // stable id (hash of file path)
  title: string;
  author?: string;
  coverUri?: string;     // file:// path to extracted cover image if available
  filePath: string;      // RNFS DocumentDirectoryPath path to the .epub copy
  addedAt: string;
  lastPositionCfi?: string; // for resuming
};

const STORAGE_KEY = 'books.library';

function BooksScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [books, setBooks] = React.useState<StoredBook[]>([]);

  const loadBooks = React.useCallback(async () => {
    try {
      setLoading(true);
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = json ? JSON.parse(json) : [];
      const arr: StoredBook[] = Array.isArray(parsed) ? parsed : [];
      const sorted = [...arr].sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));
      setBooks(sorted);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => { if (mounted) await loadBooks(); })();
    return () => { mounted = false; };
  }, [loadBooks]);

  const openPicker = async () => {
    try {
      const pickerTypes = Platform.select<string[]>({
        ios: ['org.idpf.epub-container', 'public.epub', 'application/epub+zip'],
        android: ['application/epub+zip'],
        default: ['application/epub+zip'],
      }) as string[];
      const res = await DocumentPicker.pickSingle({ type: pickerTypes, copyTo: 'documentDirectory' });
      const uri: string = (res.fileCopyUri || res.uri || '').toString();
      if (!uri) return;
      await importEpubFromUri(uri, res.name || 'book.epub');
    } catch (e: any) {
      // ignore cancel
    }
  };

  const importEpubFromUri = async (uri: string, filenameFallback: string) => {
    try {
      const fileName = filenameFallback && /\.epub$/i.test(filenameFallback) ? filenameFallback : (filenameFallback + '.epub');
      let filePath = '';
      if (/^file:/.test(uri)) {
        filePath = uri.replace(/^file:\/\//, '');
      } else if (/^content:/.test(uri)) {
        // copy content URI into app documents
        const destDir = `${RNFS.DocumentDirectoryPath}/books`;
        try { if (!(await RNFS.exists(destDir))) await RNFS.mkdir(destDir); } catch {}
        const destPath = `${destDir}/${Date.now()}_${fileName}`;
        try {
          await RNFS.copyFile(uri, destPath);
          filePath = destPath;
        } catch {
          return;
        }
      } else {
        return;
      }
      const titleGuess = fileName.replace(/\.epub$/i, '').replace(/[_\-]+/g, ' ');
      const id = String(Math.abs(hashString(filePath)));
      const newBook: StoredBook = {
        id,
        title: titleGuess || 'Untitled',
        author: undefined,
        coverUri: undefined,
        filePath,
        addedAt: new Date().toISOString(),
      };
      const next = [newBook, ...books.filter((b) => b.filePath !== filePath)];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next, null, 2));
      setBooks(next);
    } catch {}
  };

  const openBook = (book: StoredBook) => {
    navigation.navigate('BookReader', { id: book.id });
  };

  const renderItem = ({ item }: { item: StoredBook }) => {
    return (
      <TouchableOpacity style={styles.bookTile} onPress={() => openBook(item)}>
        {item.coverUri ? (
          <Image source={{ uri: item.coverUri }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]}>
            <Text style={styles.coverPlaceholderText}>{item.title.slice(0, 2).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        {!!item.author && <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>My Books</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openPicker}>
          <Text style={styles.addBtnText}>+ Load EPUB</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : books.length === 0 ? (
        <View style={[styles.center, { paddingHorizontal: 24 }]}>
          <Text style={{ color: '#555', textAlign: 'center' }}>No books yet. Tap "Load EPUB" to add a book.</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(b) => b.id}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
        />
      )}
    </View>
  );
}

function hashString(input: string): number {
  // Simple djb2
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  header: { fontSize: 22, fontWeight: '700' },
  addBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#007AFF', borderRadius: 8 },
  addBtnText: { color: 'white', fontWeight: '700' },
  grid: { paddingHorizontal: 12, paddingBottom: 16, gap: 12 },
  bookTile: { flex: 1/3, maxWidth: '32%', alignItems: 'center' },
  cover: { width: 100, height: 140, borderRadius: 8, backgroundColor: '#eee' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverPlaceholderText: { fontSize: 18, fontWeight: '700', color: '#666' },
  bookTitle: { marginTop: 6, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  bookAuthor: { fontSize: 12, color: '#666' },
});

export default BooksScreen;


