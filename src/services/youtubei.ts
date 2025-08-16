import type { Innertube as InnertubeType } from 'youtubei.js';

// Cache clients per language to allow localized behavior when desired.
const clientsByLanguage: Record<string, InnertubeType> = {};

async function getClient(lang?: string): Promise<InnertubeType> {
  const key = (lang || 'default').toLowerCase();
  if (clientsByLanguage[key]) return clientsByLanguage[key];
  const { Innertube } = await import('youtubei.js');
  clientsByLanguage[key] = await Innertube.create({
    lang: lang || 'en',
    fetch: (globalThis as any).fetch?.bind(globalThis),
  } as any);
  return clientsByLanguage[key];
}

export type TranscriptSegment = {
  text: string;
  duration: number; // seconds
  offset: number; // seconds since start
};

/**
 * Normalizes the variable shapes returned by youtubei.js for transcripts.
 */
function normalizeYoutubeiTranscript(ytTranscript: any): TranscriptSegment[] {
  if (!ytTranscript) return [];

  const segments: any[] =
    ytTranscript?.transcript?.content?.body?.initial_segments ||
    ytTranscript?.content?.body?.initial_segments ||
    ytTranscript?.initial_segments ||
    ytTranscript?.segments ||
    [];

  if (!Array.isArray(segments) || segments.length === 0) return [];

  const extractText = (snippet: any): string => {
    if (!snippet) return '';
    if (typeof snippet.text === 'string') return snippet.text;
    const runs = snippet.runs || snippet.snippet?.runs;
    if (Array.isArray(runs)) return runs.map((r) => r.text).join('');
    return String(snippet.snippet?.text ?? snippet.text ?? '').trim();
  };

  return segments
    .map((seg: any, index: number) => {
      const startMs: number = Number(seg.start_ms ?? seg.startMs ?? seg.startTimeMs ?? 0);
      const endMs: number | undefined =
        seg.end_ms ?? seg.endMs ?? seg.endTimeMs ?? (segments[index + 1]?.start_ms ?? segments[index + 1]?.startMs);
      const durationSec = endMs ? Math.max(0, (Number(endMs) - startMs) / 1000) : Number(seg.duration_ms ?? seg.durationMs ?? 0) / 1000;
      const snippet = seg.snippet ?? seg.content ?? seg;
      const text = extractText(snippet);
      return {
        text,
        duration: Math.max(0, durationSec),
        offset: Math.max(0, startMs / 1000),
      };
    })
    .filter((s: TranscriptSegment) => s.text && s.text.trim().length > 0);
}

/** Attempts to coerce a mixed input (URL or ID) into a video ID */
function retrieveVideoId(videoIdOrUrl: string): string {
  const RE_YOUTUBE = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  if (!videoIdOrUrl) return '';
  const trimmed = videoIdOrUrl.trim();
  if (trimmed.length === 11) return trimmed;
  const match = trimmed.match(RE_YOUTUBE);
  if (match && match[1]) return match[1];
  return trimmed;
}

async function forceXmlTranscript(
  videoId: string,
  lang?: string
): Promise<TranscriptSegment[]> {
  const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';

  const identifier = retrieveVideoId(videoId);
  const watchResponse = await fetch(`https://www.youtube.com/watch?v=${identifier}`, {
    headers: {
      'User-Agent': USER_AGENT,
      ...(lang ? { 'Accept-Language': lang } : {}),
    },
  } as any);
  const body = await watchResponse.text();
  const parts = body.split('"captions":');
  if (parts.length <= 1) return [];
  let captions: any | undefined;
  try {
    const parsed = JSON.parse(parts[1].split(',"videoDetails')[0].replace('\n', ''));
    captions = parsed?.['playerCaptionsTracklistRenderer'];
  } catch {
    return [];
  }
  if (!captions || !('captionTracks' in captions) || !Array.isArray(captions.captionTracks)) return [];
  const tracks: any[] = captions.captionTracks;
  const track = (lang && tracks.find((t) => t.languageCode === lang)) || tracks[0];
  if (!track?.baseUrl) return [];

  const transcriptUrl = track.baseUrl.includes('fmt=') ? track.baseUrl : `${track.baseUrl}&fmt=srv1`;
  const transcriptResponse = await fetch(transcriptUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      ...(lang ? { 'Accept-Language': lang } : {}),
    },
  } as any);
  if (!transcriptResponse.ok) return [];

  const transcriptBody = await transcriptResponse.text();
  const RE_XML_TRANSCRIPT = /<text start="([^"]*)" dur="([^"]*)">([\s\S]*?)<\/text>/g;
  const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];
  return results.map((m) => ({
    text: m[3],
    duration: parseFloat(m[2]),
    offset: parseFloat(m[1]),
  }));
}

export async function getVideoTranscript(
  videoIdOrUrl: string,
  languageCode?: string
): Promise<TranscriptSegment[]> {
  const id = retrieveVideoId(videoIdOrUrl);

  // 1) Try with youtubei.js (Innertube)
  try {
    const client = await getClient(languageCode);
    const info: any = await client.getInfo(id as any);
    const ytTranscript: any = languageCode
      ? await (info as any).getTranscript({ language: languageCode })
      : await (info as any).getTranscript();
    const normalized = normalizeYoutubeiTranscript(ytTranscript);
    if (normalized.length > 0) return normalized;
  } catch {
    // ignore and try fallbacks
  }

  // 2) Fallback to youtube-transcript package
  try {
    // dynamic import to avoid adding weight to initial bundle
    const { YoutubeTranscript } = await import('youtube-transcript');
    const segments: any[] = await (YoutubeTranscript as any).fetchTranscript(id, languageCode ? { lang: languageCode } : undefined);
    if (segments && segments.length > 0) {
      return segments.map((s: any) => ({
        text: s.text,
        duration: Number(s.duration ?? 0),
        offset: Number(s.offset ?? 0),
      }));
    }
  } catch {
    // ignore and try force XML
  }

  // 3) Fallback: force XML format and parse manually
  const fallback = await forceXmlTranscript(id, languageCode);
  return fallback;
}


