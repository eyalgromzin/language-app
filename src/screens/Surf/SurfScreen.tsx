import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View, NativeModules, Modal, ActionSheetIOS, Keyboard } from 'react-native';
import TranslationPanel, { type TranslationPanelState } from '../../components/TranslationPanel';
import { fetchTranslation as fetchTranslationCommon } from '../../utils/translation';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import { parseYandexImageUrlsFromHtml } from '../practice/common';

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
  type FavouriteItem = { url: string; name: string; typeId?: number; typeName?: string; levelName?: string };
  const [favourites, setFavourites] = React.useState<FavouriteItem[]>([]);
  const [showFavouritesList, setShowFavouritesList] = React.useState<boolean>(false);
  const [showAddFavouriteModal, setShowAddFavouriteModal] = React.useState<boolean>(false);
  const [newFavName, setNewFavName] = React.useState<string>('');
  const [newFavUrl, setNewFavUrl] = React.useState<string>('');
  const FAVOURITE_TYPES = [
    { id: 1, name: 'article' },
    { id: 2, name: 'story' },
    { id: 3, name: 'conversation' },
    { id: 4, name: 'lyrics' },
    { id: 5, name: 'any' },
  ] as const;
  const [newFavTypeId, setNewFavTypeId] = React.useState<number | null>(null);
  const [showTypeOptions, setShowTypeOptions] = React.useState<boolean>(false);
  const [favTypeError, setFavTypeError] = React.useState<boolean>(false);
  const [newFavLevelName, setNewFavLevelName] = React.useState<string | null>(null);
  const [showLevelOptions, setShowLevelOptions] = React.useState<boolean>(false);

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
  const FAVOURITES_KEY = 'surf.favourites';
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

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVOURITES_KEY);
        if (!mounted) return;
        const arr = JSON.parse(raw || '[]');
        if (Array.isArray(arr)) {
          // Support legacy string[] format and new {url,name,typeId?,typeName?,levelName?}[] format
          const mapped: FavouriteItem[] = arr
            .map((it: any) => {
              if (typeof it === 'string') {
                const u = normalizeUrl(it);
                const nm = getDomainFromUrlString(u) || u;
                return { url: u, name: nm } as FavouriteItem;
              }
              if (it && typeof it === 'object' && typeof it.url === 'string') {
                const u = normalizeUrl(it.url);
                const nm = typeof it.name === 'string' && it.name.trim().length > 0 ? it.name : (getDomainFromUrlString(u) || u);
                const tid = typeof it.typeId === 'number' ? it.typeId : undefined;
                const tn = typeof it.typeName === 'string' ? it.typeName : (typeof tid === 'number' ? (FAVOURITE_TYPES.find(t => t.id === tid)?.name) : undefined);
                const ln = typeof it.levelName === 'string' ? validateLevel(it.levelName) : (typeof it.level === 'string' ? validateLevel(it.level) : undefined);
                return { url: u, name: nm, typeId: tid, typeName: tn, levelName: ln } as FavouriteItem;
              }
              return null;
            })
            .filter((x): x is FavouriteItem => !!x);
          setFavourites(mapped);
        } else {
          setFavourites([]);
        }
      } catch {
        if (!mounted) return;
        setFavourites([]);
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

  // --- Validation helpers for posting to library ---
  const ITEM_TYPES = ['article','story','conversation','lyrics','any','video','music'] as const;
  const LEVELS = ['easy','easy-medium','medium','medium-hard','hard'] as const;
  const MEDIA = ['web','youtube'] as const;

  type ItemTypeName = typeof ITEM_TYPES[number];
  type LevelName = typeof LEVELS[number];
  type MediaName = typeof MEDIA[number];

  const toLanguageSymbol = (input: string | null): 'en' | 'es' => {
    const v = (input || '').toLowerCase().trim();
    if (v === 'es' || v === 'spanish') return 'es';
    if (v === 'en' || v === 'english') return 'en';
    // Map common UI labels from Settings/Startup
    if (v === 'español') return 'es';
    return 'en';
  };

  const validateType = (t?: string | null): ItemTypeName => {
    const v = (t || '').toLowerCase().trim();
    return (ITEM_TYPES as readonly string[]).includes(v) ? (v as ItemTypeName) : 'any';
  };

  const validateLevel = (l?: string | number | null): LevelName => {
    if (typeof l === 'number') {
      const byIndex = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, l - 1))];
      return byIndex || 'easy';
    }
    const v = (l || '').toLowerCase().trim();
    return (LEVELS as readonly string[]).includes(v) ? (v as LevelName) : 'easy';
  };

  const inferMediaFromUrl = (u: string): MediaName => {
    try {
      const h = new URL(u).hostname.toLowerCase();
      if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube';
    } catch {}
    return 'web';
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
    try { addressInputRef.current?.blur(); } catch (e) {}
    try { Keyboard.dismiss(); } catch (e) {}
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
    // Close keyboard and hide suggestions when navigating
    try { addressInputRef.current?.blur(); } catch (e) {}
    setIsAddressFocused(false);
    try { Keyboard.dismiss(); } catch (e) {}
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

  const apiBaseUrl = React.useMemo(() => {
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    if (scriptURL) {
      try {
        const { hostname } = new URL(scriptURL);
        return `http://${hostname}:3000`;
      } catch {}
    }
    return 'http://localhost:3000';
  }, []);

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

  const saveFavourites = async (next: FavouriteItem[]) => {
    setFavourites(next);
    try { await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(next)); } catch {}
  };

  const addToFavourites = async (url: string, name: string, typeId: number, typeName: string, levelName?: string | null) => {
    if (!url) return;
    const normalized = normalizeUrl(url);
    const safeName = (name || '').trim() || (getDomainFromUrlString(normalized) || normalized);
    const next: FavouriteItem[] = [
      { url: normalized, name: safeName, typeId, typeName, levelName: levelName ? validateLevel(levelName) : undefined },
      ...favourites.filter((f) => f.url !== normalized),
    ].slice(0, 200);
    await saveFavourites(next);
  };

  const removeFromFavourites = async (url: string) => {
    if (!url) return;
    const normalized = normalizeUrl(url);
    const next = favourites.filter((f) => f.url !== normalized);
    await saveFavourites(next);
  };

  const postAddUrlToLibrary = async (url: string, typeName?: string, displayName?: string, level?: string) => {
    try {
      const normalizedUrl = normalizeUrl(url);
      const lang = toLanguageSymbol(learningLanguage);
      const safeType = validateType(typeName);
      const safeLevel = validateLevel(level);
      const safeName = (displayName || '').trim() || (getDomainFromUrlString(normalizedUrl) || normalizedUrl);
      const media: MediaName = inferMediaFromUrl(normalizedUrl);
      const body = {
        url: normalizedUrl,
        language: lang,
        level: safeLevel,
        type: safeType,
        name: safeName,
        media,
      } as const;
      await fetch(`${apiBaseUrl}/library/addUrl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {}
  };

  const promptFavourite = (url: string, alreadyFav: boolean) => {
    const normalized = normalizeUrl(url);
    if (!normalized || normalized === 'about:blank') return;
    if (alreadyFav) {
      const onYes = async () => {
        await removeFromFavourites(normalized);
        if (Platform.OS === 'android') ToastAndroid.show('Removed from favourites', ToastAndroid.SHORT); else Alert.alert('Removed');
      };
      try {
        Alert.alert(
          'Favourites',
          'already in favourites, remove it ?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: onYes },
          ],
          { cancelable: true },
        );
      } catch {
        onYes();
      }
      return;
    }
    // Open add favourite modal for name + url
    setNewFavUrl(normalized);
    const defaultName = getDomainFromUrlString(normalized) || normalized;
    setNewFavName(defaultName);
    setNewFavTypeId(null);
    setFavTypeError(false);
    setShowTypeOptions(false);
    setNewFavLevelName('easy');
    setShowLevelOptions(false);
    setShowAddFavouriteModal(true);
  };

  const openOptionsMenu = () => {
    Keyboard.dismiss();
    const actions = [
      { title: 'Set homepage', onPress: () => promptSetHomepage() },
      { title: 'Favourites list', onPress: () => setShowFavouritesList(true) },
      { title: 'Cancel', onPress: () => {}, isCancel: true },
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: actions.map(a => a.title),
          cancelButtonIndex: actions.findIndex(a => a.isCancel),
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          const action = actions[buttonIndex];
          if (action && action.onPress) action.onPress();
        }
      );
      return;
    }
    try {
      Alert.alert(
        'Options',
        undefined,
        actions.map(a => ({ text: a.title, onPress: a.onPress, style: a.isCancel ? 'cancel' as const : undefined })),
        { cancelable: true },
      );
    } catch {
      // Fallback: just open favourites if alert fails
      setShowFavouritesList(true);
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
      const sentence = typeof data.sentence === 'string' ? extractClauseAroundWord(data.sentence, data.word) : undefined;
      if ((data?.type === 'wordClick' || data?.type === 'longpress' || data?.type === 'selection') && typeof data.word === 'string' && data.word.length > 0) {
        openPanel(data.word, sentence || undefined);
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

  const extractClauseAroundWord = (sentence: string | undefined, word: string): string | undefined => {
    if (!sentence) return undefined;
    const lowerSentence = sentence.toLowerCase();
    const lowerWord = word.toLowerCase();
    const index = lowerSentence.indexOf(lowerWord);

    if (index === -1) return undefined;

    // Find the start of the sub-sentence (previous . or , or start of string)
    let start = index;
    while (start > 0 && !['.', ','].includes(sentence[start - 1])) {
      start--;
    }

    // Find the end of the sub-sentence (next . or , or end of string)
    let end = index + lowerWord.length;
    while (end < sentence.length && !['.', ','].includes(sentence[end])) {
      end++;
    }

    // Extract substring and trim spaces
    return sentence.slice(start, end).trim();
  }


  // const extractClauseAroundWord = (fullSentence: string | undefined, targetWord: string): string | undefined => {
  //   if (!fullSentence || !targetWord) return fullSentence;
  //   const sentence = fullSentence;

  //   // Find an occurrence of the target word. If not found, keep original sentence
  //   const wordIndex = sentence.toLowerCase().indexOf(targetWord.toLowerCase());
  //   if (wordIndex === -1) return sentence.trim();

  //   const sentenceStart = sentence.slice(0, wordIndex);

  //   const startDot = sentenceStart.lastIndexOf('.', wordIndex);
  //   const startComma = sentenceStart.lastIndexOf(',', wordIndex);
  //   const startIdx = Math.max(startDot, startComma); // -1 if none found

  //   const searchFrom = wordIndex + targetWord.length;
  //   const endDot = sentence.indexOf('.', searchFrom);
  //   const endComma = sentence.indexOf(',', searchFrom);
  //   let endIdx: number;
  //   if (endDot === -1 && endComma === -1) {
  //     endIdx = sentence.length;
  //   } else if (endDot === -1) {
  //     endIdx = endComma + 1; // include comma
  //   } else if (endComma === -1) {
  //     endIdx = endDot + 1; // include period
  //   } else {
  //     endIdx = Math.min(endDot, endComma) + 1; // include nearest punctuation
  //   }

  //   const sliceStart = startIdx === -1 ? 0 : startIdx;
  //   const clause = sentence.slice(sliceStart, endIdx).trim();
  //   return clause.length > 0 ? clause : sentence.trim();
  // };

  const openPanel = (word: string, sentence?: string) => {
    // Start with empty translation and show a loader while fetching
    const clause = extractClauseAroundWord(sentence, word);
    setTranslationPanel({ word, translation: '', sentence: clause, images: [], imagesLoading: true, translationLoading: true });
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

 

  const urlForStar = normalizeUrl((currentUrl || addressText || '').trim());
  const isFav = favourites.some((f) => f.url === urlForStar);

  return (
    <View style={{ flex: 1 }}>
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
          onPress={() => promptFavourite(urlForStar, isFav)}
          style={styles.libraryBtn}
          accessibilityRole="button"
          accessibilityLabel={isFav ? 'Remove from favourites' : 'Add to favourites'}
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name={isFav ? 'star' : 'star-outline'} size={22} color={isFav ? '#f59e0b' : '#007AFF'} />
        </TouchableOpacity>
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
          onPress={openOptionsMenu}
          style={styles.libraryBtn}
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={showFavouritesList}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFavouritesList(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Favourites</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {favourites.length === 0 && (
                <Text style={styles.emptyText}>No favourites yet</Text>
              )}
              {favourites.map((f) => (
                <TouchableOpacity
                  key={f.url}
                  style={styles.favItem}
                  onPress={() => {
                    setShowFavouritesList(false);
                    setAddressText(f.url);
                    setCurrentUrl(f.url);
                  }}
                >
                  <Ionicons name="star" size={16} color="#f59e0b" style={{ marginRight: 8 }} />
                  <Text numberOfLines={1} style={styles.favText}>{f.name}</Text>
                  <TouchableOpacity
                    onPress={() => removeFromFavourites(f.url)}
                    style={styles.favRemoveBtn}
                    hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Ionicons name="close" size={18} color="#6b7280" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity onPress={() => setShowFavouritesList(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showAddFavouriteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddFavouriteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to favourites</Text>
            {learningLanguage && (
              <Text style={[styles.inputLabel, { marginTop: 0 }]}>Learning language: {toLanguageSymbol(learningLanguage)}</Text>
            )}
            <Text style={styles.inputLabel}>Type</Text>
            <TouchableOpacity
              onPress={() => setShowTypeOptions(prev => !prev)}
              style={[styles.modalInput, favTypeError && !newFavTypeId ? { borderColor: '#ef4444' } : null]}
              activeOpacity={0.7}
            >
              <Text style={{ color: newFavTypeId ? '#111827' : '#9ca3af' }}>
                {newFavTypeId ? (FAVOURITE_TYPES.find(t => t.id === newFavTypeId)?.name || '') : 'Select type'}
              </Text>
            </TouchableOpacity>
            {showTypeOptions && (
              <View style={[styles.modalInput, { paddingVertical: 0, marginTop: 8 }]}> 
                {FAVOURITE_TYPES.map((t, idx) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => { setNewFavTypeId(t.id); setShowTypeOptions(false); setFavTypeError(false); }}
                    style={{ paddingVertical: 10 }}
                  >
                    <Text style={{ color: '#111827' }}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {favTypeError && !newFavTypeId && (
              <Text style={styles.errorText}>Type is required</Text>
            )}
            <Text style={styles.inputLabel}>Level</Text>
            <TouchableOpacity
              onPress={() => setShowLevelOptions(prev => !prev)}
              style={styles.modalInput}
              activeOpacity={0.7}
            >
              <Text style={{ color: newFavLevelName ? '#111827' : '#9ca3af' }}>
                {newFavLevelName || 'Select level'}
              </Text>
            </TouchableOpacity>
            {showLevelOptions && (
              <View style={[styles.modalInput, { paddingVertical: 0, marginTop: 8 }]}> 
                {['easy','easy-medium','medium','medium-hard','hard'].map((lv) => (
                  <TouchableOpacity
                    key={lv}
                    onPress={() => { setNewFavLevelName(lv); setShowLevelOptions(false); }}
                    style={{ paddingVertical: 10 }}
                  >
                    <Text style={{ color: '#111827' }}>{lv}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newFavName}
              onChangeText={setNewFavName}
              placeholder="Enter a name"
            />
            <Text style={styles.inputLabel}>URL</Text>
            <TextInput
              style={styles.modalInput}
              value={newFavUrl}
              onChangeText={setNewFavUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
           
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
              <TouchableOpacity onPress={() => setShowAddFavouriteModal(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const u = normalizeUrl(newFavUrl || currentUrl || addressText);
                  const nm = (newFavName || '').trim();
                  if (!u || u === 'about:blank') {
                    if (Platform.OS === 'android') ToastAndroid.show('Invalid URL', ToastAndroid.SHORT); else Alert.alert('Invalid URL');
                    return;
                  }
                  const selected = FAVOURITE_TYPES.find(t => t.id === newFavTypeId);
                  if (!selected) { setFavTypeError(true); return; }
                  await addToFavourites(u, nm, selected.id, selected.name, newFavLevelName);
                  setShowAddFavouriteModal(false);
                  if (Platform.OS === 'android') ToastAndroid.show('Added to favourites', ToastAndroid.SHORT); else Alert.alert('Added');
                  postAddUrlToLibrary(u, selected.name, nm, newFavLevelName || undefined).catch(() => {});
                }}
                style={[styles.modalCloseBtn, { backgroundColor: '#007AFF' }]}
              >
                <Text style={[styles.modalCloseText, { color: 'white' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  emptyText: {
    color: '#6b7280',
    marginVertical: 8,
  },
  favItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  favText: {
    flex: 1,
    color: '#111827',
  },
  favRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default SurfScreen;


