import React from 'react';
import { ActivityIndicator, Alert, Button, Image, Platform, ScrollView, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

function SurfScreen(): React.JSX.Element {
  const webViewRef = React.useRef<WebView>(null);
  const [addressText, setAddressText] = React.useState<string>('https://example.com');
  const [currentUrl, setCurrentUrl] = React.useState<string>('https://example.com');
  const [panel, setPanel] = React.useState<
    | {
        word: string;
        translation: string;
        images: string[];
        imagesLoading: boolean;
      }
    | null
  >(null);

  // Hidden WebView state to scrape lazy-loaded image results
  const [imageScrape, setImageScrape] = React.useState<null | { url: string; word: string }>(null);
  const imageScrapeResolveRef = React.useRef<((urls: string[]) => void) | null>(null);
  const imageScrapeRejectRef = React.useRef<((err?: unknown) => void) | null>(null);

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
      var MAX_TIME = 9000;
      var INTERVAL_MS = 250;
      var SELECTOR = 'img.ImagesContentImage-Image.ImagesContentImage-Image_clickable';
      var start = Date.now();
      var pollTimer = null;
      var scrollTimer = null;

      function abs(u) {
        try {
          if (!u) return u;
          if (u.indexOf('//') === 0) return location.protocol + u;
          if (u.indexOf('/') === 0) return location.origin + u;
          return u;
        } catch (e) { return u; }
      }

      function extract(img) {
        var srcset = img.getAttribute('srcset');
        if (srcset) {
          var first = srcset.split(',')[0].trim().split(/\s+/)[0];
          if (first) return abs(first);
        }
        var ds = img.getAttribute('data-src');
        if (ds) return abs(ds);
        var s = img.getAttribute('src');
        if (s) return abs(s);
        return null;
      }

      function collect() {
        var nodes = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
        var urls = [];
        for (var i = 0; i < nodes.length; i++) {
          var u = extract(nodes[i]);
          if (u && urls.indexOf(u) === -1) urls.push(u);
          if (urls.length >= 6) break;
        }
        return urls;
      }

      function done(result) {
        try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'imageScrapeResult', urls: result })); } catch(e) {}
        if (pollTimer) clearInterval(pollTimer);
        if (scrollTimer) clearInterval(scrollTimer);
      }

      function step() {
        var urls = collect();
        if (urls.length >= 6) return done(urls);
        if (Date.now() - start > MAX_TIME) return done(urls);
      }

      pollTimer = setInterval(step, INTERVAL_MS);
      scrollTimer = setInterval(function(){ try { window.scrollBy(0, 800); } catch(e) {} }, 220);
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
    setPanel({ word, translation: word, images: [], imagesLoading: true });
    fetchTranslation(word)
      .then((t) => {
        setPanel(prev => (prev && prev.word === word ? { ...prev, translation: t || prev.translation } : prev));
      })
      .catch(() => {});
    fetchImageUrls(word)
      .then((imgs) => {
        setPanel(prev => (prev && prev.word === word ? { ...prev, images: imgs, imagesLoading: false } : prev));
      })
      .catch(() => {
        setPanel(prev => (prev && prev.word === word ? { ...prev, images: [], imagesLoading: false } : prev));
      });
  };

  const fetchTranslation = async (word: string): Promise<string> => {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (res.ok) {
        const json = await res.json();
        const meaning = Array.isArray(json) && json[0]?.meanings?.[0]?.definitions?.[0]?.definition;
        if (typeof meaning === 'string' && meaning.length > 0) return meaning;
      }
    } catch {}
    return word;
  };

  const fetchImageUrls = async (word: string): Promise<string[]> => {
    const searchUrl = `https://yandex.com/images/search?text=${encodeURIComponent(word)}`;

    // If a scrape is already in progress, just fallback to avoid contention
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
      if (data && data.type === 'imageScrapeResult') {
        const normalizeUrl = (u: string): string => {
          if (!u) return u;
          if (u.startsWith('//')) return 'https:' + u;
          if (u.startsWith('/')) return 'https://yandex.com' + u;
          return u;
        };
        const urls = Array.isArray(data.urls) ? data.urls.map((u: string) => normalizeUrl(u)).filter(Boolean) : [];
        const uniq: string[] = [];
        for (const u of urls) {
          if (u && !uniq.includes(u)) uniq.push(u);
          if (uniq.length >= 6) break;
        }
        imageScrapeResolveRef.current?.(uniq);
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
      {/* {imageScrape && (
        <View style={{ width: 0, height: 0, overflow: 'hidden' }}>
          <WebView
            source={{ uri: imageScrape.url }}
            style={{ width: 0, height: 0 }}
            injectedJavaScript={imageScrapeInjection}
            injectedJavaScriptBeforeContentLoaded={imageScrapeInjection}
            onMessage={onScrapeMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={["*"]}
            onError={() => {
              imageScrapeRejectRef.current?.();
              imageScrapeResolveRef.current = null;
              imageScrapeRejectRef.current = null;
              setImageScrape(null);
            }}
          />
        </View>
      )} */}
      {panel && (
        <View style={styles.bottomPanel}>
          <View style={styles.bottomHeader}>
            <Text style={styles.bottomWord} numberOfLines={1}>
              {panel.word}
            </Text>
            <TouchableOpacity onPress={() => setPanel(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.translationText} numberOfLines={3}>
            {panel.translation}
          </Text>
          {panel.imagesLoading ? (
            <View style={[styles.imageRow, styles.imageRowLoader]}>
              <ActivityIndicator size="small" color="#555" />
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
              {(panel.images || []).map((uri, idx) => (
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


