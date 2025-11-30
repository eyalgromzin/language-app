import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

type ImageScrapeWebViewProps = {
  url: string;
  injectedJavaScript: string;
  onMessage: (event: WebViewMessageEvent) => void;
  webViewRef: React.RefObject<WebView | null>;
};

export default function ImageScrapeWebView({
  url,
  injectedJavaScript,
  onMessage,
  webViewRef,
}: ImageScrapeWebViewProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        style={styles.webView}
        injectedJavaScript={injectedJavaScript}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        onLoad={() => {
          try {
            webViewRef.current?.injectJavaScript(injectedJavaScript);
          } catch (e) {
            // Ignore errors
          }
        }}
        onError={() => {
          // Error handling is done via onMessage
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -10000,
    top: 0,
    width: 360,
    height: 1200,
    opacity: 0,
  },
  webView: {
    width: '100%',
    height: '100%',
  },
});
