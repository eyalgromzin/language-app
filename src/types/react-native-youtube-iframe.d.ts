declare module 'react-native-youtube-iframe' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface YoutubeIframeProps extends ViewProps {
    height: number;
    width?: number | string;
    play?: boolean;
    videoId: string;
    initialPlayerParams?: {
      start?: number;
      end?: number;
      controls?: boolean;
      modestbranding?: boolean;
      rel?: boolean;
      cc_lang_pref?: string;
      showClosedCaptions?: boolean;
    };
    webViewProps?: Record<string, any>;
    onChangeState?: (event: string) => void;
    onReady?: () => void;
    onError?: (e: string) => void;
    onPlaybackQualityChange?: (q: string) => void;
    onPlaybackRateChange?: (r: number) => void;
  }

  export default class YoutubePlayer extends React.Component<YoutubeIframeProps> {}
}


