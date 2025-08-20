import React from 'react';
import { ActivityIndicator, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { pick } from '@react-native-documents/picker';
import * as RNFS from 'react-native-fs'; // @dr.pogodin/react-native-fs
import JSZip from 'jszip';

type StoredBook = {
  id: string;            // stable id (hash of file path)
  title: string;
  author?: string;
  coverUri?: string;     // file:// path to extracted cover image if available
  filePath: string;      // RNFS DocumentDirectoryPath path to the copied file
  format?: 'epub' | 'pdf';
  addedAt: string;
  lastPositionCfi?: string; // for resuming (EPUB only)
  lastOpenedAt?: string; // for ordering by recent open
};

const STORAGE_KEY = 'books.library';

async function extractCoverImageFromEpub(epubFilePath: string, bookId: string): Promise<string | undefined> {
  try {
    const base64Data = await RNFS.readFile(epubFilePath, 'base64' as any);
    const zip = await JSZip.loadAsync(base64Data, { base64: true });

    const pngCandidates: string[] = [];
    const jpgCandidates: string[] = [];
    zip.forEach((relativePath, file) => {
      if (file.dir) return;
      const lower = relativePath.toLowerCase();
      if (/(^|\/)(cover|image0001|title|titlepage|cover-image)[^\/]*\.png$/.test(lower)) {
        pngCandidates.unshift(relativePath);
      } else if (/\.png$/.test(lower)) {
        pngCandidates.push(relativePath);
      } else if (/(^|\/)(cover|image0001|title|titlepage|cover-image)[^\/]*\.(jpg|jpeg)$/.test(lower)) {
        jpgCandidates.unshift(relativePath);
      } else if (/\.(jpg|jpeg)$/.test(lower)) {
        jpgCandidates.push(relativePath);
      }
    });

    const chosen = (pngCandidates[0] || jpgCandidates[0]);
    if (!chosen) return undefined;
    const extMatch = /\.([a-z0-9]+)$/i.exec(chosen);
    const ext = (extMatch ? extMatch[1].toLowerCase() : 'png').replace('jpeg', 'jpg');
    const file = zip.file(chosen);
    if (!file) return undefined;
    const imageBase64 = await file.async('base64');
    const outDir = `${RNFS.DocumentDirectoryPath}/books`;
    try { if (!(await RNFS.exists(outDir))) await RNFS.mkdir(outDir); } catch {}
    const outPath = `${outDir}/${bookId}_cover.${ext}`;
    await RNFS.writeFile(outPath, imageBase64, 'base64' as any);
    return outPath.startsWith('file://') ? outPath : `file://${outPath}`;
  } catch {
    return undefined;
  }
}

function BooksScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [books, setBooks] = React.useState<StoredBook[]>([]);
  const [infoModalVisible, setInfoModalVisible] = React.useState<boolean>(false);
  const [infoModalText, setInfoModalText] = React.useState<string>('');

  const showInfoModal = React.useCallback((text: string) => {
    setInfoModalText(text);
    setInfoModalVisible(true);
  }, []);

  const loadBooks = React.useCallback(async () => {
    try {
      setLoading(true);
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = json ? JSON.parse(json) : [];
      const arr: StoredBook[] = Array.isArray(parsed) ? parsed : [];
      const sorted = [...arr].sort(
        (a, b) => Date.parse(b.lastOpenedAt || b.addedAt) - Date.parse(a.lastOpenedAt || a.addedAt)
      );
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
      if (!(RNFS as any)?.DocumentDirectoryPath) {
        Alert.alert(
          'File system unavailable',
          'Native file system module is not loaded. Please fully rebuild the app (clean Android build) after installing dependencies.'
        );
        return;
      }
      const pickerTypes = Platform.select<string[]>({
        ios: [
          'org.idpf.epub-container',
          'public.epub',
          'application/epub+zip',
        ],
        android: ['application/epub+zip', '*/*'],
        default: ['*/*'],
      }) as string[];
      const [res] = await pick({ type: pickerTypes, copyTo: 'cachesDirectory' } as any);
      if (!res) return;
      const isEpub = !!(res.name && /\.epub$/i.test(res.name));
      const isPdf = !!(res.name && /\.pdf$/i.test(res.name));
      if (isPdf) {
        showInfoModal('pdf are not supported yet. plz convert pdf to epub using 1 of the free websites on google and load it');
        return;
      }
      if (!isEpub) {
        Alert.alert('Unsupported file', 'Please choose an .epub file.');
        return;
      }
      const pickedUri: string = ((res as any).fileCopyUri || res.uri || '').toString();
      if (!pickedUri) return;
      let usableUri = pickedUri;
      if (Platform.OS === 'android' && /^content:/.test(pickedUri)) {
        try {
          const stat: any = await (RNFS as any).stat(pickedUri);
          const resolvedPath: string = (stat?.originalFilepath || stat?.path || '').toString();
          if (resolvedPath) {
            usableUri = resolvedPath.startsWith('file://') ? resolvedPath : `file://${resolvedPath}`;
          }
        } catch {}
      }
      await importBookFromUri(usableUri, res.name || (isPdf ? 'document.pdf' : 'book.epub'));
    } catch (e: any) {
      // ignore cancel
    }
  };

  const clearAllBooks = async () => {
    try {
      setLoading(true);
      await AsyncStorage.removeItem(STORAGE_KEY);
      setBooks([]);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const importBookFromUri = async (uri: string, filenameFallback: string) => {
    try {
      const isPdf = /\.pdf$/i.test(filenameFallback);
      const isEpub = /\.epub$/i.test(filenameFallback);
      if (isPdf) {
        showInfoModal('pdf are not supported yet. plz convert pdf to epub using 1 of the free websites on google and load it');
        return;
      }
      const fileName = (isPdf || isEpub) ? filenameFallback : (filenameFallback + '.epub');
      let filePath = '';
      const destDir = `${RNFS.DocumentDirectoryPath}/books`;
      try { if (!(await RNFS.exists(destDir))) await RNFS.mkdir(destDir); } catch {}
      if (/^file:/.test(uri)) {
        const srcPath = uri.replace(/^file:\/\//, '');
        const destPath = `${destDir}/${Date.now()}_${fileName}`;
        try {
          await RNFS.copyFile(srcPath, destPath);
          filePath = destPath;
        } catch {
          // Fallback: read as base64 then write into app storage
          try {
            const data = await RNFS.readFile(srcPath, 'base64' as any);
            await RNFS.writeFile(destPath, data, 'base64' as any);
            filePath = destPath;
          } catch {
            Alert.alert('Import failed', 'Could not copy the selected file.');
            return;
          }
        }
      } else if (/^content:/.test(uri)) {
        const destPath = `${destDir}/${Date.now()}_${fileName}`;
        try {
          await RNFS.copyFile(uri, destPath);
          filePath = destPath;
        } catch {
          // Some Android devices do not support copyFile from content://
          try {
            const data = await RNFS.readFile(uri, 'base64' as any);
            await RNFS.writeFile(destPath, data, 'base64' as any);
            filePath = destPath;
          } catch {
            Alert.alert('Import failed', 'Could not access the selected file (content URI).');
            return;
          }
        }
      } else {
        Alert.alert('Unsupported source', 'Unsupported URI scheme for selected file.');
        return;
      }
      const titleGuess = fileName.replace(/\.(epub|pdf)$/i, '').replace(/[_\-]+/g, ' ');
      const id = String(Math.abs(hashString(filePath)));
      const coverUri = /\.epub$/i.test(fileName) ? (await extractCoverImageFromEpub(filePath, id)) : undefined;
      const newBook: StoredBook = {
        id,
        title: titleGuess || 'Untitled',
        author: undefined,
        coverUri: coverUri,
        filePath,
        format: /\.pdf$/i.test(fileName) ? 'pdf' : 'epub',
        addedAt: new Date().toISOString(),
        lastOpenedAt: undefined,
      };
      const next = [newBook, ...books.filter((b) => b.filePath !== filePath)];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next, null, 2));
      setBooks(next);
      // Open the newly added book immediately
      navigation.navigate('BookReader', { id: newBook.id });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unknown error while importing file');
    }
  };

  const openBook = async (book: StoredBook) => {
    try {
      const nowIso = new Date().toISOString();
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = json ? JSON.parse(json) : [];
      const list: StoredBook[] = Array.isArray(parsed) ? parsed : [];
      const updated = list.map((b) => (b.id === book.id ? { ...b, lastOpenedAt: nowIso } : b));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated, null, 2));
      const locallySorted = [...updated].sort(
        (a, b) => Date.parse(b.lastOpenedAt || b.addedAt) - Date.parse(a.lastOpenedAt || a.addedAt)
      );
      setBooks(locallySorted);
    } catch {
      // ignore update errors; still navigate
    } finally {
      navigation.navigate('BookReader', { id: book.id });
    }
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
        <View style={styles.actionsRow}>
          {books.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearAllBooks}>
              <Text style={styles.clearBtnText}>Clear books</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={openPicker}>
            <Text style={styles.addBtnText}>+ Load Book</Text>
          </TouchableOpacity>
        </View>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : books.length === 0 ? (
        <View style={[styles.center, { paddingHorizontal: 24 }]}>
          <Text style={{ color: '#555', textAlign: 'center' }}>No books yet. Tap "Load Book" to add an EPUB.</Text>
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
      <Modal
        transparent
        visible={infoModalVisible}
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Notice</Text>
            <Text style={styles.modalText}>{infoModalText}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setInfoModalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    actionsRow: { flexDirection: 'row', gap: 8 },
  addBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#007AFF', borderRadius: 8 },
  addBtnText: { color: 'white', fontWeight: '700' },
    clearBtn: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#f3f4f6', borderRadius: 8 },
    clearBtnText: { color: '#111827', fontWeight: '700' },
  grid: { paddingHorizontal: 12, paddingBottom: 16, gap: 12 },
  bookTile: { flex: 1/3, maxWidth: '32%', alignItems: 'center' },
  cover: { width: 100, height: 140, borderRadius: 8, backgroundColor: '#eee' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  coverPlaceholderText: { fontSize: 18, fontWeight: '700', color: '#666' },
  bookTitle: { marginTop: 6, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  bookAuthor: { fontSize: 12, color: '#666' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 420, borderRadius: 12, backgroundColor: 'white', padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111827' },
  modalText: { fontSize: 14, color: '#374151', marginBottom: 16 },
  modalButton: { alignSelf: 'flex-end', backgroundColor: '#007AFF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  modalButtonText: { color: 'white', fontWeight: '700' },
});

export default BooksScreen;


