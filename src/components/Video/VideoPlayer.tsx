import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

type VideoPlayerProps = {
  videoId: string;
  isPlaying: boolean;
  currentVideoTitle?: string;
  playerRef: React.RefObject<any>;
  onReady: () => void;
  onChangeState: (state: string) => void;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  isPlaying,
  currentVideoTitle,
  playerRef,
  onReady,
  onChangeState,
}) => {
  return (
    <>
      {currentVideoTitle ? (
        <Text style={styles.nowPlayingTitle} numberOfLines={2}>
          {currentVideoTitle}
        </Text>
      ) : null}
      <View style={styles.playerWrapper}>
        <YoutubePlayer
          height={220}
          play={isPlaying}
          videoId={videoId}
          webViewProps={{
            allowsFullscreenVideo: true,
          }}
          ref={playerRef}
          onReady={onReady}
          onChangeState={onChangeState}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  playerWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  nowPlayingTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111',
  },
});

export default VideoPlayer;
