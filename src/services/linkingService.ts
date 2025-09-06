import { Linking, Share, Platform } from 'react-native';

export interface AppLinkData {
  type: 'video' | 'surf' | 'library' | 'word';
  url: string;
  title?: string;
  word?: string;
  translation?: string;
  sentence?: string;
}

export class LinkingService {
  private static instance: LinkingService;
  
  public static getInstance(): LinkingService {
    if (!LinkingService.instance) {
      LinkingService.instance = new LinkingService();
    }
    return LinkingService.instance;
  }

  /**
   * Parse a helloLingo.app URL and extract the relevant data
   */
  public parseAppLink(url: string): AppLinkData | null {
    try {
      const urlObj = new URL(url);
      
      // Check if it's our domain
      if (urlObj.hostname !== 'hellolingo.app') {
        return null;
      }

      const searchParams = urlObj.searchParams;
      const type = searchParams.get('type');

      // Handle video links: https://hellolingo.app/?type=video&url=YOUTUBE_URL&title=VIDEO_TITLE
      if (type === 'video') {
        const videoUrl = searchParams.get('url');
        const title = searchParams.get('title');
        
        if (videoUrl) {
          return {
            type: 'video',
            url: decodeURIComponent(videoUrl),
            title: title ? decodeURIComponent(title) : undefined
          };
        }
      }

      // Handle surf links: https://hellolingo.app/?type=surf&url=WEB_URL
      if (type === 'surf') {
        const surfUrl = searchParams.get('url');
        
        if (surfUrl) {
          return {
            type: 'surf',
            url: decodeURIComponent(surfUrl)
          };
        }
      }

      // Handle library links: https://hellolingo.app/?type=library
      if (type === 'library') {
        return {
          type: 'library',
          url: 'https://hellolingo.app/?type=library'
        };
      }

      // Handle word links: https://hellolingo.app/?type=word&word=WORD&translation=TRANSLATION&sentence=SENTENCE
      if (type === 'word') {
        const word = searchParams.get('word');
        const translation = searchParams.get('translation');
        const sentence = searchParams.get('sentence');
        
        if (word && translation) {
          return {
            type: 'word',
            url: url,
            word: decodeURIComponent(word),
            translation: decodeURIComponent(translation),
            sentence: sentence ? decodeURIComponent(sentence) : undefined
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing app link:', error);
      return null;
    }
  }

  /**
   * Generate a shareable helloLingo.app URL for video content
   */
  public generateVideoShareUrl(videoUrl: string, title?: string): string {
    const baseUrl = 'https://hellolingo.app';
    const params = new URLSearchParams();
    params.append('type', 'video');
    params.append('url', encodeURIComponent(videoUrl));
    if (title) {
      params.append('title', encodeURIComponent(title));
    }
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate a shareable helloLingo.app URL for surf content
   */
  public generateSurfShareUrl(surfUrl: string): string {
    const baseUrl = 'https://hellolingo.app';
    const params = new URLSearchParams();
    params.append('type', 'surf');
    params.append('url', encodeURIComponent(surfUrl));
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate a shareable helloLingo.app URL for library content
   */
  public generateLibraryShareUrl(): string {
    return 'https://hellolingo.app/?type=library';
  }

  /**
   * Share content using the native share dialog
   */
  public async shareContent(
    url: string, 
    title?: string, 
    message?: string
  ): Promise<void> {
    try {
      // Ensure the URL is included in the message for better platform compatibility
      const finalMessage = message && !message.includes(url) 
        ? `${message}\n\n${url}` 
        : message || `Check out this content: ${url}`;

      const shareContent = {
        url,
        title: title || 'Check this out!',
        message: finalMessage
      };

      await Share.share(shareContent, {
        dialogTitle: 'Share via HelloLingo'
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  }

  /**
   * Share a video with a helloLingo.app link
   */
  public async shareVideo(videoUrl: string, title?: string): Promise<void> {
    const shareUrl = this.generateVideoShareUrl(videoUrl, title);
    const shareTitle = title || 'YouTube Video';
    const shareMessage = `Check out this video: ${title || videoUrl}`;
    
    await this.shareContent(shareUrl, shareTitle, shareMessage);
  }

  /**
   * Share a surf URL with a helloLingo.app link
   */
  public async shareSurfUrl(surfUrl: string): Promise<void> {
    const shareUrl = this.generateSurfShareUrl(surfUrl);
    const shareTitle = 'Web Page';
    const shareMessage = `Check out this webpage:`;
    
    await this.shareContent(shareUrl, shareTitle, shareMessage);
  }

  /**
   * Share the library screen with a helloLingo.app link
   */
  public async shareLibrary(): Promise<void> {
    const shareUrl = this.generateLibraryShareUrl();
    const shareTitle = 'HelloLingo Library';
    const shareMessage = `Check out the HelloLingo library for language learning content!`;
    
    await this.shareContent(shareUrl, shareTitle, shareMessage);
  }

  /**
   * Generate a shareable helloLingo.app URL for word content
   */
  public generateWordShareUrl(word: string, translation: string, sentence?: string): string {
    const baseUrl = 'https://hellolingo.app';
    const params = new URLSearchParams();
    params.append('type', 'word');
    params.append('word', encodeURIComponent(word));
    params.append('translation', encodeURIComponent(translation));
    if (sentence) {
      params.append('sentence', encodeURIComponent(sentence));
    }
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Share a word with a helloLingo.app link
   */
  public async shareWord(word: string, translation: string, sentence?: string): Promise<void> {
    const shareUrl = this.generateWordShareUrl(word, translation, sentence);
    const shareTitle = `Learn "${word}"`;
    const shareMessage = `Learn "${word}" (${translation})${sentence ? ` - "${sentence}"` : ''} with HelloLingo!`;
    
    await this.shareContent(shareUrl, shareTitle, shareMessage);
  }

  /**
   * Check if the app can handle a given URL
   */
  public canHandleUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'hellolingo.app';
    } catch {
      return false;
    }
  }

  /**
   * Open a URL in the default browser
   */
  public async openInBrowser(url: string): Promise<void> {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  }
}

export default LinkingService.getInstance();
