import React from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, ToastAndroid, TouchableOpacity, View, useWindowDimensions, Keyboard } from 'react-native';
import TranslationPanel, { type TranslationPanelState } from '../../components/TranslationPanel';
import { fetchTranslation as fetchTranslationCommon } from '../../utils/translation';
import { Reader, ReaderProvider } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as RNFS from 'react-native-fs';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

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
  const [bookFormat, setBookFormat] = React.useState<'epub' | 'pdf'>('epub');
  const [pdfBase64, setPdfBase64] = React.useState<string | null>(null);
  const [initialPdfPage, setInitialPdfPage] = React.useState<number>(1);

  const [translationPanel, setTranslationPanel] = React.useState<TranslationPanelState | null>(null);

  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);

  const [imageScrape, setImageScrape] = React.useState<null | { url: string; word: string }>(null);
  const imageScrapeResolveRef = React.useRef<((urls: string[]) => void) | null>(null);
  const imageScrapeRejectRef = React.useRef<((err?: unknown) => void) | null>(null);
  const hiddenWebViewRef = React.useRef<WebView>(null);

  const bookId: string | undefined = (route?.params as RouteParams | undefined)?.id;

  type ReaderTheme = 'white' | 'beige';
  const [readerTheme, setReaderTheme] = React.useState<ReaderTheme>('white');
  const [showThemeMenu, setShowThemeMenu] = React.useState<boolean>(false);

  const themeColors = React.useMemo(() => {
    if (readerTheme === 'beige') {
      return {
        bg: '#f5f1e8',
        text: '#262626',
        headerBg: '#f5f1e8',
        headerText: '#262626',
        border: '#e5dfcf',
        menuBg: '#f3eadc',
        menuText: '#262626',
      } as const;
    }
    return {
      bg: '#ffffff',
      text: '#111827',
      headerBg: '#ffffff',
      headerText: '#111827',
      border: '#e5e7eb',
      menuBg: '#ffffff',
      menuText: '#111827',
    } as const;
  }, [readerTheme]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Load persisted reader theme
        try {
          const savedTheme = await AsyncStorage.getItem('reader.theme');
          if (!cancelled && (savedTheme === 'white' || savedTheme === 'beige')) {
            setReaderTheme(savedTheme as ReaderTheme);
          }
        } catch {}
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
          } else {
            // Load PDF as base64 for pdf.js in WebView
            try {
              const data = await RNFS.readFile(localPath.replace(/^file:\/\//, ''), 'base64' as any);
              if (!cancelled) {
                setPdfBase64(data);
                setInitialPdfPage(Math.max(1, Number(book.lastPdfPage) || 1));
              }
            } catch {
              if (!cancelled) setError('Failed to load PDF');
            }
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

  React.useEffect(() => {
    // Persist theme selection
    (async () => {
      try {
        await AsyncStorage.setItem('reader.theme', readerTheme);
      } catch {}
    })();
  }, [readerTheme]);

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

  const persistPdfPage = React.useCallback(async (page: number) => {
    try {
      if (!bookId) return;
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = json ? JSON.parse(json) : [];
      const books: StoredBook[] = Array.isArray(parsed) ? parsed : [];
      const next = books.map((b) => (b.id === bookId ? { ...b, lastPdfPage: Math.max(1, Number(page) || 1) } : b));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next, null, 2));
    } catch {
      // ignore
    }
  }, [bookId]);

  const injectedJavascript = React.useMemo(() => {
    const bg = themeColors.bg;
    const text = themeColors.text;
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

      function ensureThemeStyle(doc) {
        try {
          if (!doc || !doc.head) return;
          let style = doc.getElementById('ll-theme-style');
          if (!style) {
            style = doc.createElement('style');
            style.id = 'll-theme-style';
            style.type = 'text/css';
            doc.head.appendChild(style);
          }
          style.textContent = 'html, body { background: ${bg} !important; color: ${text} !important; } body * { color: inherit; }';
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

      function computeSentenceFromText(text, startIndex, endIndex) {
        try {
          var punct = /[\.!?。！？]/;
          var s = startIndex; while (s > 0 && !punct.test(text[s - 1])) s--;
          var e = endIndex; while (e < text.length && !punct.test(text[e])) e++;
          return (text.slice(s, Math.min(e + 1, text.length)) || '').replace(/\s+/g, ' ').trim();
        } catch (e) { return ''; }
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
          var sentence = computeSentenceFromText(text, start, end);
          if (!sentence) {
            try {
              var el = (span.parentElement || null);
              while (el && el.innerText && el.innerText.trim().length < 1) el = el.parentElement;
              var blockText = el && el.innerText ? el.innerText : text;
              var idx = blockText.toLowerCase().indexOf(word.toLowerCase());
              if (idx >= 0) sentence = computeSentenceFromText(blockText, idx, idx + word.length);
            } catch (e2) { sentence = ''; }
          }
          return { word: word, sentence: sentence };
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
        var sentence = computeSentenceFromText(text, start, end);
        return { word: word, sentence: sentence };
      }

      function attachToDocument(doc) {
        if (!doc || !doc.body || doc.__wordTapAttached) return;
        doc.__wordTapAttached = true;
        ensureHighlightStyle(doc);
        ensureThemeStyle(doc);
        // Notify React Native on any interaction start to allow keyboard dismissal
        try {
          const sendTouchStart = function(){
            try {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'readerTouchStart' }));
              } else if (window.parent && window.parent !== window && window.parent.postMessage) {
                window.parent.postMessage({ __READER_TOUCH_START__: true }, '*');
              }
            } catch (e) {}
          };
          doc.body.addEventListener('mousedown', sendTouchStart, true);
          doc.body.addEventListener('touchstart', sendTouchStart, true);
        } catch (e) {}
        const handler = (ev) => {
          try {
            const res = highlightWordAtPoint(doc, ev.clientX, ev.clientY) || extractWordAtPoint(doc, ev.clientX, ev.clientY);
            if (res && res.word) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'wordTap', word: res.word, sentence: res.sentence || '' }));
              } else if (window.parent && window.parent !== window && window.parent.postMessage) {
                window.parent.postMessage({ __WORD_TAP__: true, word: res.word, sentence: res.sentence || '' }, '*');
              }
            }
          } catch (e) {}
        };
        doc.body.addEventListener('click', handler, true);
        doc.body.addEventListener('touchend', function(e){
          try {
            const t = e.changedTouches && e.changedTouches[0];
            if (!t) return;
            const res = highlightWordAtPoint(doc, t.clientX, t.clientY) || extractWordAtPoint(doc, t.clientX, t.clientY);
            if (res && res.word) {
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'wordTap', word: res.word, sentence: res.sentence || '' }));
              } else if (window.parent && window.parent !== window && window.parent.postMessage) {
                window.parent.postMessage({ __WORD_TAP__: true, word: res.word, sentence: res.sentence || '' }, '*');
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
                try { attachToDocument(c.document); ensureThemeStyle(c.document); } catch (e) {}
              });
            }
          }
          // Fallback: inspect iframes
          const iframes = Array.from(document.querySelectorAll('iframe'));
          iframes.forEach((f) => {
            try { attachToDocument(f.contentDocument); ensureThemeStyle(f.contentDocument); } catch (e) {}
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
  }, [themeColors.bg, themeColors.text]);

  const handleWebViewMessage = React.useCallback((payload: any) => {
    try {
      // The Reader component already parses WebView messages and passes the object here.
      let data: any = payload;
      if (!data || typeof data !== 'object') {
        const raw = payload?.nativeEvent?.data;
        data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      }
      if (data && (data.type === 'readerTouchStart' || data.__READER_TOUCH_START__ === true)) {
        Keyboard.dismiss();
        setTranslationPanel(null);
        return;
      }
      if (data && data.type === 'wordTap' && data.word) {
        const w: string = String(data.word);
        const s: string | undefined = typeof data.sentence === 'string' ? data.sentence : undefined;
        openPanel(w, s);
        return;
      }
      if (data && data.type === 'pdfPage' && typeof data.page === 'number') {
        void persistPdfPage(Number(data.page));
        return;
      }
    } catch {}
  }, []);

  const pdfHtml = React.useMemo(() => {
    if (!pdfBase64) return null as string | null;
    const bg = themeColors.bg;
    const text = themeColors.text;
    const initialPageSafe = Math.max(1, Number(initialPdfPage) || 1);
    const base64Literal = JSON.stringify(pdfBase64);
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; background: ${bg}; color: ${text}; }
    #viewer { width: 100vw; }
    .page { position: relative; margin: 8px auto; background: ${bg}; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
    .textLayer { position: absolute; left: 0; top: 0; right: 0; bottom: 0; color: transparent; }
    .ll-selected-word { background: rgba(255, 235, 59, 0.9); border-radius: 2px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06); }
    canvas { display: block; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
  <script>pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';</script>
  </head>
<body>
  <div id="viewer"></div>
  <script>
    const PDF_BASE64 = ${base64Literal};
    const INITIAL_PAGE = ${initialPageSafe};
    function base64ToUint8Array(base64) {
      try {
        const raw = atob(base64);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
      } catch (e) { return new Uint8Array(); }
    }

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

    function computeSentenceFromText(text, startIndex, endIndex) {
      try {
        var punct = /[\\.!?。！？]/;
        var s = startIndex; while (s > 0 && !punct.test(text[s - 1])) s--;
        var e = endIndex; while (e < text.length && !punct.test(text[e])) e++;
        return (text.slice(s, Math.min(e + 1, text.length)) || '').replace(/\\s+/g, ' ').trim();
      } catch (e) { return ''; }
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
        clearHighlights(doc);
        const highlightRange = doc.createRange();
        highlightRange.setStart(node, start);
        highlightRange.setEnd(node, end);
        const span = doc.createElement('span');
        span.className = 'll-selected-word';
        try { highlightRange.surroundContents(span); } catch (e) {
          const frag = highlightRange.extractContents();
          span.appendChild(frag);
          highlightRange.insertNode(span);
        }
        var sentence = computeSentenceFromText(text, start, end);
        return { word: word, sentence: sentence };
      } catch (e) { return null; }
    }

    function attachWordHandlers(doc) {
      if (!doc || doc.__llWordHandlersAttached) return;
      doc.__llWordHandlersAttached = true;
      ensureHighlightStyle(doc);
      try {
        const sendTouchStart = function(){
          try {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'readerTouchStart' })
            );
          } catch (e) {}
        };
        doc.body.addEventListener('mousedown', sendTouchStart, true);
        doc.body.addEventListener('touchstart', sendTouchStart, true);
      } catch (e) {}
      const onTap = function(ev) {
        try {
          const res = highlightWordAtPoint(doc, ev.clientX, ev.clientY);
          if (res && res.word) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'wordTap', word: res.word, sentence: res.sentence || '' })
            );
          }
        } catch (e) {}
      };
      doc.body.addEventListener('click', onTap, true);
      doc.body.addEventListener('touchend', function(e){
        try {
          const t = e.changedTouches && e.changedTouches[0];
          if (!t) return;
          const res = highlightWordAtPoint(doc, t.clientX, t.clientY);
          if (res && res.word) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'wordTap', word: res.word, sentence: res.sentence || '' })
            );
          }
        } catch (e) {}
      }, true);
    }

    function observePages(container) {
      try {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const pageNum = Number(entry.target.getAttribute('data-page-number')) || 1;
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'pdfPage', page: pageNum })
              );
            }
          });
        }, { root: null, threshold: 0.6 });
        const pages = container.querySelectorAll('.page');
        pages.forEach(p => observer.observe(p));
      } catch (e) {}
    }

    (async function() {
      try {
        const container = document.getElementById('viewer');
        attachWordHandlers(document);
        const loadingTask = pdfjsLib.getDocument({ data: base64ToUint8Array(PDF_BASE64) });
        const pdf = await loadingTask.promise;
        const availWidth = Math.max(320, container.clientWidth || window.innerWidth || 360) - 16;
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1.0 });
          const scale = availWidth / unscaledViewport.width;
          const viewport = page.getViewport({ scale });
          const wrapper = document.createElement('div');
          wrapper.className = 'page';
          wrapper.style.width = viewport.width + 'px';
          wrapper.style.height = viewport.height + 'px';
          wrapper.setAttribute('data-page-number', String(pageNum));
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = viewport.width + 'px';
          canvas.style.height = viewport.height + 'px';
          const textLayerDiv = document.createElement('div');
          textLayerDiv.className = 'textLayer';
          wrapper.appendChild(canvas);
          wrapper.appendChild(textLayerDiv);
          container.appendChild(wrapper);
          await page.render({ canvasContext: ctx, viewport }).promise;
          const textContent = await page.getTextContent();
          await pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
            textDivs: [],
            enhanceTextSelection: true
          }).promise;
        }
        // Scroll to initial page
        try {
          const target = document.querySelector('.page[data-page-number="' + INITIAL_PAGE + '"]');
          if (target && target.scrollIntoView) target.scrollIntoView({ block: 'start', behavior: 'instant' });
        } catch (e) {}
        observePages(container);
      } catch (e) {
        // no-op
      }
    })();
  </script>
