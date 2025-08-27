import { Injectable, BadRequestException } from '@nestjs/common';
import { YoutubeTranscript } from 'youtube-transcript';
import { Innertube } from 'youtubei.js';
import { LibraryService } from '../library/library.service';
import { VideoCacheService } from '../cache/video-cache.service';

@Injectable()
export class YouTubeService {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly videoCacheService: VideoCacheService,
  ) {}

  async getTranscript(
    video?: string,
    lang?: string,
  ): Promise<{ text: string; duration: number; offset: number; lang?: string }[]> {
    const videoId = video ?? 'UijM1gt0-hM';

    try {
      const yt = await Innertube.create({ lang: lang ?? 'en' });
      const info = await yt.getInfo(videoId);
      const ytTranscript: any = await info.getTranscript();
      const normalized = this.normalizeYoutubeiTranscript(ytTranscript);
      if (normalized.length > 0) return normalized;
    } catch {
      // fallthrough to next methods
    }

    try {
      const primary = await YoutubeTranscript.fetchTranscript(videoId, lang ? { lang } : undefined);
      if (primary && primary.length > 0) return primary as any;
    } catch {
      // fallthrough to XML
    }

    return this.forceXmlTranscript(videoId, lang);
  }

  async getVideoStartupPage(params: {
    symbol?: string;
    language?: string;
  }): Promise<{
    results: { url: string; thumbnail: string | null; title: string; description?: string; length?: string }[];
    query: string;
  }> {
    const { symbol, language } = params;
    if ((!symbol || !symbol.trim()) && (!language || !language.trim())) {
      throw new BadRequestException('Missing required query param: symbol (preferred) or language');
    }

    let languageName = (language ?? '').trim();
    if (!languageName && symbol) {
      const resolved = this.libraryService.getLanguageNameBySymbol(symbol);
      if (!resolved) {
        throw new BadRequestException(`Unknown language symbol: ${symbol}`);
      }
      languageName = resolved;
    }

    const query = `${languageName} a1 b1 all levels`;

    // Try cache first
    const cached = await this.videoCacheService.getCachedStartupVideos(languageName);
    if (cached) {
      return { results: cached.results, query: cached.query };
    }

    // Build fresh and persist
    const yt = await Innertube.create({ lang: 'en' });
    const search: any = await yt.search(query, { type: 'video' as any, sort_by: 'upload_date' as any });
    const items: any[] = this.extractSearchItems(search);
    const results = items
      .map((item) => this.normalizeVideoSearchItem(item))
      .filter((r) => !!r) as {
      url: string;
      thumbnail: string | null;
      title: string;
      description?: string;
      length?: string;
    }[];

    await this.videoCacheService.setCachedStartupVideos(languageName, query, results);
    return { results, query };
  }

  async searchVideos(params: {
    query?: string;
  }): Promise<{ url: string; thumbnail: string | null; title: string; description?: string; length?: string }[]> {
    const query = (params.query ?? '').trim();
    if (!query) {
      throw new BadRequestException('Missing required body param: query');
    }

    const yt = await Innertube.create({ lang: 'en' });
    const search: any = await yt.search(query, { type: 'video' as any });

    const items: any[] = this.extractSearchItems(search);
    const results = items
      .map((item) => this.normalizeVideoSearchItem(item))
      .filter((r) => !!r) as {
      url: string;
      thumbnail: string | null;
      title: string;
      description?: string;
      length?: string;
    }[];

    return results;
  }

  async getLengthString(video?: string): Promise<string | undefined> {
    try {
      const videoId = this.retrieveVideoId(video ?? '');
      if (!videoId) return undefined;
      const USER_AGENT =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';
      const watchResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'en',
        },
      });
      if (!watchResponse.ok) return undefined;
      const body = await watchResponse.text();
      let m = body.match(/"lengthSeconds":"(\d+)"/);
      if (m && m[1]) {
        const secs = Math.max(0, parseInt(m[1], 10) || 0);
        return this.formatSecondsToHms(secs);
      }
      m = body.match(/"approxDurationMs":"(\d+)"/);
      if (m && m[1]) {
        const ms = Math.max(0, parseInt(m[1], 10) || 0);
        const secs = Math.floor(ms / 1000);
        return this.formatSecondsToHms(secs);
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private normalizeYoutubeiTranscript(
    ytTranscript: any,
  ): { text: string; duration: number; offset: number; lang?: string }[] {
    if (!ytTranscript) return [];

    const segments: any[] =
      ytTranscript?.transcript?.content?.body?.initial_segments ??
      ytTranscript?.content?.body?.initial_segments ??
      ytTranscript?.initial_segments ??
      ytTranscript?.segments ??
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
      .map((seg, idx) => {
        const startMs: number = Number(seg.start_ms ?? seg.startMs ?? seg.startTimeMs ?? 0);
        const endMs: number | undefined =
          seg.end_ms ?? seg.endMs ?? seg.endTimeMs ?? (segments[idx + 1]?.start_ms ?? segments[idx + 1]?.startMs);
        const durationSec = endMs ? Math.max(0, (Number(endMs) - startMs) / 1000) : 0;
        const snippet = seg.snippet ?? seg.content ?? seg;
        const text = extractText(snippet);
        return {
          text,
          duration: durationSec,
          offset: startMs / 1000,
        };
      })
      .filter((s) => s.text && s.text.trim().length > 0);
  }

  private async forceXmlTranscript(
    videoId: string,
    lang?: string,
  ): Promise<{ text: string; duration: number; offset: number; lang?: string }[]> {
    const USER_AGENT =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36,gzip(gfe)';

    const identifier = this.retrieveVideoId(videoId);
    const watchResponse = await fetch(`https://www.youtube.com/watch?v=${identifier}`, {
      headers: {
        'User-Agent': USER_AGENT,
        ...(lang ? { 'Accept-Language': lang } : {}),
      },
    });
    const body = await watchResponse.text();
    const parts = body.split('"captions":');
    if (parts.length <= 1) {
      return [];
    }
    let captions: any | undefined;
    try {
      const parsed = JSON.parse(parts[1].split(',"videoDetails')[0].replace('\n', ''));
      captions = parsed?.['playerCaptionsTracklistRenderer'];
    } catch {
      return [];
    }
    if (!captions || !('captionTracks' in captions) || !Array.isArray(captions.captionTracks)) {
      return [];
    }
    const tracks: any[] = captions.captionTracks;
    const track = (lang && tracks.find((t) => t.languageCode === lang)) || tracks[0];
    if (!track?.baseUrl) return [];

    const transcriptUrl = track.baseUrl.includes('fmt=') ? track.baseUrl : `${track.baseUrl}&fmt=srv1`;
    const transcriptResponse = await fetch(transcriptUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        ...(lang ? { 'Accept-Language': lang } : {}),
      },
    });
    if (!transcriptResponse.ok) return [];

    const transcriptBody = await transcriptResponse.text();
    const RE_XML_TRANSCRIPT = /<text start="([^"]*)" dur="([^"]*)">([\s\S]*?)<\/text>/g;
    const results = [...transcriptBody.matchAll(RE_XML_TRANSCRIPT)];
    return results.map((m) => ({
      text: m[3],
      duration: parseFloat(m[2]),
      offset: parseFloat(m[1]),
      lang: lang ?? tracks[0]?.languageCode,
    }));
  }

  private retrieveVideoId(videoId: string): string {
    const RE_YOUTUBE = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    if (videoId.length === 11) return videoId;
    const match = videoId.match(RE_YOUTUBE);
    if (match && match.length) return match[1];
    return videoId;
  }

  private extractSearchItems(search: any): any[] {
    if (!search) return [];
    if (Array.isArray(search.videos)) return search.videos;
    if (Array.isArray(search.results)) return search.results;
    if (Array.isArray(search.items)) return search.items;
    if (Array.isArray(search.contents)) return search.contents;
    const sections = search.sections || search.section_list || [];
    for (const section of sections) {
      const inSection = section?.contents || section?.items;
      if (Array.isArray(inSection)) return inSection;
    }
    return [];
  }

  private normalizeVideoSearchItem(item: any):
    | { url: string; thumbnail: string | null; title: string; description?: string; length?: string }
    | null {
    if (!item) return null;

    const videoId: string | undefined =
      item.id ||
      item.videoId ||
      item.video_id ||
      item?.endpoint?.payload?.videoId ||
      item?.endpoint?.payload?.video_id ||
      item?.on_tap?.innertube_command?.watch_endpoint?.video_id ||
      item?.on_tap?.innertube_command?.watch_endpoint?.videoId;

    if (!videoId || typeof videoId !== 'string') return null;

    const title = this.extractText(
      item.title ?? item.headline ?? item.primaryText ?? item.attributed_subtitle ?? item.accessibility_label,
    );
    if (!title) return null;

    const description = this.extractText(
      item.description ?? item.descriptionSnippet ?? item.snippet ?? item.secondaryText ?? item.subtitle,
    );

    const thumbsArr: any[] =
      item.thumbnail?.thumbnails ??
      item.thumbnails ??
      item.card?.thumbnail?.thumbnails ??
      item?.thumbnail_overlays ??
      [];
    const bestThumb = Array.isArray(thumbsArr) && thumbsArr.length > 0 ? thumbsArr[thumbsArr.length - 1] : null;
    const thumbUrl: string | null = bestThumb?.url || bestThumb?.source || null;

    const length = this.extractDurationString(item);

    return {
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: thumbUrl,
      title,
      ...(description ? { description } : {}),
      ...(length ? { length } : {}),
    };
  }

  private extractText(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
      const text = String(value);
      if (text && text !== '[object Object]') return text.trim();
    }
    const candidate =
      value.text ??
      value.simpleText ??
      (Array.isArray(value.runs) ? value.runs.map((r: any) => r.text).join('') : undefined) ??
      value?.snippet?.text ??
      (Array.isArray(value?.snippet?.runs) ? value.snippet.runs.map((r: any) => r.text).join('') : undefined);
    return typeof candidate === 'string' ? candidate.trim() : '';
  }

  private extractDurationString(item: any): string | undefined {
    // 1) Direct textual duration fields
    const directTextCandidates = [
      item?.duration?.text,
      item?.length_text?.simpleText,
      item?.lengthText?.simpleText,
      item?.duration_text?.simpleText,
    ];
    for (const candidate of directTextCandidates) {
      const text = this.extractText(candidate);
      if (text) return text;
    }

    // 2) Seconds-based duration fields
    const secondsCandidates = [
      item?.duration?.seconds,
      item?.duration_seconds,
      item?.durationSeconds,
      item?.length_seconds,
      item?.lengthSeconds,
    ].map((v: any) => (typeof v === 'string' ? parseInt(v, 10) : typeof v === 'number' ? v : undefined));
    for (const sec of secondsCandidates) {
      if (typeof sec === 'number' && !Number.isNaN(sec) && sec > 0) return this.formatSecondsToHms(sec);
    }

    // 3) Overlay-based duration (common in YouTube search items)
    const overlays: any[] =
      item?.thumbnail_overlays || item?.thumbnailOverlays || item?.thumbnail?.overlays || [];
    if (Array.isArray(overlays)) {
      for (const overlay of overlays) {
        const renderer =
          overlay?.thumbnailOverlayTimeStatusRenderer || overlay?.time_status_renderer || overlay;
        const text = this.extractText(renderer?.text);
        if (text) return text;
      }
    }

    // 4) As a last resort, sometimes accessibility labels contain length; try to extract a pattern like 0:00 or 00:00:00
    const accText = this.extractText(item?.accessibility_label);
    const match = accText.match(/\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b/);
    if (match) return match[0];

    return undefined;
  }

  private formatSecondsToHms(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const two = (n: number) => (n < 10 ? `0${n}` : String(n));
    if (hours > 0) return `${hours}:${two(minutes)}:${two(seconds)}`;
    return `${minutes}:${two(seconds)}`;
  }
}


