import React from 'react';
import { View, TextInput, StyleSheet, Text, Platform, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

function VideoScreen(): React.JSX.Element {
  const [inputUrl, setInputUrl] = React.useState<string>('');
  const [url, setUrl] = React.useState<string>('');
  const videoId = React.useMemo(() => extractYouTubeVideoId(url) ?? '', [url]);
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [transcript, setTranscript] = React.useState<Array<{ text: string; duration: number; offset: number }>>([]);
  const [loadingTranscript, setLoadingTranscript] = React.useState<boolean>(false);
  const [transcriptError, setTranscriptError] = React.useState<string | null>(null);
  const playerRef = React.useRef<any>(null);
  const [playerReady, setPlayerReady] = React.useState<boolean>(false);
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const scrollViewRef = React.useRef<any>(null);
  const lineOffsetsRef = React.useRef<Record<number, number>>({});
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const lang = await AsyncStorage.getItem('language.learning');
        if (!mounted) return;
        setLearningLanguage(lang);
      } catch {
        if (!mounted) return;
        setLearningLanguage(null);
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

  return (
    <View style={styles.container}>
      <Text style={styles.label}>YouTube URL</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={inputUrl}
          onChangeText={setInputUrl}
          placeholder="Paste a YouTube URL (or video ID)"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={Platform.OS === 'ios' ? 'url' : 'default'}
          style={[styles.input, { flex: 1 }]}
          accessibilityLabel="YouTube URL input"
          onSubmitEditing={() => setUrl(inputUrl)}
          returnKeyType="go"
        />
        <TouchableOpacity
          style={styles.goButton}
          onPress={() => {
            const id = extractYouTubeVideoId(inputUrl);

            // No video loaded yet: require a valid id, then start playback
            if (!videoId) {
              if (!id) {
                setTranscript([]);
                setTranscriptError('Please enter a valid YouTube URL or video ID.');
                setIsPlaying(false);
                return;
              }
              setUrl(inputUrl);
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

            // If a different video id is entered, switch video and play
            if (id && id !== videoId) {
              setUrl(inputUrl);
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

            // Do not toggle play/pause from the button anymore; it only opens
          }}
          accessibilityRole="button"
          accessibilityLabel="Open video"
        >
          <Text style={styles.goButtonText}>Open</Text>
        </TouchableOpacity>
      </View>
      {videoId ? (
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
      ) : (
        <Text style={styles.helper}>Enter a valid YouTube link or 11-character ID to load the video.</Text>
      )}

      {videoId ? (
        <View style={{ marginTop: 16, flex: 1 }}>
          <Text style={styles.sectionTitle}>Transcript</Text>
          {loadingTranscript ? (
            <View style={styles.centered}>
              <ActivityIndicator />
              <Text style={styles.helper}>Fetching transcript…</Text>
            </View>
          ) : transcriptError ? (
            <Text style={[styles.helper, { color: '#cc3333' }]}>{transcriptError}</Text>
          ) : transcript.length > 0 ? (
            <ScrollView style={styles.transcriptBox} ref={scrollViewRef}>
              {transcript.map((seg, index) => (
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
                  {seg.text}
                </Text>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.helper}>No transcript lines to display.</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 16,
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
});

export default VideoScreen;
