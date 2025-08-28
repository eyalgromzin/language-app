import React from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { imageScrapeInjection } from '../../screens/Video/videoMethods';

type ImageScrapeProps = {
  imageScrape: { url: string; word: string } | null;
  hiddenWebViewRef: React.RefObject<WebView | null>;
  onScrapeMessage: (event: WebViewMessageEvent) => void;
  onImageScrapeError: () => void;
};

const ImageScrape: React.FC<ImageScrapeProps> = ({
  imageScrape,
  hiddenWebViewRef,
  onScrapeMessage,
  onImageScrapeError,
}) => {
  if (!imageScrape) {
    return null;
  }

  return (
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
          try { 
            hiddenWebViewRef.current?.injectJavaScript(imageScrapeInjection); 
          } catch (e) {} 
        }}
        onError={onImageScrapeError}
      />
    </View>
  );
};

export default ImageScrape;
