import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import YoutubeIframe, { YoutubeIframeRef } from '../react-native-youtube-iframe-local';


type VideoPlayerProps = {
  videoId: string;
  isPlaying: boolean;
  currentVideoTitle?: string;
  playerRef: React.RefObject<any>;
  onReady: () => void;
  onChangeState: (state: string) => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  isPlaying,
  currentVideoTitle,
  playerRef,
  onReady,
  onChangeState,
  isFullScreen,
  onToggleFullScreen,
}) => {
  return (
    <>
      {currentVideoTitle ? (
        <View style={styles.titleContainer}>
          <Text style={styles.nowPlayingTitle} numberOfLines={2}>
            {currentVideoTitle}
          </Text>
          <TouchableOpacity
            onPress={onToggleFullScreen}
            style={styles.fullScreenButton}
            accessibilityRole="button"
            accessibilityLabel={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons 
              name={isFullScreen ? 'contract' : 'expand'} 
              size={20} 
              color="#64748b" 
            />
          </TouchableOpacity>
        </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nowPlayingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    marginRight: 8,
  },
  fullScreenButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: -2, // Slight adjustment to align with title text
  },
  playerWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});

export default VideoPlayer;
