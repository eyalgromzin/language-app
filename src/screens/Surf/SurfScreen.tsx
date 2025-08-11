import React from 'react';
import { ActivityIndicator, Alert, Button, Image, Platform, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

function SurfScreen(): React.JSX.Element {
  const webViewRef = React.useRef<WebView>(null);
  const [addressText, setAddressText] = React.useState<string>('https://cnnespanol.cnn.com/');
  const [currentUrl, setCurrentUrl] = React.useState<string>('https://cnnespanol.cnn.com/');
  const [translationPanel, setTranslationPanel] = React.useState<
    | {
        word: string;
        translation: string;
        images: string[];
        imagesLoading: boolean;
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
      if (window.__wordClickInstalled_v5) return;
      window.__wordClickInstalled_v5 = true;
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
        return word;
      }
      function postWord(word, source) {
        try {
          if (!word) return;
          var now = Date.now();
          if (word === lastPostedWord && (now - lastPostedAt) < 250) return;
          lastPostedWord = word; lastPostedAt = now;
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: source, word: word }));
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
              var word = selectWordAtPoint(lastTouch.x, lastTouch.y);
              if (!word) {
                var selTxt = window.getSelection ? (window.getSelection().toString().trim()) : '';
                if (selTxt && selTxt.split(/\s+/).length === 1) word = selTxt;
              }
              if (word) {
                suppressNextClick = true; // prevent navigation after long-press
                postWord(word, 'longpress');
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
            var word = selectWordAtPoint(e.clientX || lastTouch.x, e.clientY || lastTouch.y);
            if (!word) {
              var selTxt = window.getSelection ? (window.getSelection().toString().trim()) : '';
              if (selTxt && selTxt.split(/\\s+/).length === 1) word = selTxt;
            }
            if (word) {
              e.preventDefault();
              e.stopPropagation();
              postWord(word, 'wordClick');
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
        openPanel(data.word);
      }
    } catch {
      // ignore malformed messages
    }
  };

  const openPanel = (word: string) => {
    // Show translation immediately (fallback to the word), start fetching enhanced translation and images in parallel
    setTranslationPanel({ word, translation: word, images: [], imagesLoading: true });
    fetchTranslation(word)
      .then((t) => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, translation: t || prev.translation } : prev));
      })
      .catch(() => {});
    fetchImageUrls(word)
      .then((imgs) => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, images: imgs, imagesLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, images: [], imagesLoading: false } : prev));
      });
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
            <TouchableOpacity onPress={() => setTranslationPanel(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.translationText} numberOfLines={3}>
            {translationPanel.translation}
          </Text>
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
  closeBtn: {
    fontSize: 18,
    opacity: 0.7,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  translationText: {
    fontSize: 14,
    color: '#333',
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
  imageItem: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#eee',
  },
});

export default SurfScreen;


