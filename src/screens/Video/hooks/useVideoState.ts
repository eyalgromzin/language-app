import React from 'react';
import type { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { extractYouTubeVideoId } from '../videoMethods';

export const useVideoState = () => {
  const [inputUrl, setInputUrl] = React.useState<string>('');
  const [url, setUrl] = React.useState<string>('');
  const videoId = React.useMemo(() => extractYouTubeVideoId(url) ?? '', [url]);
  const playerRef = React.useRef<YoutubeIframeRef | null>(null);
  const [playerReady, setPlayerReady] = React.useState<boolean>(false);
  const [currentPlayerTime, setCurrentPlayerTime] = React.useState<number>(0);
  const [activeTranscriptIndex, setActiveTranscriptIndex] = React.useState<number | null>(null);
  const scrollViewRef = React.useRef<any>(null);
  const lineOffsetsRef = React.useRef<Record<number, number>>({});
  const urlInputRef = React.useRef<any>(null);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [currentVideoTitle, setCurrentVideoTitle] = React.useState<string>('');
  const [hidePlayback, setHidePlayback] = React.useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = React.useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = React.useState<boolean>(false);
  const [showHistory, setShowHistory] = React.useState<boolean>(false);
  const [showFavouritesList, setShowFavouritesList] = React.useState<boolean>(false);
  const [showOptionsMenuGlobal, setShowOptionsMenuGlobal] = React.useState<boolean>(false);
  const [optionsButtonPositionGlobal, setOptionsButtonPositionGlobal] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showAddFavouriteModal, setShowAddFavouriteModal] = React.useState<boolean>(false);

  return {
    inputUrl,
    setInputUrl,
    url,
    setUrl,
    videoId,
    playerRef,
    playerReady,
    setPlayerReady,
    currentPlayerTime,
    setCurrentPlayerTime,
    activeTranscriptIndex,
    setActiveTranscriptIndex,
    scrollViewRef,
    lineOffsetsRef,
    urlInputRef,
    isPlaying,
    setIsPlaying,
    currentVideoTitle,
    setCurrentVideoTitle,
    hidePlayback,
    setHidePlayback,
    isFullScreen,
    setIsFullScreen,
    isInputFocused,
    setIsInputFocused,
    showHistory,
    setShowHistory,
    showFavouritesList,
    setShowFavouritesList,
    showOptionsMenuGlobal,
    setShowOptionsMenuGlobal,
    optionsButtonPositionGlobal,
    setOptionsButtonPositionGlobal,
    showAddFavouriteModal,
    setShowAddFavouriteModal,
  };
};

