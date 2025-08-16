import React from 'react';
import { View, TextInput, StyleSheet, Text, Platform } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

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
  const [url, setUrl] = React.useState<string>('');
  const videoId = React.useMemo(() => extractYouTubeVideoId(url) ?? '', [url]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>YouTube URL</Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder="Paste a YouTube URL (or video ID)"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={Platform.OS === 'ios' ? 'url' : 'default'}
        style={styles.input}
        accessibilityLabel="YouTube URL input"
      />
      {videoId ? (
        <View style={styles.playerWrapper}>
          <YoutubePlayer
            height={220}
            play={false}
            videoId={videoId}
            webViewProps={{
              allowsFullscreenVideo: true,
            }}
          />
        </View>
      ) : (
        <Text style={styles.helper}>Enter a valid YouTube link or 11-character ID to load the video.</Text>
      )}
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
  playerWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  helper: {
    color: '#888',
    fontSize: 14,
  },
});

export default VideoScreen;
