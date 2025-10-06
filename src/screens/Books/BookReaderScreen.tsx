import React from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, ToastAndroid, TouchableOpacity, View, useWindowDimensions, Keyboard, Modal, TextInput, NativeModules } from 'react-native';
import TranslationPanel, { type TranslationPanelState } from '../../components/TranslationPanel';
import { fetchTranslation as fetchTranslationCommon } from '../../utils/translation';
import { Reader, ReaderProvider } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as RNFS from 'react-native-fs';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { parseYandexImageUrlsFromHtml, fetchImageUrls as fetchImageUrlsCommon, type ImageScrapeCallbacks } from '../practice/common';
import { getLibraryMeta, searchLibraryWithCriterias, addUrlToLibrary } from '../../config/api';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import { useLoginGate } from '../../contexts/LoginGateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import wordCountService from '../../services/wordCountService';
import AddToFavouritesDialog from '../../components/AddToFavouritesDialog';

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
const OPENED_BEFORE_KEY = 'books.openedBefore';
const BOOK_LIBRARY_STATUS_KEY = 'books.libraryStatus';

type RouteParams = { id: string };

function BookReaderScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width, height } = useWindowDimensions();
  const { showLoginGate } = useLoginGate();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [bookTitle, setBookTitle] = React.useState<string>('');
  const [src, setSrc] = React.useState<string | null>(null);
  const [initialCfi, setInitialCfi] = React.useState<string | undefined>(undefined);
  const [bookFormat, setBookFormat] = React.useState<'epub' | 'pdf'>('epub');
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(1);

  const [translationPanel, setTranslationPanel] = React.useState<TranslationPanelState | null>(null);

  const { learningLanguage, nativeLanguage } = useLanguage();
  const { languageMappings } = useLanguageMappings();

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



  // Add-to-library modal state
  const [showAddBookModal, setShowAddBookModal] = React.useState<boolean>(false);
  const [newBookName, setNewBookName] = React.useState<string>('');
  const [newBookUrl, setNewBookUrl] = React.useState<string>('');
  const [itemTypes, setItemTypes] = React.useState<string[]>([]);
  const [selectedTypeName, setSelectedTypeName] = React.useState<string | null>(null);
  const [showTypeOptions, setShowTypeOptions] = React.useState<boolean>(false);
  const [typeError, setTypeError] = React.useState<boolean>(false);

  // Add-to-favourites modal state
  const [showFavouriteModal, setShowFavouriteModal] = React.useState<boolean>(false);

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
            setCurrentPage(1);
            setTotalPages(1); // Will be updated when reader loads
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


  // Fetch library metadata for item types
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json: { itemTypes?: string[] } = await getLibraryMeta();
        if (!cancelled && Array.isArray(json.itemTypes)) setItemTypes(json.itemTypes);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Weekly prompt logic: check last prompt time, verify URL existence in library, then either ask or open add dialog
  React.useEffect(() => {
    if (!bookId) return;
    let cancelled = false;
    const PROMPT_TS_KEY = 'books.addUrlPromptedAt';
    const BOOK_URLS_KEY = 'books.bookUrlById';
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
                const json: { urls?: { url: string }[] } = await searchLibraryWithCriterias(toLanguageSymbol(learningLanguage), undefined, undefined, 'book');
                const list = Array.isArray(json?.urls) ? json.urls : [];
                existsInLibrary = list.some((it) => (it && typeof it.url === 'string' ? it.url.trim() : '') === normalizedSaved);
                
                // Cache the result for future use
                const nextStatus = { ...statusMap, [normalizedSaved]: existsInLibrary };
                await AsyncStorage.setItem(BOOK_LIBRARY_STATUS_KEY, JSON.stringify(nextStatus));
              } catch {}
            }
          } catch {}
        }

        if (cancelled) return;

        const openAddDialog = async () => {
          setTypeError(false);
          setSelectedTypeName(null);
          setNewBookName(bookTitle || '');
          setNewBookUrl('');
          setShowTypeOptions(false);
          setShowAddBookModal(true);
          await markPromptShownNow();
        };

        if (existsInLibrary) {
          // If it exists, directly open add dialog (e.g., to add another source)
          await openAddDialog();
          return;
        }

        const onYes = async () => {
          await markPromptShownNow();
          setTypeError(false);
          setSelectedTypeName(null);
          setNewBookName(bookTitle || '');
          setNewBookUrl('');
          setShowTypeOptions(false);
          setShowAddBookModal(true);
        };
        const onNo = async () => { await markPromptShownNow(); };

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
    return () => { cancelled = true; };
  }, [bookId, learningLanguage, bookTitle]);

  // Mark this book as "opened before" on unmount so future sessions can show the prompt
  React.useEffect(() => {
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

  const toLanguageSymbol = (input: string | null): 'en' | 'es' => {
    const v = (input || '').toLowerCase().trim();
    if (v === 'es' || v === 'spanish' || v === 'español') return 'es';
    return 'en';
  };

  const normalizeUrl = (input: string): string => {
    if (!input) return '';
    const trimmed = input.trim();
    if (!trimmed) return '';
    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
    const startsWithWww = /^www\./i.test(trimmed);
    const looksLikeDomain = /^[^\s]+\.[^\s]{2,}$/.test(trimmed);
    const looksLikeIp = /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(trimmed);
    if (!hasScheme && (startsWithWww || looksLikeDomain || looksLikeIp)) {
      return `https://${trimmed}`;
    }
    return hasScheme ? trimmed : '';
  };

  const validateType = (t?: string | null): string => {
    const v = (t || '').toLowerCase().trim();
    if (itemTypes.map((x) => x.toLowerCase()).includes(v)) return v;
    return 'any';
  };

  const postAddBookUrlToLibrary = async (url: string, typeName?: string | null, displayName?: string | null) => {
    try {
      const normalizedUrl = normalizeUrl(url);
      if (!normalizedUrl) return;
      const lang = toLanguageSymbol(learningLanguage);
      const safeType = validateType(typeName);
      const safeName = (displayName || bookTitle || 'Book').trim() || 'Book';
      const body = {
        url: normalizedUrl,
        language: lang,
        level: 'easy',
        type: safeType,
        name: safeName,
        media: 'book',
      } as const;
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
          const BOOK_URLS_KEY = 'books.bookUrlById';
          const raw = await AsyncStorage.getItem(BOOK_URLS_KEY);
          const map = raw ? JSON.parse(raw) : {};
          const next = { ...(map && typeof map === 'object' ? map : {}), [bookId]: normalizedUrl };
          await AsyncStorage.setItem(BOOK_URLS_KEY, JSON.stringify(next));
        } catch {}
      }
    } catch {}
  };

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

  const goToNextPage = () => {
    try {
      const script = `
        try {
          if (window.rendition && typeof window.rendition.next === 'function') {
            window.rendition.next();
          }
        } catch (e) {
          console.log('Error navigating to next page:', e);
        }
      `;
      // We'll need to inject this through the WebView message system
      // For now, just update the page counter optimistically
      setCurrentPage(prev => Math.min(prev + 1, totalPages));
    } catch (e) {
      console.log('Error navigating to next page:', e);
    }
  };

  const goToPreviousPage = () => {
    try {
      const script = `
        try {
          if (window.rendition && typeof window.rendition.prev === 'function') {
            window.rendition.prev();
          }
        } catch (e) {
          console.log('Error navigating to previous page:', e);
        }
      `;
      // We'll need to inject this through the WebView message system
      // For now, just update the page counter optimistically
      setCurrentPage(prev => Math.max(prev - 1, 1));
    } catch (e) {
      console.log('Error navigating to previous page:', e);
    }
  };

  const handleLocationChange = React.useCallback((totalLocations: number, currentLocation: any) => {
    const cfi: string | null = currentLocation?.start?.cfi ?? currentLocation?.end?.cfi ?? null;
    void persistCfi(cfi);
  }, [persistCfi]);

  // const persistPdfPage = React.useCallback(async (page: number) => {
  //   try {
  //     if (!bookId) return;
  //     const json = await AsyncStorage.getItem(STORAGE_KEY);
  //     const parsed = json ? JSON.parse(json) : [];
  //     const books: StoredBook[] = Array.isArray(parsed) ? parsed : [];
  //     const next = books.map((b) => (b.id === bookId ? { ...b, lastPdfPage: Math.max(1, Number(page) || 1) } : b));
  //     await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next, null, 2));
  //   } catch {
  //     // ignore
  //   }
  // }, [bookId]);

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
      // if (data && data.type === 'pdfPage' && typeof data.page === 'number') {
      //   const pageNum = Number(data.page);
      //   setCurrentPage(pageNum);
      //   void persistPdfPage(pageNum);
      //   return;
      // }
      // if (data && data.type === 'pdfTotalPages' && typeof data.totalPages === 'number') {
      //   setTotalPages(Number(data.totalPages));
      //   return;
      // }
    } catch {}
  }, []);

  
  const fetchTranslation = async (word: string): Promise<string> => {
    const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);        
    const map = Object.fromEntries(entries);
    const learningRaw = map['language.learning'];
    const nativeRaw = map['language.native'];
    return await fetchTranslationCommon(word, learningRaw, nativeRaw, languageMappings);
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

  

  const fetchImageUrls = async (word: string): Promise<string[]> => {
    if (imageScrape) {
      return [];
    }
    
    const callbacks: ImageScrapeCallbacks = {
      onImageScrapeStart: (url: string, word: string) => {
        setImageScrape({ url, word });
      },
      onImageScrapeComplete: (urls: string[]) => {
        imageScrapeResolveRef.current?.(urls);
        imageScrapeResolveRef.current = null;
        imageScrapeRejectRef.current = null;
        setImageScrape(null);
      },
      onImageScrapeError: () => {
        imageScrapeResolveRef.current?.([]);
        imageScrapeResolveRef.current = null;
        imageScrapeRejectRef.current = null;
        setImageScrape(null);
      }
    };

    return new Promise<string[]>((resolve, reject) => {
      imageScrapeResolveRef.current = resolve;
      imageScrapeRejectRef.current = reject;
      
      fetchImageUrlsCommon(word, callbacks);
    }).catch(() => [] as string[]);
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
    
    // Check if user is authenticated, if not, check word count and show login gate
    if (!isAuthenticated) {
      await wordCountService.initialize();
      const currentCount = wordCountService.getWordCount();
      
      // Show login gate if this would be the 3rd word (after saving, count would be 3)
      if (currentCount.totalWordsAdded >= 2) {
        showLoginGate();
        return;
      }
    }

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
      
      if (!exists) {
        normalized.push(entry);
        
        // Increment word count for translations
        if (!isAuthenticated) {
          await wordCountService.incrementTranslationsSaved();
        }
      }

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
          <TouchableOpacity onPress={() => setShowFavouriteModal(true)} style={styles.favouriteBtn}>
            <Text style={[styles.favouriteBtnText, { color: themeColors.headerText }]}>★</Text>
          </TouchableOpacity>
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
          bookFormat === 'epub' && (
            !!src && (
              <ReaderProvider>
                <Reader
                  key={`reader-${readerTheme}`}
                  src={src}
                  width={width}
                  height={height - 56 - 60 - 300}
                  fileSystem={useFileSystem}
                  initialLocation={initialCfi}
                  onLocationChange={(totalLocations: number, currentLocation: any) => {
                    handleLocationChange(totalLocations, currentLocation);
                    // Update current page for EPUB
                    if (totalLocations > 0) {
                      const currentPageNum = Math.floor((currentLocation?.start?.location || 0) / totalLocations * totalLocations) + 1;
                      setCurrentPage(Math.max(1, currentPageNum));
                      setTotalPages(totalLocations);
                    }
                  }}
                  onDisplayError={(reason: string) => setError(reason || 'Failed to display book')}
                  onReady={() => setError(null)}
                  allowScriptedContent
                  injectedJavascript={injectedJavascript}
                  onWebViewMessage={handleWebViewMessage}
                />
              </ReaderProvider>
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
          isBookScreen={true}
          onTranslate={(word: string) => {
            openPanel(word, translationPanel?.sentence);
          }}
          onRetranslate={(word: string) => {
            openPanel(word, translationPanel?.sentence);
          }}
        />
        {/* Add book to library modal */}
        <Modal
          visible={showAddBookModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddBookModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Add book to library</Text>
              {learningLanguage && (
                <Text style={[styles.inputLabel, { marginTop: 0 }]}>Learning language: {toLanguageSymbol(learningLanguage)}</Text>
              )}
              <Text style={styles.inputLabel}>Book type</Text>
              <TouchableOpacity
                onPress={() => setShowTypeOptions((prev) => !prev)}
                style={[styles.modalInput, typeError && !selectedTypeName ? { borderColor: '#ef4444' } : null]}
                activeOpacity={0.7}
              >
                <Text style={{ color: selectedTypeName ? '#111827' : '#9ca3af' }}>
                  {selectedTypeName || 'Select type'}
                </Text>
              </TouchableOpacity>
              {showTypeOptions && (
                <View style={[styles.modalInput, { paddingVertical: 0, marginTop: 8 }]}> 
                  {itemTypes.map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => { setSelectedTypeName(t); setShowTypeOptions(false); setTypeError(false); }}
                      style={{ paddingVertical: 10 }}
                    >
                      <Text style={{ color: '#111827' }}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {typeError && !selectedTypeName && (
                <Text style={styles.errorText}>Type is required</Text>
              )}
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={newBookName}
                onChangeText={setNewBookName}
                placeholder="Enter a name"
              />
              <Text style={styles.inputLabel}>Download URL</Text>
              <TextInput
                style={styles.modalInput}
                value={newBookUrl}
                onChangeText={setNewBookUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="https://example.com/my-book.epub"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
                <TouchableOpacity onPress={() => setShowAddBookModal(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    const u = normalizeUrl(newBookUrl);
                    if (!u) {
                      if (Platform.OS === 'android') ToastAndroid.show('Invalid URL', ToastAndroid.SHORT); else Alert.alert('Invalid URL');
                      return;
                    }
                    if (!selectedTypeName) { setTypeError(true); return; }
                    const nm = (newBookName || bookTitle || 'Book').trim();
                    await postAddBookUrlToLibrary(u, selectedTypeName, nm);
                    setShowAddBookModal(false);
                    if (Platform.OS === 'android') ToastAndroid.show('Added to library', ToastAndroid.SHORT); else Alert.alert('Added');
                  }}
                  style={[styles.modalCloseBtn, { backgroundColor: '#007AFF' }]}
                >
                  <Text style={[styles.modalCloseText, { color: 'white' }]}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Add to favourites modal */}
        <AddToFavouritesDialog
          visible={showFavouriteModal}
          onClose={() => setShowFavouriteModal(false)}
          onSuccess={() => {
            if (Platform.OS === 'android') {
              ToastAndroid.show('Added to favourites', ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', 'Book added to favourites');
            }
          }}
          defaultName={bookTitle || ''}
          defaultType="book"
          defaultLevel="easy"
          learningLanguage={learningLanguage}
          storageKey="surf.favourites"
        />
        
        {/* Navigation Bar */}
        <View style={[styles.navigationBar, { backgroundColor: themeColors.headerBg, borderTopColor: themeColors.border }]}>
          <TouchableOpacity 
            style={[
              styles.navButton, 
              { 
                borderColor: themeColors.border,
                opacity: currentPage <= 1 ? 0.5 : 1
              }
            ]}
            onPress={goToPreviousPage}
            disabled={currentPage <= 1}
          >
            <Text style={[styles.navButtonText, { color: themeColors.headerText }]}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.pageInfo}>
            <Text style={[styles.pageNumber, { color: themeColors.headerText }]}>
              Page {currentPage} of {totalPages}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.navButton, 
              { 
                borderColor: themeColors.border,
                opacity: currentPage >= totalPages ? 0.5 : 1
              }
            ]}
            onPress={goToNextPage}
            disabled={currentPage >= totalPages}
          >
            <Text style={[styles.navButtonText, { color: themeColors.headerText }]}>›</Text>
          </TouchableOpacity>
        </View>
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
  favouriteBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 8 },
  favouriteBtnText: { fontWeight: '700', fontSize: 18 },
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
    top: 56,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 13,
    color: '#374151',
  },
  inputLabel: {
    fontSize: 12,
    color: '#374151',
    marginTop: 8,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
  },
  navigationBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
  },
  pageInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
});


