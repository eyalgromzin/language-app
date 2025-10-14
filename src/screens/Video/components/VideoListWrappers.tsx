import React from 'react';
import { VideoList } from '../../../components/Video';

type Video = { 
  url: string; 
  thumbnail: string | null; 
  title: string; 
  description?: string; 
  length?: string;
};

type VideoListWrapperProps = {
  title: string;
  videos: Video[];
  loading: boolean;
  error: string | null;
  onVideoPress: (url: string, title?: string) => void;
  emptyMessage: string;
};

const VideoListWrapper: React.FC<VideoListWrapperProps> = ({
  title,
  videos,
  loading,
  error,
  onVideoPress,
  emptyMessage,
}) => {
  return (
    <VideoList
      title={title}
      videos={videos}
      loading={loading}
      error={error}
      onVideoPress={onVideoPress}
      emptyMessage={emptyMessage}
    />
  );
};

type NewestVideosProps = {
  videos: Video[];
  loading: boolean;
  error: string | null;
  onVideoPress: (url: string, title?: string) => void;
  t: (key: string) => string;
};

export const NewestVideos: React.FC<NewestVideosProps> = ({ 
  videos, 
  loading, 
  error, 
  onVideoPress, 
  t 
}) => {
  return (
    <VideoListWrapper
      title={t('screens.video.newestVideos')}
      videos={videos}
      loading={loading}
      error={error}
      onVideoPress={onVideoPress}
      emptyMessage={t('screens.video.noVideosYet')}
    />
  );
};

type NowPlayingProps = {
  videos: Video[];
  loading: boolean;
  error: string | null;
  onVideoPress: (url: string, title?: string) => void;
  t: (key: string) => string;
};

export const NowPlaying: React.FC<NowPlayingProps> = ({ 
  videos, 
  loading, 
  error, 
  onVideoPress, 
  t 
}) => {
  return (
    <VideoListWrapper
      title={t('screens.video.nowPlayingByOthers')}
      videos={videos}
      loading={loading}
      error={error}
      onVideoPress={onVideoPress}
      emptyMessage={t('screens.video.appJustStarted')}
    />
  );
};

type SearchResultsProps = {
  videos: Video[];
  loading: boolean;
  error: string | null;
  onVideoPress: (url: string, title?: string) => void;
  t: (key: string) => string;
};

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  videos, 
  loading, 
  error, 
  onVideoPress, 
  t 
}) => {
  if (!loading && !error && videos.length === 0) return null;
  
  return (
    <VideoListWrapper
      title={t('screens.video.searchResults')}
      videos={videos}
      loading={loading}
      error={error}
      onVideoPress={onVideoPress}
      emptyMessage={t('screens.video.noResults')}
    />
  );
};

