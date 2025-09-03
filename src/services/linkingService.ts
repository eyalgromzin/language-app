import { Linking, Share, Platform } from 'react-native';

export interface AppLinkData {
  type: 'video' | 'surf' | 'library';
  url: string;
  title?: string;
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

      const path = urlObj.pathname;
      const searchParams = urlObj.searchParams;

      // Handle video links: https://helloLingo.app/video?url=YOUTUBE_URL&title=VIDEO_TITLE
      if (path === '/video') {
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

      // Handle surf links: https://helloLingo.app/surf?url=WEB_URL
      if (path === '/surf') {
        const surfUrl = searchParams.get('url');
        
        if (surfUrl) {
          return {
            type: 'surf',
            url: decodeURIComponent(surfUrl)
          };
        }
      }

      // Handle library links: https://helloLingo.app/library
      if (path === '/library') {
        return {
          type: 'library',
          url: 'https://hellolingo.app/library'
        };
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
    const baseUrl = 'https://hellolingo.app/video';
    const params = new URLSearchParams();
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
    const baseUrl = 'https://hellolingo.app/surf';
    const params = new URLSearchParams();
    params.append('url', encodeURIComponent(surfUrl));
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate a shareable helloLingo.app URL for library content
   */
  public generateLibraryShareUrl(): string {
    return 'https://hellolingo.app/library';
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
