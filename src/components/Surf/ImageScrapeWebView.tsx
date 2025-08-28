import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

interface ImageScrapeWebViewProps {
  imageScrape: { url: string; word: string } | null;
  hiddenWebViewRef: React.RefObject<WebView | null>;
  onScrapeMessage: (event: WebViewMessageEvent) => void;
  imageScrapeInjection: string;
}

const ImageScrapeWebView: React.FC<ImageScrapeWebViewProps> = ({
  imageScrape,
  hiddenWebViewRef,
  onScrapeMessage,
  imageScrapeInjection,
}) => {
  if (!imageScrape) return null;

  return (
    <View style={styles.hiddenContainer}>
      <WebView
        ref={hiddenWebViewRef}
        source={{ uri: imageScrape.url }}
        style={styles.hiddenWebView}
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
          // Error handling is done in the parent component
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    left: -10000,
    top: 0,
    width: 360,
    height: 1200,
    opacity: 0,
  },
  hiddenWebView: {
    width: '100%',
    height: '100%',
  },
});

export default ImageScrapeWebView;
