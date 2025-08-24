// Shared utilities for Video screen
import { LANGUAGE_NAME_TO_CODE } from '../../utils/translation';

export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const patterns = [
    /(?:v=|vi=)([a-zA-Z0-9_-]{11})/,
    /(?:\/v\/|\/vi\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

export function normalizeYouTubeUrl(input: string): string {
  const id = extractYouTubeVideoId(input);
  if (id) return `https://www.youtube.com/watch?v=${id}`;
  return (input || '').trim();
}

export function mapLanguageNameToYoutubeCode(name: string | null): string {
  if (!name) return 'en';
  return LANGUAGE_NAME_TO_CODE[name] || 'en';
}

export async function fetchYouTubeTitleById(id: string): Promise<string> {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`);
    if (!res.ok) return '';
    const data = await res.json();
    const t = typeof (data as any)?.title === 'string' ? (data as any).title : '';
    return t;
  } catch {
    return '';
  }
}

export async function fetchYouTubeLengthString(id: string): Promise<string | null> {
  const fmt = (seconds: number): string => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`);
    if (!res.ok) return null;
    const html = await res.text();
    let m = html.match(/\"lengthSeconds\":\"(\d+)\"/);
    if (m && m[1]) {
      const secs = Math.max(0, parseInt(m[1], 10) || 0);
      return fmt(secs);
    }
    m = html.match(/\"approxDurationMs\":\"(\d+)\"/);
    if (m && m[1]) {
      const ms = Math.max(0, parseInt(m[1], 10) || 0);
      const secs = Math.floor(ms / 1000);
      return fmt(secs);
    }
    return null;
  } catch {
    return null;
  }
}

export async function enrichWithLengths<T extends { url: string }>(items: T[], concurrency = 4): Promise<Array<T & { length?: string }>> {
  const out: Array<T & { length?: string }> = new Array(items.length);
  let nextIndex = 0;
  const worker = async () => {
    while (true) {
      const idx = nextIndex++;
      if (idx >= items.length) return;
      const item = items[idx];
      const id = extractYouTubeVideoId(item.url);
      if (!id) {
        out[idx] = { ...item } as any;
        continue;
      }
      const len = await fetchYouTubeLengthString(id);
      out[idx] = { ...item, length: len || undefined } as any;
    }
  };
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, () => worker());
  await Promise.all(workers);
  return out;
}

export type TranscriptSegment = { text: string; duration: number; offset: number };

export async function getVideoTranscript(video: string, lang: string): Promise<TranscriptSegment[]> {
  const response = await fetch('http://localhost:3000/transcript', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ video, lang }),
  });
  if (!response.ok) {
    throw new Error(`Transcript request failed: ${response.status}`);
  }
  const data = await response.json();
  return data as TranscriptSegment[];
}

export const imageScrapeInjection = `
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

export function tokenizeTranscriptLine(text: string): Array<{ value: string; isWord: boolean }> {
  const re = /[\p{L}\p{N}'’-]+|\s+|[^\s\p{L}\p{N}]/gu;
  const out: Array<{ value: string; isWord: boolean }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const tok = m[0];
    const isWord = /[\p{L}\p{N}'’-]+/u.test(tok);
    out.push({ value: tok, isWord });
  }
  if (out.length === 0) out.push({ value: text, isWord: true });
  return out;
}

export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}


