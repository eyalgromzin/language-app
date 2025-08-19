import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import TranslationPanel, { type TranslationPanelState } from '../../components/TranslationPanel';
import { fetchTranslation as fetchTranslationCommon } from '../../utils/translation';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';

function SurfScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const webViewRef = React.useRef<WebView>(null);
  const route = useRoute<any>();
  const initialUrlFromParams: string | undefined = typeof route?.params?.url === 'string' ? route.params.url : undefined;
  const defaultHomepage = 'https://cnnespanol.cnn.com/';
  const [addressText, setAddressText] = React.useState<string>(initialUrlFromParams || defaultHomepage);
  const [currentUrl, setCurrentUrl] = React.useState<string>(initialUrlFromParams || defaultHomepage);
  const [canGoBack, setCanGoBack] = React.useState<boolean>(false);
  const [translationPanel, setTranslationPanel] = React.useState<TranslationPanelState | null>(null);

  // Languages selected by the user (Settings / Startup)
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);
        if (!mounted) return;
        const map = Object.fromEntries(entries);
        setLearningLanguage(map['language.learning'] ?? null);
        setNativeLanguage(map['language.native'] ?? null);
      } catch {
        if (!mounted) return;
        setLearningLanguage(null);
        setNativeLanguage(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Hidden WebView state to scrape lazy-loaded image results
  const [imageScrape, setImageScrape] = React.useState<null | { url: string; word: string }>(null);
  const imageScrapeResolveRef = React.useRef<((urls: string[]) => void) | null>(null);
  const imageScrapeRejectRef = React.useRef<((err?: unknown) => void) | null>(null);
  const hiddenWebViewRef = React.useRef<WebView>(null);
  const addressInputRef = React.useRef<TextInput>(null);

  // --- URL autocomplete state ---
  const DOMAINS_KEY = 'surf.domains';
  const [savedDomains, setSavedDomains] = React.useState<string[]>([]);
  const [isAddressFocused, setIsAddressFocused] = React.useState<boolean>(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DOMAINS_KEY);
        if (!mounted) return;
        const arr = JSON.parse(raw || '[]');
        setSavedDomains(Array.isArray(arr) ? (arr as string[]).filter(Boolean) : []);
      } catch {
        if (!mounted) return;
        setSavedDomains([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getDomainFromUrlString = (input: string): string | null => {
    try {
      const str = (input || '').trim();
      if (!str) return null;
      const m = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/([^/]+)/.exec(str);
      const host = m ? m[1] : (/^www\./i.test(str) || /[^\s]+\.[^\s]{2,}/.test(str) ? str.split('/')[0] : null);
      if (!host) return null;
      const lower = host.toLowerCase();
      const noWww = lower.startsWith('www.') ? lower.slice(4) : lower;
      return noWww;
    } catch { return null; }
  };

  const saveDomain = async (domain: string) => {
    const normalized = (domain || '').toLowerCase().replace(/^www\./, '');
    if (!normalized) return;
    setSavedDomains(prev => {
      const next = [normalized, ...prev.filter(d => d !== normalized)];
      const limited = next.slice(0, 100);
      AsyncStorage.setItem(DOMAINS_KEY, JSON.stringify(limited)).catch(() => {});
      return limited;
    });
  };

  const filteredDomains = React.useMemo(() => {
    const raw = (addressText || '').trim();
    if (raw.length === 0) return savedDomains.slice(0, 8);
    const withoutScheme = raw.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '');
    const fragment = withoutScheme.split('/')[0].toLowerCase().replace(/^www\./, '');
    if (!fragment) return savedDomains.slice(0, 8);
    return savedDomains.filter(d => d.startsWith(fragment)).slice(0, 8);
  }, [addressText, savedDomains]);

  const selectSuggestion = (domain: string) => {
    const url = normalizeUrl(domain);
    setAddressText(url);
    setCurrentUrl(url);
    saveDomain(domain);
    setIsAddressFocused(false);
  };

  const normalizeUrl = (input: string): string => {
    if (!input) return 'about:blank';
    const trimmed = input.trim();
    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
    const hasSpaces = /\s/.test(trimmed);
    const startsWithWww = /^www\./i.test(trimmed);
    const looksLikeDomain = /^[^\s]+\.[^\s]{2,}$/.test(trimmed);
    const looksLikeIp = /^\d{1,3}(\.\d{1,3}){3}(?::\d+)?(\/|$)/.test(trimmed);

    // If it doesn't look like a URL, perform a Google search
    if (hasSpaces || (!hasScheme && !startsWithWww && !looksLikeDomain && !looksLikeIp)) {
      return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    }

    // Otherwise, treat it as a URL and ensure it has a scheme
    return hasScheme ? trimmed : `https://${trimmed}`;
  };

  const submit = () => {
    const normalized = normalizeUrl(addressText.trim());
    setCurrentUrl(normalized);
    const domain = getDomainFromUrlString(normalized);
    if (domain) saveDomain(domain);
  };

  const goBack = () => {
    try { webViewRef.current?.goBack(); } catch (e) {}
  };

  const goForward = () => {
    try { webViewRef.current?.goForward(); } catch (e) {}
  };

  const baseInjection = `
    (function() {
      if (window.__wordClickInstalled_v8) return;
      window.__wordClickInstalled_v8 = true;
      var lastTouch = { x: 0, y: 0 };
      var lastPostedWord = '';
      var lastPostedAt = 0;
      var LONG_PRESS_MS = 450;
      var pressTimer = null;
      var pressing = false;
      var pressAnchor = null;
      var suppressNextClick = false;

      function notifyPointerDown() {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pointerdown' }));
          }
        } catch (e) {}
      }

      function getRangeFromPoint(x, y) {
        if (document.caretRangeFromPoint) return document.caretRangeFromPoint(x, y);
        if (document.caretPositionFromPoint) {
          var pos = document.caretPositionFromPoint(x, y);
          if (!pos) return null;
          var r = document.createRange();
          try { r.setStart(pos.offsetNode, pos.offset); r.collapse(true); } catch (e) {}
          return r;
        }
        return null;
      }
      function isWordChar(ch) { return /[\\p{L}\\p{N}\\u00C0-\\u024F'\-]/u.test(ch); }
      function selectWordAtPoint(x, y) {
        var range = getRangeFromPoint(x, y);
        if (!range || !range.startContainer) return null;
        var node = range.startContainer;
        if (!node || node.nodeType !== Node.TEXT_NODE) return null;
        var text = node.textContent || '';
        var offset = Math.min(range.startOffset || 0, text.length);
        var s = offset; while (s > 0 && isWordChar(text[s - 1])) s--;
        var e = offset; while (e < text.length && isWordChar(text[e])) e++;
        var word = (text.slice(s, e) || '').trim();
        if (!word) return null;
        try {
          var sel = window.getSelection && window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            var wordRange = document.createRange();
            wordRange.setStart(node, s);
            wordRange.setEnd(node, e);
            sel.addRange(wordRange);
          }
        } catch (err) {}
        // Try to build a sentence around the word within the same text node
        var sentence = '';
        try {
          var punct = /[\.!?。！？]/;
          var ss = s; while (ss > 0 && !punct.test(text[ss - 1])) ss--;
          var ee = e; while (ee < text.length && !punct.test(text[ee])) ee++;
          sentence = (text.slice(ss, Math.min(ee + 1, text.length)) || '').replace(/\s+/g, ' ').trim();
        } catch (e2) { sentence = ''; }
        if (!sentence) {
          try {
            // Fallback: use nearest block's innerText
            var el = (node.parentElement || null);
            while (el && el.innerText && el.innerText.trim().length < 1) el = el.parentElement;
            var blockText = el && el.innerText ? el.innerText : text;
            // Find a sentence containing the word (first occurrence)
            var idx = blockText.toLowerCase().indexOf(word.toLowerCase());
            if (idx >= 0) {
              var start = idx; while (start > 0 && !punct.test(blockText[start - 1])) start--;
              var end = idx + word.length; while (end < blockText.length && !punct.test(blockText[end])) end++;
              sentence = (blockText.slice(start, Math.min(end + 1, blockText.length)) || '').replace(/\s+/g, ' ').trim();
            }
          } catch (e3) { sentence = ''; }
        }
        return { word: word, sentence: sentence };
      }
      function postWord(payload, source) {
        try {
          if (!payload || !payload.word) return;
          var now = Date.now();
          if (payload.word === lastPostedWord && (now - lastPostedAt) < 250) return;
          lastPostedWord = payload.word; lastPostedAt = now;
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: source, word: payload.word, sentence: payload.sentence || '' }));
          }
        } catch (e) {}
      }

      function onTouchStart(e) {
        try {
          notifyPointerDown();
          pressing = true;
          var t = e.touches && e.touches[0];
          if (t) { lastTouch.x = t.clientX; lastTouch.y = t.clientY; }
          pressAnchor = e.target && e.target.closest ? e.target.closest('a[href]') : null;
          suppressNextClick = false;
          if (pressTimer) clearTimeout(pressTimer);
          pressTimer = setTimeout(function() {
            if (!pressing) return;
            if (pressAnchor) {
              var res = selectWordAtPoint(lastTouch.x, lastTouch.y);
              if (!res) {
                var selTxt = window.getSelection ? (window.getSelection().toString().trim()) : '';
                if (selTxt && selTxt.split(/\s+/).length === 1) res = { word: selTxt, sentence: '' };
              }
              if (res && res.word) {
                suppressNextClick = true; // prevent navigation after long-press
                postWord(res, 'longpress');
              }
            }
          }, LONG_PRESS_MS);
        } catch (err) {}
      }

      function onTouchEnd() {
        try {
          pressing = false;
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        } catch (err) {}
      }

      function onMouseDown(e) {
        try { notifyPointerDown(); } catch (err) {}
      }

      function onClick(e) {
        try {
          if (suppressNextClick) {
            e.preventDefault();
            e.stopPropagation();
            suppressNextClick = false;
            return;
          }
          var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
          if (!a) {
            var res = selectWordAtPoint(e.clientX || lastTouch.x, e.clientY || lastTouch.y);
            if (!res) {
              var selTxt = window.getSelection ? (window.getSelection().toString().trim()) : '';
              if (selTxt && selTxt.split(/\\s+/).length === 1) res = { word: selTxt, sentence: '' };
            }
            if (res && res.word) {
              e.preventDefault();
              e.stopPropagation();
              postWord(res, 'wordClick');
              return;
            }
          }
          // Notify RN that a link was clicked so it can hint long-press UX
          if (a && window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'linkClick', href: a.href || '' }));
            } catch (err) {}
          }
          // Otherwise, allow default behavior so links open normally
        } catch (err) {}
      }

      document.addEventListener('touchstart', onTouchStart, true);
      document.addEventListener('touchend', onTouchEnd, true);
      document.addEventListener('mousedown', onMouseDown, true);
      document.addEventListener('click', onClick, true);
    })();
    true;
  `;

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

  const HOMEPAGE_KEY = 'surf.homepage';

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(HOMEPAGE_KEY);
        if (!mounted) return;
        if (!initialUrlFromParams && typeof saved === 'string' && saved.trim().length > 0) {
          setAddressText(saved);
          setCurrentUrl(saved);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [initialUrlFromParams]);

  React.useEffect(() => {
    if (initialUrlFromParams) {
      const normalized = normalizeUrl(initialUrlFromParams);
      setAddressText(normalized);
      setCurrentUrl(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrlFromParams]);

  const promptSetHomepage = () => {
    const urlToSave = normalizeUrl(addressText.trim() || currentUrl);
    const confirmAndSave = async () => {
      try {
        await AsyncStorage.setItem(HOMEPAGE_KEY, urlToSave);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Homepage set', ToastAndroid.SHORT);
        } else {
          Alert.alert('Homepage set');
        }
      } catch {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Failed to set homepage', ToastAndroid.SHORT);
        } else {
          Alert.alert('Error', 'Failed to set homepage');
        }
      }
    };
    try {
      Alert.alert(
        'Set Homepage',
        'do you want to set this website as homepage?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: confirmAndSave },
        ],
        { cancelable: true }
      );
    } catch {
      confirmAndSave();
    }
  };

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'pointerdown') {
        if (translationPanel) setTranslationPanel(null);
        setIsAddressFocused(false);
        return;
      }
      if ((data?.type === 'wordClick' || data?.type === 'longpress' || data?.type === 'selection') && typeof data.word === 'string' && data.word.length > 0) {
        openPanel(data.word, typeof data.sentence === 'string' ? data.sentence : undefined);
      }
      if (data?.type === 'linkClick') {
        if (Platform.OS === 'android') {
          try { ToastAndroid.show('long press to select word', ToastAndroid.SHORT); } catch (e) {}
        }
      }
    } catch {
      // ignore malformed messages
    }
  };

  const openPanel = (word: string, sentence?: string) => {
    // Start with empty translation and show a loader while fetching
    setTranslationPanel({ word, translation: '', sentence, images: [], imagesLoading: true, translationLoading: true });
    fetchTranslation(word)
      .then((t) => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, translation: t || prev.translation, translationLoading: false } : prev));
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

      // Ensure all entries have numberOfCorrectAnswers with default zeros
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

  const fetchTranslation = async (word: string): Promise<string> => fetchTranslationCommon(word, learningLanguage, nativeLanguage);

  const parseYandexImageUrlsFromHtml = (html: string): string[] => {
    try {
      const results: string[] = [];
      const imgTagRegex = /<img\b[^>]*class=(["'])([^"']*?)\1[^>]*>/gi;
      let match: RegExpExecArray | null;
      while ((match = imgTagRegex.exec(html)) !== null) {
        const classAttr = match[2] || '';
        if (
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
      // Prefer direct URL collection from the page (handles lazy-loaded/currentSrc)
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
      // Fallback: parse HTML if that's what we received
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

  const UrlBar = () => {
    return (
      <View style={styles.urlBarContainer}>
        <TextInput
          ref={addressInputRef}
          style={styles.urlInput}
          value={addressText}
          onChangeText={setAddressText}
          onSubmitEditing={submit}
          placeholder="Enter website URL"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          selectTextOnFocus
          onFocus={() => {
            setIsAddressFocused(true);
            try {
              addressInputRef.current?.setNativeProps({ selection: { start: 0, end: addressText.length } });
            } catch (e) {}
          }}
          onPressIn={() => {
            try {
              addressInputRef.current?.focus();
              addressInputRef.current?.setNativeProps({ selection: { start: 0, end: addressText.length } });
            } catch (e) {}
          }}
        />
        <TouchableOpacity
          onPress={goBack}
          disabled={!canGoBack}
          style={[styles.libraryBtn, !canGoBack && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name="chevron-back" size={22} color={canGoBack ? '#007AFF' : '#999'} />
        </TouchableOpacity>
        {/* <TouchableOpacity
          onPress={goForward}
          disabled={!canGoForward}
          style={[styles.libraryBtn, !canGoForward && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityLabel="Go forward"
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name="chevron-forward" size={22} color={canGoForward ? '#007AFF' : '#999'} />
        </TouchableOpacity> */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Library')}
          style={styles.libraryBtn}
          accessibilityRole="button"
          accessibilityLabel="Open Library"
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name="albums-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={promptSetHomepage}
          style={styles.libraryBtn}
          accessibilityRole="button"
          accessibilityLabel="Set as homepage"
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name="home-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <UrlBar />
      {isAddressFocused && filteredDomains.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
            {filteredDomains.map((d) => (
              <TouchableOpacity key={d} style={styles.suggestionItem} onPress={() => selectSuggestion(d)}>
                <Ionicons name="globe-outline" size={16} color="#4b5563" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webView}
        injectedJavaScriptBeforeContentLoaded={baseInjection}
        injectedJavaScript={baseInjection}
        onNavigationStateChange={(navState) => {
          try {
            setCanGoBack(!!navState.canGoBack);
            if (typeof navState.url === 'string') {
              setAddressText(navState.url);
              const d = getDomainFromUrlString(navState.url);
              if (d) saveDomain(d);
            }
          } catch (e) {}
        }}
        onLoad={() => {
          // Reinforce injection after load for pages that replace document contents
          try { webViewRef.current?.injectJavaScript(baseInjection); } catch (e) { }
        }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
      />
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
  );
}

const styles = StyleSheet.create({
  urlBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  libraryBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  webView: {
    flex: 1,
  },
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
  suggestionsContainer: {
    marginTop: -8,
    marginHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    fontSize: 14,
    color: '#111827',
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

export default SurfScreen;


