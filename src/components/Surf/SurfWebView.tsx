import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import TranslationPanel, { type TranslationPanelState } from '../TranslationPanel';

interface SurfWebViewProps {
  currentUrl: string;
  webViewRef: React.RefObject<WebView | null>;
  onNavigationStateChange: (navState: any) => void;
  onMessage: (event: WebViewMessageEvent) => void;
  onLoad: () => void;
  translationPanel: TranslationPanelState | null;
  onSaveWord: () => void;
  onCloseTranslationPanel: () => void;
  onRetranslate: (word: string) => void;
  baseInjection: string;
}

const SurfWebView: React.FC<SurfWebViewProps> = ({
  currentUrl,
  webViewRef,
  onNavigationStateChange,
  onMessage,
  onLoad,
  translationPanel,
  onSaveWord,
  onCloseTranslationPanel,
  onRetranslate,
  baseInjection,
}) => {
  return (
    <>
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webView}
        injectedJavaScriptBeforeContentLoaded={baseInjection}
        injectedJavaScript={baseInjection}
        onNavigationStateChange={onNavigationStateChange}
        onLoad={onLoad}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
      />
              <TranslationPanel
          panel={translationPanel}
          onSave={onSaveWord}
          onClose={onCloseTranslationPanel}
          onRetranslate={onRetranslate}
        />
    </>
  );
};

const styles = StyleSheet.create({
  webView: {
    flex: 1,
  },
});

export default SurfWebView;
