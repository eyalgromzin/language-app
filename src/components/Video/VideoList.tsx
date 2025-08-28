import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from 'react-native';

type VideoItem = {
  url: string;
  thumbnail: string | null;
  title: string;
  description?: string;
  length?: string;
};

type VideoListProps = {
  title: string;
  videos: VideoItem[];
  loading: boolean;
  error: string | null;
  onVideoPress: (url: string, title: string) => void;
  emptyMessage?: string;
};

const VideoList: React.FC<VideoListProps> = ({
  title,
  videos,
  loading,
  error,
  onVideoPress,
  emptyMessage = 'No videos yet.',
}) => {
  if (loading) {
    return (
      <>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={[styles.helper, { color: '#cc3333' }]}>{error}</Text>
      </>
    );
  }

  if (videos.length === 0) {
    return (
      <>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.helper}>{emptyMessage}</Text>
      </>
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.videosList}>
        {videos.map((video, idx) => (
          <TouchableOpacity
            key={`${video.url}-${idx}`}
            style={styles.videoItem}
            onPress={() => onVideoPress(video.url, video.title)}
            activeOpacity={0.7}
          >
            <View style={styles.thumbWrapper}>
              {video.thumbnail ? (
                <Image source={{ uri: video.thumbnail }} style={styles.videoThumb} />
              ) : (
                <View style={[styles.videoThumb, { backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#666', fontSize: 12 }}>No image</Text>
                </View>
              )}
              {video.length ? (
                <View style={styles.thumbBadge}>
                  <Text style={styles.thumbBadgeText}>{video.length}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {video.title}
              </Text>
              <Text style={styles.videoDescription} numberOfLines={3}>
                {video.description || ''}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
  thumbWrapper: {
    width: 120,
    height: 68,
    marginRight: 10,
    position: 'relative',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  thumbBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thumbBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
  helper: {
    color: '#888',
    fontSize: 14,
  },
});

export default VideoList;
