import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { YouTubeService } from '../youtube/youtube.service';
import { NowPlayingService, NowPlayingItem } from '../cache/now-playing.service';

@Controller('video')
export class VideoController {
  constructor(
    private readonly nowPlayingService: NowPlayingService,
    private readonly youTubeService: YouTubeService,
  ) {}

  @Post('now-playing/upsert')
  async upsertNowPlaying(
    @Body('url') url: string,
    @Body('title') title: string,
    @Body('language') language: string,
  ): Promise<{ ok: true }>
  {
    if (!url || !title || !language) {
      throw new BadRequestException('Missing required body params: url, title, language');
    }
    
    // Extract video ID for thumbnail
    const videoId = this.extractYouTubeVideoId(url);
    const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined;
    
    // Get video length if possible
    let length: string | undefined;
    if (videoId) {
      try {
        length = await this.youTubeService.getLengthString(url) || undefined;
      } catch {}
    }
    
    await this.nowPlayingService.upsertNowPlaying({ 
      languageSymbol: language, 
      title, 
      url, 
      thumbnailUrl,
      length
    });
    return { ok: true };
  }

  private extractYouTubeVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  @Post('now-playing')
  async getNowPlaying(@Body('languageSymbol') languageSymbol?: string): Promise<NowPlayingItem[] | Record<string, NowPlayingItem[]>> {
    if (languageSymbol && languageSymbol.trim()) {
      const result = await this.nowPlayingService.getNowPlaying(languageSymbol);
      return result;
    }
    
    return [];
  }
}


