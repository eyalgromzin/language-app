import React from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { parseYandexImageUrlsFromHtml, fetchImageUrls as fetchImageUrlsCommon, type ImageScrapeCallbacks } from '../../practice/common';

export const useImageScraper = () => {
  const [imageScrape, setImageScrape] = React.useState<null | { url: string; word: string }>(null);
  const imageScrapeResolveRef = React.useRef<((urls: string[]) => void) | null>(null);
  const imageScrapeRejectRef = React.useRef<((err?: unknown) => void) | null>(null);
  const hiddenWebViewRef = React.useRef<WebView | null>(null);

  const fetchImageUrls = React.useCallback(async (word: string): Promise<string[]> => {
    if (imageScrape) {
      return [];
    }
    
    const callbacks: ImageScrapeCallbacks = {
      onImageScrapeStart: (url: string, word: string) => {
        setImageScrape({ url, word });
      },
      onImageScrapeComplete: (urls: string[]) => {
        imageScrapeResolveRef.current?.(urls);
        imageScrapeResolveRef.current = null;
        imageScrapeRejectRef.current = null;
        setImageScrape(null);
      },
      onImageScrapeError: () => {
        imageScrapeResolveRef.current?.([]);
        imageScrapeResolveRef.current = null;
        imageScrapeRejectRef.current = null;
        setImageScrape(null);
      }
    };

    return new Promise<string[]>((resolve, reject) => {
      imageScrapeResolveRef.current = resolve;
      imageScrapeRejectRef.current = reject;
      
      fetchImageUrlsCommon(word, callbacks);
    }).catch(() => [] as string[]);
  }, [imageScrape]);

  const onScrapeMessage = React.useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
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
  }, []);

  const onImageScrapeError = React.useCallback(() => {
    imageScrapeResolveRef.current?.([]);
    imageScrapeResolveRef.current = null;
    imageScrapeRejectRef.current = null;
    setImageScrape(null);
  }, []);

  return {
    imageScrape,
    hiddenWebViewRef,
    fetchImageUrls,
    onScrapeMessage,
    onImageScrapeError,
  };
};

