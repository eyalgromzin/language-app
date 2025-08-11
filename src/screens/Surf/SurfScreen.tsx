import React from 'react';
import { Alert, Button, Platform, StyleSheet, TextInput, ToastAndroid, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

function SurfScreen(): React.JSX.Element {
  const webViewRef = React.useRef<WebView>(null);
  const [addressText, setAddressText] = React.useState<string>('https://example.com');
  const [currentUrl, setCurrentUrl] = React.useState<string>('https://example.com');

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
          // Otherwise, allow default behavior so links open normally
        } catch (err) {}
      }

      document.addEventListener('touchstart', onTouchStart, true);
      document.addEventListener('touchend', onTouchEnd, true);
      document.addEventListener('click', onClick, true);
    })();
    true;
  `;

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if ((data?.type === 'wordClick' || data?.type === 'longpress' || data?.type === 'selection') && typeof data.word === 'string' && data.word.length > 0) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(data.word, ToastAndroid.SHORT);
        } else {
          Alert.alert(data.word);
        }
      }
    } catch {
      // ignore malformed messages
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
});

export default SurfScreen;


