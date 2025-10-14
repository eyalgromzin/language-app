import React from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { ImageScrape } from '../../../components/Video';

type ImageScrapeComponentProps = {
  imageScrape: { url: string; word: string } | null;
  hiddenWebViewRef: React.RefObject<WebView | null>;
  onScrapeMessage: (event: WebViewMessageEvent) => void;
  onImageScrapeError: () => void;
};

const ImageScrapeComponent: React.FC<ImageScrapeComponentProps> = ({
  imageScrape,
  hiddenWebViewRef,
  onScrapeMessage,
  onImageScrapeError,
}) => {
  return (
    <ImageScrape
      imageScrape={imageScrape}
      hiddenWebViewRef={hiddenWebViewRef}
      onScrapeMessage={onScrapeMessage}
      onImageScrapeError={onImageScrapeError}
    />
  );
};

export default ImageScrapeComponent;

