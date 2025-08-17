import React from 'react';
import { useRoute } from '@react-navigation/native';
import { View, TextInput, StyleSheet, Text, Platform, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TranslationPanel, { type TranslationPanelState } from '../../components/TranslationPanel';
import { fetchTranslation as fetchTranslationCommon } from '../../utils/translation';
import * as RNFS from 'react-native-fs';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // If a raw 11-char ID is provided
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  // Common URL patterns
  const patterns = [
    /(?:v=|vi=)([a-zA-Z0-9_-]{11})/, // https://www.youtube.com/watch?v=VIDEOID
    /(?:\/v\/|\/vi\/)([a-zA-Z0-9_-]{11})/, // https://www.youtube.com/v/VIDEOID
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/, // https://youtu.be/VIDEOID
    /(?:embed\/)([a-zA-Z0-9_-]{11})/, // https://www.youtube.com/embed/VIDEOID
    /(?:shorts\/)([a-zA-Z0-9_-]{11})/, // https://www.youtube.com/shorts/VIDEOID
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

type SearchBarProps = {
  inputUrl: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onOpenPress: () => void;
  urlInputRef: React.RefObject<TextInput>;
};

const SearchBar: React.FC<SearchBarProps> = ({ inputUrl, onChangeText, onSubmit, onOpenPress, urlInputRef }) => {
  return (
    <View id="searchBar">
      <Text style={styles.label}>YouTube URL</Text>
      <View style={styles.inputRow}>
        <TextInput
          ref={urlInputRef}
          value={inputUrl}
          onChangeText={onChangeText}
          placeholder="Paste a YouTube URL (or video ID)"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={Platform.OS === 'ios' ? 'url' : 'default'}
          style={[styles.input, { flex: 1 }]}
          accessibilityLabel="YouTube URL input"
          onSubmitEditing={onSubmit}
          returnKeyType="go"
          blurOnSubmit={false}
          selectTextOnFocus
          onFocus={() => {
            try {
              urlInputRef.current?.setNativeProps({ selection: { start: 0, end: inputUrl.length } });
            } catch {}
          }}
          onPressIn={() => {
            try {
              urlInputRef.current?.focus();
              urlInputRef.current?.setNativeProps({ selection: { start: 0, end: inputUrl.length } });
            } catch {}
          }}
        />
        <TouchableOpacity
          style={styles.goButton}
          onPress={onOpenPress}
          accessibilityRole="button"
          accessibilityLabel="Open video"
        >
          <Text style={styles.goButtonText}>Open</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function VideoScreen(): React.JSX.Element {
  const route = useRoute<any>();
  const [inputUrl, setInputUrl] = React.useState<string>('');
  const [url, setUrl] = React.useState<string>('');
  const videoId = React.useMemo(() => extractYouTubeVideoId(url) ?? '', [url]);
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);
  const [transcript, setTranscript] = React.useState<Array<{ text: string; duration: number; offset: number }>>([]);
  const [loadingTranscript, setLoadingTranscript] = React.useState<boolean>(false);
  const [transcriptError, setTranscriptError] = React.useState<string | null>(null);
  const playerRef = React.useRef<any>(null);
  const [playerReady, setPlayerReady] = React.useState<boolean>(false);
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const scrollViewRef = React.useRef<any>(null);
  const lineOffsetsRef = React.useRef<Record<number, number>>({});
  const urlInputRef = React.useRef<TextInput>(null);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [translationPanel, setTranslationPanel] = React.useState<TranslationPanelState | null>(null);
  const [selectedWordKey, setSelectedWordKey] = React.useState<string | null>(null);
  const [startupVideos, setStartupVideos] = React.useState<Array<{ url: string; thumbnail: string; title: string; description: string }>>([]);
  const [startupVideosLoading, setStartupVideosLoading] = React.useState<boolean>(false);
  const [startupVideosError, setStartupVideosError] = React.useState<string | null>(null);
  const [currentVideoTitle, setCurrentVideoTitle] = React.useState<string>('');

  // Hidden WebView state to scrape lazy-loaded image results (same approach as Surf/Books)
  const [imageScrape, setImageScrape] = React.useState<null | { url: string; word: string }>(null);
  const imageScrapeResolveRef = React.useRef<((urls: string[]) => void) | null>(null);
  const imageScrapeRejectRef = React.useRef<((err?: unknown) => void) | null>(null);
  const hiddenWebViewRef = React.useRef<WebView>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);
        if (!mounted) return;
        const map = Object.fromEntries(entries);
        setLearningLanguage(map['language.learning'] ?? null);
        setNativeLanguage(map['language.native'] ?? null);
      } catch {
        if (!mounted) return;
        setLearningLanguage(null);
        setNativeLanguage(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const mapLanguageNameToYoutubeCode = React.useCallback((name: string | null): string => {
    const mapping: Record<string, string> = {
      English: 'en',
      Spanish: 'es',
      French: 'fr',
      German: 'de',
      Italian: 'it',
      Portuguese: 'pt',
      Russian: 'ru',
      'Chinese (Mandarin)': 'zh',
      Japanese: 'ja',
      Korean: 'ko',
      Arabic: 'ar',
      Hindi: 'hi',
      Turkish: 'tr',
      Polish: 'pl',
      Dutch: 'nl',
      Greek: 'el',
      Swedish: 'sv',
      Norwegian: 'no',
      Finnish: 'fi',
      Czech: 'cs',
      Ukrainian: 'uk',
      Hebrew: 'he',
      Thai: 'th',
      Vietnamese: 'vi',
    };
    if (!name) return 'en';
    return mapping[name] || 'en';
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const fetchStartupVideos = async (langSymbol: string) => {
      setStartupVideosLoading(true);
      setStartupVideosError(null);
      try {
        const response = await fetch('http://localhost:3000/getVideoStartupPage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbol: langSymbol }),
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        if (!cancelled) setStartupVideos(results);
      } catch (e) {
        if (!cancelled) {
          setStartupVideos([]);
          setStartupVideosError('Failed to load startup videos.');
        }
      } finally {
        if (!cancelled) setStartupVideosLoading(false);
      }
    };
    const symbol = mapLanguageNameToYoutubeCode(learningLanguage);
    fetchStartupVideos(symbol);
    return () => { cancelled = true; };
  }, [learningLanguage, mapLanguageNameToYoutubeCode]);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!videoId) {
        setTranscript([]);
        setTranscriptError(null);
        setLoadingTranscript(false);
        return;
      }
      // Intentionally do not auto-fetch here to avoid duplicate/conflicting requests.
      // Fetch is performed explicitly via sendGetTranscript when user presses Go.
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [videoId, learningLanguage, mapLanguageNameToYoutubeCode]);

  type TranscriptSegment = { text: string; duration: number; offset: number };
  
  const getVideoTranscript = async (video: string, lang: string): Promise<TranscriptSegment[]> => {
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
  };

  const fetchTranslation = async (word: string): Promise<string> => fetchTranslationCommon(word, learningLanguage, nativeLanguage);

  const fetchYouTubeTitleById = async (id: string): Promise<string> => {
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`);
      if (!res.ok) return '';
      const data = await res.json();
      const t = typeof (data as any)?.title === 'string' ? (data as any).title : '';
      return t;
    } catch {
      return '';
    }
  };

  const openStartupVideo = async (urlString: string, title?: string) => {
    const id = extractYouTubeVideoId(urlString);
    if (!id) {
      setTranscript([]);
      setTranscriptError('Unable to open this video. Invalid URL or ID.');
      setIsPlaying(false);
      return;
    }
    setCurrentVideoTitle(title || '');
    setInputUrl(urlString);
    setUrl(urlString);
    setTranscript([]);
    setTranscriptError(null);
    setLoadingTranscript(true);
    try {
      const langCode = mapLanguageNameToYoutubeCode(learningLanguage);
      const segments = await getVideoTranscript(id, langCode);
      setTranscript(segments);
    } catch (err) {
      setTranscript([]);
      setTranscriptError('Unable to fetch transcript for this video.');
    } finally {
      setLoadingTranscript(false);
    }
    setIsPlaying(true);
  };

  const resetVideoScreenState = React.useCallback(() => {
    try { playerRef.current?.seekTo?.(0); } catch {}
    try { playerRef.current?.pauseVideo?.(); } catch {}
    setIsPlaying(false);
    setPlayerReady(false);
    setCurrentTime(0);
    setActiveIndex(null);
    lineOffsetsRef.current = {};
    setInputUrl('');
    setUrl('');
    setTranscript([]);
    setTranscriptError(null);
    setSelectedWordKey(null);
    setTranslationPanel(null);
    setImageScrape(null);
    setCurrentVideoTitle('');
    try { scrollViewRef.current?.scrollTo?.({ y: 0, animated: false }); } catch {}
  }, []);

  React.useEffect(() => {
    const ts = (route as any)?.params?.resetAt;
    if (!ts) return;
    resetVideoScreenState();
  }, [(route as any)?.params?.resetAt, resetVideoScreenState]);

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

  const parseYandexImageUrlsFromHtml = (html: string): string[] => {
    try {
      const results: string[] = [];
      const imgTagRegex = /<img\b[^>]*class=(["'])([^"']*?)\1[^>]*>/gi;
      let match: RegExpExecArray | null;
      while ((match = imgTagRegex.exec(html)) !== null) {
        const classAttr = match[2] || '';
        if (
          classAttr.indexOf('ImagesContentImage-Image') !== -1 &&
          classAttr.indexOf('ImagesContentImage-Image_clickable') !== -1
        ) {
          const tag = match[0];
          let url: string | null = null;
          const srcsetMatch = /srcset=(["'])([^"']+?)\1/i.exec(tag);
          if (srcsetMatch && srcsetMatch[2]) {
            url = srcsetMatch[2].split(',')[0].trim().split(/\s+/)[0];
          }
          if (!url) {
            const dataSrcMatch = /data-src=(["'])([^"']+?)\1/i.exec(tag);
            if (dataSrcMatch && dataSrcMatch[2]) url = dataSrcMatch[2];
          }
          if (!url) {
            const srcMatch = /src=(["'])([^"']+?)\1/i.exec(tag);
            if (srcMatch && srcMatch[2]) url = srcMatch[2];
          }
          if (url) {
            let normalized = url;
            if (normalized.startsWith('//')) normalized = 'https:' + normalized;
            else if (normalized.startsWith('/')) normalized = 'https://yandex.com' + normalized;
            if (!results.includes(normalized)) {
              results.push(normalized);
              if (results.length >= 6) break;
            }
          }
        }
      }
      return results.slice(0, 6);
    } catch {
      return [];
    }
  };

  const fetchImageUrls = async (word: string): Promise<string[]> => {
    const searchUrl = `https://yandex.com/images/search?text=${encodeURIComponent(word)}`;
    if (imageScrape) {
      return [];
    }
    const result: string[] = await new Promise<string[]>((resolve, reject) => {
      imageScrapeResolveRef.current = resolve;
      imageScrapeRejectRef.current = reject;
      setImageScrape({ url: searchUrl, word });
    }).catch(() => [] as string[]);
    if (Array.isArray(result) && result.length > 0) return result.slice(0, 6);
    return [];
  };

  const onScrapeMessage = (event: WebViewMessageEvent) => {
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
  };

  const openPanel = (word: string, sentence?: string) => {
    setTranslationPanel({ word, translation: '', sentence, images: [], imagesLoading: true, translationLoading: true });
    fetchTranslation(word)
      .then((t) => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, translation: t || prev.translation, translationLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, translationLoading: false } : prev));
      });
    fetchImageUrls(word)
      .then((imgs) => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, images: imgs, imagesLoading: false } : prev));
      })
      .catch(() => {
        setTranslationPanel(prev => (prev && prev.word === word ? { ...prev, images: [], imagesLoading: false } : prev));
      });
  };

  const saveCurrentWord = async () => {
    if (!translationPanel) return;
    const entry = {
      word: translationPanel.word,
      translation: translationPanel.translation,
      sentence: translationPanel.sentence || '',
      addedAt: new Date().toISOString(),
      numberOfCorrectAnswers: {
        missingLetters: 0,
        missingWords: 0,
        chooseTranslation: 0,
        chooseWord: 0,
        memoryGame: 0,
        writeTranslation: 0,
        writeWord: 0,
      },
    } as const;

    const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;
    try {
      let current: unknown = [];
      try {
        const content = await RNFS.readFile(filePath, 'utf8');
        current = JSON.parse(content);
      } catch {
        current = [];
      }
      const arr = Array.isArray(current) ? current : [];

      const normalize = (it: any) => {
        const base = it && typeof it === 'object' ? it : {};
        const noa = (base as any).numberOfCorrectAnswers || {};
        const safeNoa = {
          missingLetters: Math.max(0, Number(noa.missingLetters) || 0),
          missingWords: Math.max(0, Number(noa.missingWords) || 0),
          chooseTranslation: Math.max(0, Number(noa.chooseTranslation) || 0),
          chooseWord: Math.max(0, Number(noa.chooseWord) || 0),
          memoryGame: Math.max(0, Number(noa.memoryGame) || 0),
          writeTranslation: Math.max(0, Number(noa.writeTranslation) || 0),
          writeWord: Math.max(0, Number(noa.writeWord) || 0),
        };
        return { ...base, numberOfCorrectAnswers: safeNoa };
      };
      const normalized = arr.map(normalize);

      const exists = normalized.some(
        (it: any) => it && typeof it === 'object' && it.word === entry.word && it.sentence === entry.sentence
      );
      if (!exists) normalized.push(entry);

      await RNFS.writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf8');
    } catch (e) {
      // ignore errors silently
    }
  };

  const tokenizeTranscriptLine = React.useCallback((text: string): Array<{ value: string; isWord: boolean }> => {
    const re = /[\p{L}\p{N}'’\-]+|\s+|[^\s\p{L}\p{N}]/gu;
    const out: Array<{ value: string; isWord: boolean }> = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const tok = m[0];
      const isWord = /[\p{L}\p{N}'’\-]+/u.test(tok);
      out.push({ value: tok, isWord });
    }
    if (out.length === 0) out.push({ value: text, isWord: true });
    return out;
  }, []);

  React.useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const t = await playerRef.current?.getCurrentTime?.();
        if (!cancelled && typeof t === 'number' && !Number.isNaN(t)) {
          setCurrentTime(t);
        }
      } catch {}
    }, 500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [playerReady]);

  React.useEffect(() => {
    if (!transcript || transcript.length === 0) {
      setActiveIndex(null);
      return;
    }
    const idx = transcript.findIndex((seg) => currentTime >= seg.offset && currentTime < seg.offset + seg.duration);
    if (idx !== -1) {
      setActiveIndex(idx);
      return;
    }
    let lastIdx: number | null = null;
    for (let i = 0; i < transcript.length; i++) {
      if (currentTime >= transcript[i].offset) lastIdx = i;
      else break;
    }
    setActiveIndex(lastIdx);
  }, [currentTime, transcript]);

  React.useEffect(() => {
    if (activeIndex == null) return;
    const y = lineOffsetsRef.current[activeIndex];
    if (typeof y !== 'number') return;
    try {
      scrollViewRef.current?.scrollTo?.({ y: Math.max(y - 80, 0), animated: true });
    } catch {}
  }, [activeIndex]);

  const handleSubmit = React.useCallback(() => {
    setUrl(inputUrl);
  }, [inputUrl]);

  const handleOpenPress = React.useCallback(() => {
    const id = extractYouTubeVideoId(inputUrl);

    if (!videoId) {
      if (!id) {
        setTranscript([]);
        setTranscriptError('Please enter a valid YouTube URL or video ID.');
        setIsPlaying(false);
        return;
      }
      setUrl(inputUrl);
      setCurrentVideoTitle('');
      (async () => {
        const t = await fetchYouTubeTitleById(id);
        if (t) setCurrentVideoTitle(t);
      })();
      if (transcript.length === 0) {
        (async () => {
          setLoadingTranscript(true);
          setTranscriptError(null);
          try {
            const langCode = mapLanguageNameToYoutubeCode(learningLanguage);
            const segments = await getVideoTranscript(id, langCode);
            setTranscript(segments);
          } catch (err) {
            setTranscript([]);
            setTranscriptError('Unable to fetch transcript for this video.');
          } finally {
            setLoadingTranscript(false);
          }
        })();
      }
      setIsPlaying(true);
      return;
    }

    if (id && id !== videoId) {
      setUrl(inputUrl);
      setCurrentVideoTitle('');
      (async () => {
        const t = await fetchYouTubeTitleById(id);
        if (t) setCurrentVideoTitle(t);
      })();
      setTranscript([]);
      setTranscriptError(null);
      (async () => {
        setLoadingTranscript(true);
        try {
          const langCode = mapLanguageNameToYoutubeCode(learningLanguage);
          const segments = await getVideoTranscript(id, langCode);
          setTranscript(segments);
        } catch (err) {
          setTranscript([]);
          setTranscriptError('Unable to fetch transcript for this video.');
        } finally {
          setLoadingTranscript(false);
        }
      })();
      setIsPlaying(true);
      return;
    }

    if (isPlaying || (typeof currentTime === 'number' && currentTime > 0.1)) {
      try {
        playerRef.current?.seekTo?.(0);
      } catch {}
      setIsPlaying(false);
      return;
    }
  }, [inputUrl, videoId, transcript.length, isPlaying, currentTime, learningLanguage]);

  

  const NewestVideos = () => {
    return (
      <>
        <Text style={styles.sectionTitle}>newest videos</Text>
        {startupVideosLoading ? (
          <View style={styles.centered}><ActivityIndicator /></View>
        ) : startupVideosError ? (
          <Text style={[styles.helper, { color: '#cc3333' }]}>{startupVideosError}</Text>
        ) : startupVideos.length > 0 ? (
          <View style={styles.videosList}>
            {startupVideos.map((v, idx) => (
              <TouchableOpacity key={`${v.url}-${idx}`} style={styles.videoItem} onPress={() => openStartupVideo(v.url, v.title)} activeOpacity={0.7}>
                <Image source={{ uri: v.thumbnail }} style={styles.videoThumb} />
                <View style={styles.videoInfo}>
                  <Text style={styles.videoTitle} numberOfLines={2}>{v.title}</Text>
                  <Text style={styles.videoDescription} numberOfLines={3}>{v.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.helper}>No videos yet.</Text>
        )}
      </>
    );
  };

  const Transcript = () => {
    return (
      <>
      {videoId ? (
        <View style={{ marginTop: 16, marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Transcript</Text>
          {loadingTranscript ? (
            <View style={styles.centered}>
              <ActivityIndicator />
              <Text style={styles.helper}>Fetching transcript…</Text>
            </View>
          ) : transcriptError ? (
            <Text style={[styles.helper, { color: '#cc3333' }]}>{transcriptError}</Text>
          ) : transcript.length > 0 ? (
            <ScrollView style={styles.transcriptBox} ref={scrollViewRef} nestedScrollEnabled>
              {transcript.map((seg, index) => {
                const tokens = tokenizeTranscriptLine(seg.text);
                return (
                  <Text
                    key={`${seg.offset}-${index}`}
                    onLayout={(e) => {
                      const y = e.nativeEvent.layout.y;
                      lineOffsetsRef.current[index] = y;
                    }}
                    style={[
                      styles.transcriptLine,
                      activeIndex === index ? styles.transcriptLineActive : null,
                    ]}
                  >
                    {tokens.map((tok, tIdx) => {
                      const key = `${index}:${tIdx}`;
                      if (!tok.isWord) {
                        return (
                          <Text key={key}>
                            {tok.value}
                          </Text>
                        );
                      }
                      const isSelected = selectedWordKey === key;
                      return (
                        <Text
                          key={key}
                          onPress={() => {
                            setSelectedWordKey(key);
                            openPanel(tok.value);
                          }}
                          style={isSelected ? styles.transcriptWordSelected : undefined}
                        >
                          {tok.value}
                        </Text>
                      );
                    })}
                  </Text>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.helper}>No transcript lines to display.</Text>
          )}
        </View>
      ) : null}
      </>
    );
  };

  const ImageScrape = () => {
    return (
      <>{imageScrape && (
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
              try { hiddenWebViewRef.current?.injectJavaScript(imageScrapeInjection); } catch (e) {}
            }}
            onError={() => {
              imageScrapeRejectRef.current?.();
              imageScrapeResolveRef.current = null;
              imageScrapeRejectRef.current = null;
              setImageScrape(null);
            }}
          />
        </View>
      )}</>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
    >
      <SearchBar
        inputUrl={inputUrl}
        onChangeText={setInputUrl}
        onSubmit={handleSubmit}
        onOpenPress={handleOpenPress}
        urlInputRef={urlInputRef}
      />
      {videoId ? (
        <>
        {currentVideoTitle ? <Text style={styles.nowPlayingTitle} numberOfLines={2}>{currentVideoTitle}</Text> : null}
        <View style={styles.playerWrapper}>
          <YoutubePlayer
            height={220}
            play={isPlaying}
            videoId={videoId}
            webViewProps={{
              allowsFullscreenVideo: true,
            }}
            ref={playerRef}
            onReady={() => setPlayerReady(true)}
            onChangeState={(state) => {
              if (state === 'playing') setIsPlaying(true);
              if (state === 'paused' || state === 'ended') setIsPlaying(false);
            }}
          />
        </View>
        </>
      ) : (
        <Text style={styles.helper}>Enter a valid YouTube link or 11-character ID to load the video.</Text>
      )}

      <Transcript />

      <ImageScrape />

      <NewestVideos />

      <TranslationPanel
        panel={translationPanel}
        onSave={saveCurrentWord}
        onClose={() => setTranslationPanel(null)}
      />


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  helper: {
    color: '#888',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  videosList: {
    marginBottom: 12,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  videoThumb: {
    width: 120,
    height: 68,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginRight: 10,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 13,
    color: '#555',
  },
  centered: {
    alignItems: 'center',
  },
  transcriptBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    maxHeight: 280,
  },
  transcriptLine: {
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
    marginBottom: 6,
  },
  transcriptLineActive: {
    color: '#007AFF',
    fontWeight: '700',
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  transcriptWordSelected: {
    backgroundColor: 'rgba(255,235,59,0.9)',
    borderRadius: 2,
  },
  nowPlayingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111',
  },
});

export default VideoScreen;
