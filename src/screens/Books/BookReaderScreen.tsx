import React from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, ToastAndroid, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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

  const injectedJavascript = React.useMemo(() => {
    // This script runs inside the WebView. It attaches click handlers to the
    // EPUB iframes and posts back the tapped word.
    return `(() => {
      // Forward messages from iframes to React Native if needed
      try {
        window.addEventListener('message', function(evt) {
          try {
            const data = evt && evt.data;
            if (data && data.__WORD_TAP__ && data.word) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'wordTap', word: data.word }));
              }
            }
          } catch (e) {}
        }, false);
      } catch (e) {}

      function ensureHighlightStyle(doc) {
        try {
          if (!doc || !doc.head) return;
          if (doc.getElementById('ll-highlight-style')) return;
          const style = doc.createElement('style');
          style.id = 'll-highlight-style';
          style.type = 'text/css';
          style.appendChild(doc.createTextNode('.ll-selected-word { background: rgba(255, 235, 59, 0.9); border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06); }'));
          doc.head.appendChild(style);
        } catch (e) {}
      }

      function clearHighlights(doc) {
        try {
          const nodes = Array.from(doc.querySelectorAll('.ll-selected-word'));
          nodes.forEach((node) => {
            try {
              const parent = node.parentNode;
              while (node.firstChild) parent.insertBefore(node.firstChild, node);
              parent.removeChild(node);
            } catch (e) {}
          });
        } catch (e) {}
      }

      function highlightWordAtPoint(doc, x, y) {
        try {
          const range = (doc.caretRangeFromPoint && doc.caretRangeFromPoint(x, y))
            || (doc.caretPositionFromPoint && (function(){
                  const pos = doc.caretPositionFromPoint(x, y);
                  if (!pos) return null;
                  const r = doc.createRange();
                  r.setStart(pos.offsetNode, Math.min(pos.offset, pos.offsetNode?.length || 0));
                  r.setEnd(pos.offsetNode, Math.min(pos.offset, pos.offsetNode?.length || 0));
                  return r;
               })());
          if (!range) return null;
          let node = range.startContainer;
          if (!node) return null;
          if (node.nodeType !== 3) {
            // Find a text node beneath
            (function findTextNode(n){
              if (!n) return null;
              if (n.nodeType === 3) { node = n; return n; }
              for (let i = 0; i < n.childNodes.length; i++) {
                const res = findTextNode(n.childNodes[i]);
                if (res) return res;
              }
              return null;
            })(node);
            if (!node || node.nodeType !== 3) return null;
          }
          const text = node.textContent || '';
          let index = range.startOffset;
          if (index < 0) index = 0;
          if (index > text.length) index = text.length;
          const isWordChar = (ch) => /[A-Za-z0-9_'’\-]/.test(ch);
          let start = index;
          while (start > 0 && isWordChar(text[start - 1])) start--;
          let end = index;
          while (end < text.length && isWordChar(text[end])) end++;
          const word = (text.slice(start, end) || '').trim();
          if (!word) return null;
          // Perform highlight
          ensureHighlightStyle(doc);
          clearHighlights(doc);
          const highlightRange = doc.createRange();
          highlightRange.setStart(node, start);
          highlightRange.setEnd(node, end);
          const span = doc.createElement('span');
          span.className = 'll-selected-word';
          try {
            highlightRange.surroundContents(span);
          } catch (e) {
            // Fallback: insert nodes manually
            const frag = highlightRange.extractContents();
            span.appendChild(frag);
            highlightRange.insertNode(span);
          }
          return word;
        } catch (e) { return null; }
      }

      function extractWordAtPoint(doc, x, y) {
        const range = (doc.caretRangeFromPoint && doc.caretRangeFromPoint(x, y))
          || (doc.caretPositionFromPoint && (function(){
                const pos = doc.caretPositionFromPoint(x, y);
                if (!pos) return null;
                const r = doc.createRange();
                r.setStart(pos.offsetNode, Math.min(pos.offset, pos.offsetNode?.length || 0));
                r.setEnd(pos.offsetNode, Math.min(pos.offset, pos.offsetNode?.length || 0));
                return r;
             })());
        if (!range) return null;
        let node = range.startContainer;
        if (!node) return null;
        if (node.nodeType !== 3 /* TEXT_NODE */) {
          // If clicked on an element, try to find text node within
          node = (function findTextNode(n){
            if (!n) return null;
            if (n.nodeType === 3) return n;
            for (let i = 0; i < n.childNodes.length; i++) {
              const res = findTextNode(n.childNodes[i]);
              if (res) return res;
            }
            return null;
          })(node);
          if (!node) return null;
        }
        const text = node.textContent || '';
        let index = range.startOffset;
        if (index < 0) index = 0;
        if (index > text.length) index = text.length;
        // Simpler regex for broader WebView compatibility
        const isWordChar = (ch) => /[A-Za-z0-9_'’\-]/.test(ch);
        let start = index;
        while (start > 0 && isWordChar(text[start - 1])) start--;
        let end = index;
        while (end < text.length && isWordChar(text[end])) end++;
        const word = text.slice(start, end).trim();
        if (!word) return null;
        return word;
      }

      function attachToDocument(doc) {
        if (!doc || !doc.body || doc.__wordTapAttached) return;
        doc.__wordTapAttached = true;
        ensureHighlightStyle(doc);
        const handler = (ev) => {
          try {
            const word = highlightWordAtPoint(doc, ev.clientX, ev.clientY) || extractWordAtPoint(doc, ev.clientX, ev.clientY);
            if (word) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'wordTap', word }));
              } else if (window.parent && window.parent !== window && window.parent.postMessage) {
                window.parent.postMessage({ __WORD_TAP__: true, word }, '*');
              }
            }
          } catch (e) {}
        };
        doc.body.addEventListener('click', handler, true);
        doc.body.addEventListener('touchend', function(e){
          try {
            const t = e.changedTouches && e.changedTouches[0];
            if (!t) return;
            const word = highlightWordAtPoint(doc, t.clientX, t.clientY) || extractWordAtPoint(doc, t.clientX, t.clientY);
            if (word) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'wordTap', word }));
              } else if (window.parent && window.parent !== window && window.parent.postMessage) {
                window.parent.postMessage({ __WORD_TAP__: true, word }, '*');
              }
            }
          } catch (e) {}
        }, true);
      }

      function scanAndAttach() {
        try {
          // Try epub.js rendition if available
          if (window.rendition && typeof window.rendition.getContents === 'function') {
            const contents = window.rendition.getContents();
            if (Array.isArray(contents)) {
              contents.forEach((c) => {
                try { attachToDocument(c.document); } catch (e) {}
              });
            }
          }
          // Fallback: inspect iframes
          const iframes = Array.from(document.querySelectorAll('iframe'));
          iframes.forEach((f) => {
            try { attachToDocument(f.contentDocument); } catch (e) {}
          });
        } catch (e) {}
      }

      // Hook on common rendition events
      try {
        if (window.rendition && typeof window.rendition.on === 'function') {
          window.rendition.on('rendered', scanAndAttach);
          window.rendition.on('relocated', scanAndAttach);
        }
      } catch (e) {}

      // Periodic scan as safety net
      setInterval(scanAndAttach, 1000);
      // Initial attempt
      scanAndAttach();
    })();`;
  }, []);

  const handleWebViewMessage = React.useCallback((payload: any) => {
    try {
      // The Reader component already parses WebView messages and passes the object here.
      let data: any = payload;
      if (!data || typeof data !== 'object') {
        const raw = payload?.nativeEvent?.data;
        data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
      if (data && data.type === 'wordTap' && data.word) {
        const msg: string = String(data.word);
        if (Platform.OS === 'android') {
          ToastAndroid.show(msg, ToastAndroid.SHORT);
        } else {
          Alert.alert('Word', msg);
        }
      }
    } catch {}
  }, []);

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
              allowScriptedContent
              injectedJavascript={injectedJavascript}
              onWebViewMessage={handleWebViewMessage}
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


