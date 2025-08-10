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
      if (window.__wordClickInstalled_v4) return; 
      window.__wordClickInstalled_v4 = true;
      var lastTouch = { x: 0, y: 0 };
      var lastPostedWord = '';
      var lastPostedAt = 0;
      var selTimer = null;
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
      function send(word) {
        postWord(word, 'wordClick');
      }
      function handleClick(e) {
        try {
          var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
          if (a) { e.preventDefault(); e.stopPropagation(); }
          var x = e.clientX || lastTouch.x; var y = e.clientY || lastTouch.y;
          var word = selectWordAtPoint(x, y);
          if (!word) {
            var selTxt = window.getSelection ? (window.getSelection().toString().trim()) : '';
            if (selTxt && selTxt.split(/\s+/).length === 1) word = selTxt;
          }
          if (word) { e.preventDefault(); e.stopPropagation(); send(word); }
        } catch (err) {}
      }
      function handleTouchStart(e) {
        try { if (e.touches && e.touches[0]) { lastTouch.x = e.touches[0].clientX; lastTouch.y = e.touches[0].clientY; } } catch (e) {}
      }
      function handleTouchEnd() {
        try {
          var selTxt = window.getSelection ? (window.getSelection().toString().trim()) : '';
          if (selTxt && selTxt.split(/\s+/).length === 1) { postWord(selTxt, 'selection'); return; }
          var word = selectWordAtPoint(lastTouch.x, lastTouch.y);
          if (word) send(word);
        } catch (e) {}
      }
      function checkSelection() {
        try {
          var selTxt = window.getSelection ? (window.getSelection().toString().trim()) : '';
          if (selTxt && selTxt.split(/\s+/).length === 1) {
            postWord(selTxt, 'selection');
          }
        } catch (e) {}
      }
      document.addEventListener('touchstart', handleTouchStart, true);
      document.addEventListener('touchend', handleTouchEnd, true);
      document.addEventListener('mouseup', handleTouchEnd, true);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('selectionchange', function() {
        try { if (selTimer) clearTimeout(selTimer); selTimer = setTimeout(checkSelection, 120); } catch (e) {}
      }, true);
    })();
    true;
  `;

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'wordClick' && typeof data.word === 'string' && data.word.length > 0) {
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


