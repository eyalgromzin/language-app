import React from 'react';
import { ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { useNavigation, useRoute } from '@react-navigation/native';

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

function BookReaderScreen(): React.JSX.Element {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { id } = route.params || {};
  const webViewRef = React.useRef<WebView>(null);

  const [book, setBook] = React.useState<StoredBook | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [epubBase64, setEpubBase64] = React.useState<string | null>(null);
  const [panel, setPanel] = React.useState<null | { word: string; sentence?: string; translation: string; loading: boolean }>(null);
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);
        const map = Object.fromEntries(entries);
        if (!mounted) return;
        setLearningLanguage(map['language.learning'] ?? null);
        setNativeLanguage(map['language.native'] ?? null);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        const arr: StoredBook[] = json ? (Array.isArray(JSON.parse(json)) ? JSON.parse(json) : []) : [];
        const found = arr.find((b) => b.id === id) || null;
        if (!mounted) return;
        setBook(found);
      } catch {
        if (!mounted) return;
        setBook(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  React.useEffect(() => { setErrorMessage(null); setEpubBase64(null); }, [book?.filePath]);

  // Load EPUB file into memory as base64; the WebView will convert it to a Blob/URL inside
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!book?.filePath) { if (!cancelled) setEpubBase64(null); return; }
        const exists = await RNFS.exists(book.filePath);
        if (!exists) { if (!cancelled) setEpubBase64(null); return; }
        const base64 = await RNFS.readFile(book.filePath, 'base64' as any);
        if (!cancelled) setEpubBase64(base64);
      } catch (e) {
        if (!cancelled) setEpubBase64(null);
      }
    })();
    return () => { cancelled = true; };
  }, [book?.filePath]);

  const baseInjection = React.useMemo(() => {
    // Minimal EPUB.js loader that paginates, handles next/prev, and emits word clicks
    const width = Dimensions.get('window').width;
    const height = Dimensions.get('window').height;
    return `
      (function(){
        if (window.__readerInstalled_v1) return; window.__readerInstalled_v1 = true;
        var params = new URLSearchParams(window.location.search || '');
        var fileUrl = (window.__EPUB_FILE_URL || decodeURIComponent(params.get('file')) || '');
        var fileBase64 = (window.__EPUB_FILE_BASE64 || '');
        var startCfi = (window.__EPUB_START_CFI || params.get('cfi') || '');
        var container = document.getElementById('viewer');
        container.style.width = '${Math.floor(width)}px';
        container.style.height = '${Math.floor(height - 140)}px';
        container.style.overflow = 'hidden';

        function post(msg){ try { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch(e){} }

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.js';
        script.onerror = function(){ try { post({ type: 'error', message: 'Failed to load EPUB.js script' }); } catch(e){} };
        script.onload = function(){
          try {
            function base64ToArrayBuffer(base64){
              var binary_string = atob(base64);
              var len = binary_string.length;
              var bytes = new Uint8Array(len);
              for (var i = 0; i < len; i++) { bytes[i] = binary_string.charCodeAt(i); }
              return bytes.buffer;
            }
            if (fileBase64) {
              var buf = base64ToArrayBuffer(fileBase64);
              var blob = new Blob([buf], { type: 'application/epub+zip' });
              var blobUrl = URL.createObjectURL(blob);
              window.__book = ePub(blobUrl);
            } else if (fileUrl) {
              window.__book = ePub(fileUrl);
            } else {
              throw new Error('No EPUB source provided');
            }
            window.__rendition = window.__book.renderTo('viewer', { flow: 'paginated', width: ${Math.floor(width)}, height: ${Math.floor(height - 140)} });
            window.__rendition.themes.default({ 'body': { 'padding': '16px', 'line-height': '1.6' } });
            window.__rendition.display(startCfi || undefined);

            function onWordClick(ev){
              try {
                var sel = window.getSelection && window.getSelection();
                var word = '';
                if (sel && String(sel.toString()).trim()) {
                  var txt = String(sel.toString()).trim();
                  if (txt.split(/\s+/).length === 1) word = txt;
                }
                if (!word) {
                  var r = ev && ev.target && ev.target.ownerDocument && ev.target.ownerDocument.caretRangeFromPoint ? ev.target.ownerDocument.caretRangeFromPoint(ev.clientX, ev.clientY) : null;
                  if (r && r.startContainer && r.startContainer.nodeType === Node.TEXT_NODE) {
                    var t = r.startContainer.textContent || '';
                    var o = r.startOffset || 0; var s=o; while(s>0 && /[\p{L}\p{N}\u00C0-\u024F'\-]/u.test(t[s-1])) s--; var e=o; while(e<t.length && /[\p{L}\p{N}\u00C0-\u024F'\-]/u.test(t[e])) e++; word=(t.slice(s,e)||'').trim();
                  }
                }
                if (word) {
                  // Simple sentence extraction
                  var sentence = '';
                  try {
                    var el = ev.target.closest('p, div');
                    var text = el ? (el.innerText||'') : '';
                    var idx = text.toLowerCase().indexOf(word.toLowerCase());
                    if (idx>=0){ var a=idx; while(a>0 && !/[\.!?。！？]/.test(text[a-1])) a--; var b=idx+word.length; while(b<text.length && !/[\.!?。！？]/.test(text[b])) b++; sentence=(text.slice(a, Math.min(b+1,text.length))||'').replace(/\s+/g,' ').trim(); }
                  } catch(e){}
                  post({ type: 'wordClick', word: word, sentence: sentence });
                }
              } catch(e){}
            }

            window.__rendition.on('click', onWordClick);

            // report location changes
            window.__rendition.on('relocated', function(loc){ try { post({ type: 'relocated', cfi: loc && loc.start && loc.start.cfi }); } catch(e){} });

            // expose next/prev
            window.__nextPage = function(){ try{ window.__rendition.next(); }catch(e){} };
            window.__prevPage = function(){ try{ window.__rendition.prev(); }catch(e){} };
          } catch(e) { post({ type: 'error', message: String(e&&e.message||e) }); }
        };
        document.head.appendChild(script);
      })();
      true;
    `;
  }, []);

  const onMessage = async (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'wordClick' && typeof data.word === 'string' && data.word) {
        setPanel({ word: data.word, sentence: data.sentence || '', translation: '', loading: true });
        const translated = await fetchTranslation(data.word);
        setPanel((prev) => (prev ? { ...prev, translation: translated, loading: false } : prev));
      }
      if (data?.type === 'relocated' && data.cfi && book) {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        const arr: StoredBook[] = json ? (Array.isArray(JSON.parse(json)) ? JSON.parse(json) : []) : [];
        const next = arr.map((b) => (b.id === book.id ? { ...b, lastPositionCfi: String(data.cfi || '') } : b));
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next, null, 2));
      }
    } catch {}
  };

  const goPrev = () => { try { webViewRef.current?.injectJavaScript('window.__prevPage && window.__prevPage(); true;'); } catch (e) {} };
  const goNext = () => { try { webViewRef.current?.injectJavaScript('window.__nextPage && window.__nextPage(); true;'); } catch (e) {} };

  const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
    English: 'en', Spanish: 'es', French: 'fr', German: 'de', Italian: 'it', Portuguese: 'pt', Russian: 'ru', 'Chinese (Mandarin)': 'zh-CN', Japanese: 'ja', Korean: 'ko', Arabic: 'ar', Hindi: 'hi', Turkish: 'tr', Polish: 'pl', Dutch: 'nl', Greek: 'el', Swedish: 'sv', Norwegian: 'no', Finnish: 'fi', Czech: 'cs', Ukrainian: 'uk', Hebrew: 'he', Thai: 'th', Vietnamese: 'vi',
  };
  const getLangCode = (nameOrNull: string | null | undefined): string | null => {
    if (!nameOrNull) return null; const code = LANGUAGE_NAME_TO_CODE[nameOrNull]; return typeof code === 'string' ? code : null;
  };
  const fetchTranslation = async (word: string): Promise<string> => {
    const fromCode = getLangCode(learningLanguage) || 'en';
    const toCode = getLangCode(nativeLanguage) || 'en';
    if (!word || fromCode === toCode) return word;
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${encodeURIComponent(fromCode)}|${encodeURIComponent(toCode)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const txt = json?.responseData?.translatedText;
        if (typeof txt === 'string' && txt.trim().length > 0) return txt.trim();
      }
    } catch {}
    return word;
  };

  if (loading || !book || epubBase64 === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  const html = `<!DOCTYPE html><html><head><meta charset=\"utf-8\"/><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/></head><body style=\"margin:0;padding:0;background:#fff;color:#000;\"><div id=\"viewer\"></div><script>window.__EPUB_FILE_URL=''; window.__EPUB_FILE_BASE64=${JSON.stringify(epubBase64 || '')}; window.__EPUB_START_CFI=${JSON.stringify(book.lastPositionCfi || '')}; window.onerror=function(m,s,l,c,e){ try{ window.ReactNativeWebView.postMessage(JSON.stringify({type:'error', message: String(m||e&&e.message||'Unknown error')})); }catch(_){} return false; };</script><script>${baseInjection}</script></body></html>`;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title} numberOfLines={1}>{book.title}</Text>
        <View style={styles.navBtns}>
          <TouchableOpacity style={styles.navBtn} onPress={goPrev}><Text style={styles.navBtnText}>Prev</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={goNext}><Text style={styles.navBtnText}>Next</Text></TouchableOpacity>
        </View>
      </View>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html, baseUrl: `file://${RNFS.DocumentDirectoryPath}/` }}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data?.type === 'error') {
              setErrorMessage(String(data.message || 'Reader error'));
              return;
            }
          } catch {}
          onMessage(e);
        }}
        onError={(e) => setErrorMessage(e.nativeEvent?.description || 'Failed to load reader')}
        onHttpError={(e) => setErrorMessage(`HTTP ${e.nativeEvent?.statusCode}: ${e.nativeEvent?.description}`)}
        javaScriptEnabled
        domStorageEnabled
        style={styles.webView}
        {...(Platform.OS === 'android' ? {
          allowFileAccess: true,
          allowFileAccessFromFileURLs: true,
          allowUniversalAccessFromFileURLs: true,
          mixedContentMode: 'always' as const,
        } : {})}
        {...(Platform.OS === 'ios' ? {
          allowingReadAccessToURL: `file://${RNFS.DocumentDirectoryPath}`,
        } : {})}
      />

      {!!errorMessage && (
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: 20, backgroundColor: 'rgba(255,0,0,0.85)', padding: 10, borderRadius: 8 }}>
          <Text style={{ color: 'white', fontWeight: '700' }} numberOfLines={3}>{errorMessage}</Text>
        </View>
      )}

      <Modal transparent visible={!!panel} animationType="fade" onRequestClose={() => setPanel(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelWord} numberOfLines={1}>{panel?.word}</Text>
              <TouchableOpacity onPress={() => setPanel(null)}><Text style={styles.close}>✕</Text></TouchableOpacity>
            </View>
            {panel?.loading ? (
              <ActivityIndicator />
            ) : (
              <ScrollView style={{ maxHeight: 160 }}>
                <Text style={styles.translation}>{panel?.translation}</Text>
                {!!panel?.sentence && <Text style={styles.sentence}>{panel?.sentence}</Text>}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  webView: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd' },
  title: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 12 },
  navBtns: { flexDirection: 'row', gap: 8 },
  navBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f3f4f6', borderRadius: 8 },
  navBtnText: { fontWeight: '700', color: '#111' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'flex-end' },
  panel: { width: '100%', backgroundColor: 'white', borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 12 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelWord: { fontSize: 16, fontWeight: '700', marginRight: 12, flex: 1 },
  close: { fontSize: 20, paddingHorizontal: 8, paddingVertical: 2 },
  translation: { fontSize: 14, color: '#333', marginBottom: 8 },
  sentence: { fontSize: 13, color: '#666' },
});

export default BookReaderScreen;