</body>
</html>`;
  }, [pdfBase64, initialPdfPage, themeColors.bg, themeColors.text]);

  const fetchTranslation = async (word: string): Promise<string> => {
    const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);        
    const map = Object.fromEntries(entries);
    const learningRaw = map['language.learning'];
    const nativeRaw = map['language.native'];
    return await fetchTranslationCommon(word, learningRaw, nativeRaw);
  }

  const imageScrapeInjection = `
    (function() {
      var MAX_TIME = 12000;
      var INTERVAL_MS = 250;
      var start = Date.now();
      var pollTimer = null;
      var scrollTimer = null;

      function normalizeUrl(u) {
        if (!u) return null;
        var url = ('' + u).trim();
        if (!url) return null;
        if (url.indexOf('//') === 0) return 'https:' + url;
        return url;
      }

      function collectUrls() {
        var urls = [];
        try {
          var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
          for (var i = 0; i < imgs.length; i++) {
            var img = imgs[i];
            try {
              var candidate = img.currentSrc || img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || img.getAttribute('data-original') || '';
              var n = normalizeUrl(candidate);
              if (n && urls.indexOf(n) === -1) urls.push(n);
            } catch (e) {}
          }
        } catch (e) {}
        return urls;
      }

      function done() {
        try {
          var urls = collectUrls().slice(0, 12);
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'imageScrapeUrls', urls: urls })
          );
        } catch(e) {}
        if (pollTimer) clearInterval(pollTimer);
        if (scrollTimer) clearInterval(scrollTimer);
      }

      function step() {
        if (collectUrls().length >= 6) return done();
        if (Date.now() - start > MAX_TIME) return done();
      }

      var y = 0;
      scrollTimer = setInterval(function(){
        try {
          y += 800;
          window.scrollTo(0, y);
          window.dispatchEvent(new Event('scroll'));
        } catch(e) {}
      }, 200);

      pollTimer = setInterval(step, INTERVAL_MS);
      step();
    })();
    true;
  `;

  const parseYandexImageUrlsFromHtml = (html: string): string[] => {
    try {
      const results: string[] = [];
      const imgTagRegex = /<img\b[^>]*class=(["'])([^"']*?)\1[^>]*>/gi;
      let match: RegExpExecArray | null;
      while ((match = imgTagRegex.exec(html)) !== null) {
        const classAttr = match[2] || '';
        if ( //
          classAttr.indexOf('ImagesContentImage-Image') !== -1 &&
          classAttr.indexOf('ImagesContentImage-Image_clickable') !== -1
        ) {
          const tag = match[0];
          let url: string | null = null;
          const srcsetMatch = /srcset=(["'])([^"']+?)\1/i.exec(tag);
          if (srcsetMatch && srcsetMatch[2]) {
            url = srcsetMatch[2].split(',')[0].trim().split(/\s+/)[0];
          }
          if (!url) {
            const dataSrcMatch = /data-src=(["'])([^"']+?)\1/i.exec(tag);
            if (dataSrcMatch && dataSrcMatch[2]) url = dataSrcMatch[2];
          }
          if (!url) {
            const srcMatch = /src=(["'])([^"']+?)\1/i.exec(tag);
            if (srcMatch && srcMatch[2]) url = srcMatch[2];
          }
          if (url) {
            let normalized = url;
            if (normalized.startsWith('//')) normalized = 'https:' + normalized;
            else if (normalized.startsWith('/')) normalized = 'https://yandex.com' + normalized;
            if (!results.includes(normalized)) {
              results.push(normalized);
              if (results.length >= 6) break;
            }
          }
        }
      }
      return results.slice(0, 6);
    } catch {
      return [];
    }
  };

  const fetchImageUrls = async (word: string): Promise<string[]> => {
    const searchUrl = `https://yandex.com/images/search?text=${encodeURIComponent(word)}`;
    if (imageScrape) {
      return [];
    }
    const result: string[] = await new Promise<string[]>((resolve, reject) => {
      imageScrapeResolveRef.current = resolve;
      imageScrapeRejectRef.current = reject;
      setImageScrape({ url: searchUrl, word });
    }).catch(() => [] as string[]);
    if (Array.isArray(result) && result.length > 0) return result.slice(0, 6);
    return [];
  };

  const onScrapeMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'imageScrapeUrls' && Array.isArray(data.urls)) {
        const urls: string[] = (data.urls as unknown[])
          .map((u) => (typeof u === 'string' ? u : ''))
          .filter((u) => !!u)
          .slice(0, 6);
        imageScrapeResolveRef.current?.(urls);
        imageScrapeResolveRef.current = null;
        imageScrapeRejectRef.current = null;
        setImageScrape(null);
        return;
      }
      if (data && data.type === 'imageScrapeHtml' && typeof data.html === 'string') {
        const urls = parseYandexImageUrlsFromHtml(data.html);
        imageScrapeResolveRef.current?.(urls);
        imageScrapeResolveRef.current = null;
        imageScrapeRejectRef.current = null;
        setImageScrape(null);
      }
    } catch {
      imageScrapeResolveRef.current?.([]);
      imageScrapeResolveRef.current = null;
      imageScrapeRejectRef.current = null;
      setImageScrape(null);
    }
  };

  const openPanel = (word: string, sentence?: string) => {
    setTranslationPanel({ word, translation: '', sentence, images: [], imagesLoading: true, translationLoading: true });
    fetchTranslation(word)
      .then((translation) => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, translation: translation || prev.translation, translationLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, translationLoading: false } : prev));
      });
    fetchImageUrls(word)
      .then((imgs) => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, images: imgs, imagesLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, images: [], imagesLoading: false } : prev));
      });
  };

  const saveCurrentWord = async () => {
    if (!translationPanel) return;
    const entry = {
      word: translationPanel.word,
      translation: translationPanel.translation,
      sentence: translationPanel.sentence || '',
      addedAt: new Date().toISOString(),
      numberOfCorrectAnswers: {
        missingLetters: 0,
        missingWords: 0,
        chooseTranslation: 0,
        chooseWord: 0,
        memoryGame: 0,
        writeTranslation: 0,
        writeWord: 0,
      },
    } as const;

    const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;
    try {
      let current: unknown = [];
      try {
        const content = await RNFS.readFile(filePath, 'utf8');
        current = JSON.parse(content);
      } catch {
        current = [];
      }
      const arr = Array.isArray(current) ? current : [];

      const normalize = (it: any) => {
        const base = it && typeof it === 'object' ? it : {};
        const noa = (base as any).numberOfCorrectAnswers || {};
        const safeNoa = {
          missingLetters: Math.max(0, Number(noa.missingLetters) || 0),
          missingWords: Math.max(0, Number(noa.missingWords) || 0),
          chooseTranslation: Math.max(0, Number(noa.chooseTranslation) || 0),
          chooseWord: Math.max(0, Number(noa.chooseWord) || 0),
          memoryGame: Math.max(0, Number(noa.memoryGame) || 0),
          writeTranslation: Math.max(0, Number(noa.writeTranslation) || 0),
          writeWord: Math.max(0, Number(noa.writeWord) || 0),
        };
        return { ...base, numberOfCorrectAnswers: safeNoa };
      };
      const normalized = arr.map(normalize);

      const exists = normalized.some(
        (it: any) => it && typeof it === 'object' && it.word === entry.word && it.sentence === entry.sentence
      );
      if (!exists) normalized.push(entry);

      await RNFS.writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf8');
      if (Platform.OS === 'android') {
        ToastAndroid.show('Saved', ToastAndroid.SHORT);
      } else {
        Alert.alert('Saved', 'Word added to your list.');
      }
    } catch (e) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to save', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Failed to save the word.');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={[styles.backText]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.headerText }]} numberOfLines={1}>{bookTitle || 'Reader'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setShowThemeMenu((v) => !v)} style={styles.themeBtn}>
            <Text style={[styles.themeBtnText, { color: themeColors.headerText }]}>Aa</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showThemeMenu && (
        <View style={[styles.themeMenu, { backgroundColor: themeColors.menuBg, borderColor: themeColors.border }]}>
          {(['white','beige'] as ReaderTheme[]).map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => { setReaderTheme(opt); setShowThemeMenu(false); }}
              style={[styles.themeMenuItem, readerTheme === opt ? styles.themeMenuItemActive : null]}
            >
              <View style={[styles.themeSwatch, opt === 'white' ? { backgroundColor: '#ffffff', borderColor: '#e5e7eb' } : { backgroundColor: '#f5f1e8', borderColor: '#e5dfcf' }]} />
              <Text style={[styles.themeMenuItemText, { color: themeColors.menuText }]}>{opt === 'white' ? 'White' : 'Beige'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
        {!!(!loading && !error) && (
          bookFormat === 'epub' ? (
            !!src && (
              <ReaderProvider>
                <Reader
                  key={`reader-${readerTheme}`}
                  src={src}
                  width={width}
                  height={height - 56 - 300}
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
            )
          ) : (
            !!pdfHtml && (
              <WebView
                source={{ html: pdfHtml }}
                style={{ width: width, height: height - 56 - 300, backgroundColor: themeColors.bg }}
                onMessage={handleWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={["*"]}
                allowUniversalAccessFromFileURLs
                allowFileAccess
              />
            )
          )
        )}
        {imageScrape && (
          <View style={{ position: 'absolute', left: -10000, top: 0, width: 360, height: 1200, opacity: 0 }}>
            <WebView
              ref={hiddenWebViewRef}
              source={{ uri: imageScrape.url }}
              style={{ width: '100%', height: '100%' }}
              injectedJavaScript={imageScrapeInjection}
              injectedJavaScriptBeforeContentLoaded={imageScrapeInjection}
              onMessage={onScrapeMessage}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              onLoad={() => {
                try { hiddenWebViewRef.current?.injectJavaScript(imageScrapeInjection); } catch (e) {}
              }}
              onError={() => {
                imageScrapeRejectRef.current?.();
                imageScrapeResolveRef.current = null;
                imageScrapeRejectRef.current = null;
                setImageScrape(null);
              }}
            />
          </View>
        )}
        <TranslationPanel
          panel={translationPanel}
          onSave={saveCurrentWord}
          onClose={() => setTranslationPanel(null)}
        />
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
  themeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  themeBtnText: { fontWeight: '700', 
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'black',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  themeMenu: {
    position: 'absolute',
    right: 12,
    top: 56 + 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    width: 180,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 1000,
  },
  themeMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  themeMenuItemActive: {},
  themeMenuItemText: { marginLeft: 10, fontSize: 14 },
  themeSwatch: { width: 20, height: 20, borderRadius: 4, borderWidth: StyleSheet.hairlineWidth },
  readerContainer: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 12,
    zIndex: 999,
  },
  bottomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bottomWord: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 12,
  },
  addBtnWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  addBtnText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
    includeFontPadding: false,
  },
  closeBtn: {
    fontSize: 20,
    color: '#000',
    opacity: 0.9,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  translationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  sentenceText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  imageRow: {
    flexGrow: 0,
  },
  imageRowLoader: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translationLoadingRow: {
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 8,
  },
  imageItem: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#eee',
  },
});


