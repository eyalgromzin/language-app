import { useState, useRef, useCallback } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { parseYandexImageUrlsFromHtml, fetchImageUrls as fetchImageUrlsCommon, type ImageScrapeCallbacks } from '../../practice/common';

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

export function useImageScraping() {
  const [imageScrape, setImageScrape] = useState<null | { url: string; word: string }>(null);
  const imageScrapeResolveRef = useRef<((urls: string[]) => void) | null>(null);
  const imageScrapeRejectRef = useRef<((err?: unknown) => void) | null>(null);
  const hiddenWebViewRef = useRef<WebView>(null);

  const fetchImageUrls = useCallback(async (word: string): Promise<string[]> => {
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
      },
    };

    return new Promise<string[]>((resolve, reject) => {
      imageScrapeResolveRef.current = resolve;
      imageScrapeRejectRef.current = reject;

      fetchImageUrlsCommon(word, callbacks);
    }).catch(() => [] as string[]);
  }, [imageScrape]);

  const onScrapeMessage = useCallback((event: WebViewMessageEvent) => {
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

  return {
    imageScrape,
    imageScrapeInjection,
    hiddenWebViewRef,
    fetchImageUrls,
    onScrapeMessage,
  };
}
