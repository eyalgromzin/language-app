import React from 'react';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ActivityIndicator, Alert, Button, Image, Platform, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

function SurfScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const webViewRef = React.useRef<WebView>(null);
  const [addressText, setAddressText] = React.useState<string>('https://cnnespanol.cnn.com/');
  const [currentUrl, setCurrentUrl] = React.useState<string>('https://cnnespanol.cnn.com/');
  const [translationPanel, setTranslationPanel] = React.useState<
    | {
        word: string;
        translation: string;
        sentence?: string;
        images: string[];
        imagesLoading: boolean;
        translationLoading: boolean;
      }
    | null
  >(null);

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

  const normalizeUrl = (input: string): string => {
    if (!input) return 'about:blank';
    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(input);
    return hasScheme ? input : `https://${input}`;
  };

  const submit = () => {
    setCurrentUrl(normalizeUrl(addressText.trim()));
  };

  const baseInjection = `
    (function() {
      if (window.__wordClickInstalled_v6) return;
      window.__wordClickInstalled_v6 = true;
      var lastTouch = { x: 0, y: 0 };
      var lastPostedWord = '';
      var lastPostedAt = 0;
      var LONG_PRESS_MS = 450;
      var pressTimer = null;
      var pressing = false;
      var pressAnchor = null;
      var suppressNextClick = false;

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
          // Otherwise, allow default behavior so links open normally
        } catch (err) {}
      }

      document.addEventListener('touchstart', onTouchStart, true);
      document.addEventListener('touchend', onTouchEnd, true);
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

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if ((data?.type === 'wordClick' || data?.type === 'longpress' || data?.type === 'selection') && typeof data.word === 'string' && data.word.length > 0) {
        openPanel(data.word, typeof data.sentence === 'string' ? data.sentence : undefined);
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

  const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
    English: 'en',
    Spanish: 'es',
    French: 'fr',
    German: 'de',
    Italian: 'it',
    Portuguese: 'pt',
    Russian: 'ru',
    'Chinese (Mandarin)': 'zh-CN',
    Japanese: 'ja',
    Korean: 'ko',
    Arabic: 'ar',
    Hindi: 'hi',
    Turkish: 'tr',
    Polish: 'pl',
    Dutch: 'nl',
    Greek: 'el',
    Swedish: 'sv',
    Norwegian: 'no',
    Finnish: 'fi',
    Czech: 'cs',
    Ukrainian: 'uk',
    Hebrew: 'he',
    Thai: 'th',
    Vietnamese: 'vi',
  };

  const getLangCode = (nameOrNull: string | null | undefined): string | null => {
    if (!nameOrNull) return null;
    const code = LANGUAGE_NAME_TO_CODE[nameOrNull];
    return typeof code === 'string' ? code : null;
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

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.urlBarContainer}>
        <TextInput
          style={styles.urlInput}
          value={addressText}
          onChangeText={setAddressText}
          onSubmitEditing={submit}
          placeholder="Enter website URL"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
        />
        <Button title="OK" onPress={submit} />
        <TouchableOpacity
          onPress={() => navigation.navigate('Library')}
          style={styles.libraryBtn}
          accessibilityRole="button"
          accessibilityLabel="Open Library"
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name="albums-outline" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webView}
        injectedJavaScriptBeforeContentLoaded={baseInjection}
        injectedJavaScript={baseInjection}
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
      {translationPanel && (
        <View style={styles.bottomPanel}>
          <View style={styles.bottomHeader}>
            <Text style={styles.bottomWord} numberOfLines={1}>
              {translationPanel.word}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={saveCurrentWord}
                style={styles.addBtnWrap}
                hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                accessibilityRole="button"
                accessibilityLabel="Add word"
              >
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTranslationPanel(null)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          {translationPanel.translationLoading ? (
            <View style={styles.translationLoadingRow}>
              <ActivityIndicator size="small" color="#555" />
            </View>
          ) : (
            <Text style={styles.translationText} numberOfLines={3}>
              {translationPanel.translation}
            </Text>
          )}
          {!!translationPanel.sentence && (
            <Text style={styles.sentenceText} numberOfLines={3}>
              {translationPanel.sentence}
            </Text>
          )}
          {translationPanel.imagesLoading ? (
            <View style={[styles.imageRow, styles.imageRowLoader]}>
              <ActivityIndicator size="small" color="#555" />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
              {(translationPanel.images || []).map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.imageItem} resizeMode="cover" />
              ))}
            </ScrollView>
          )}
        </View>
      )}
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


