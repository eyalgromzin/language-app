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
    @Body('languageSymbol') languageSymbol: string,
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('thumbnailUrl') thumbnailUrl: string,
    @Body('url') url: string,
    @Body('length') length: string,
  ): Promise<{ ok: true }>
  {
    if (!languageSymbol || !title || !url) {
      throw new BadRequestException('Missing required body params: languageSymbol, title, url');
    }
    let len = (length ?? '').trim();
    if (!len) {
      try {
        len = (await this.youTubeService.getLengthString(url)) || '';
      } catch {}
    }
    await this.nowPlayingService.upsertNowPlaying({ languageSymbol, title, description, thumbnailUrl, url, length: len || undefined });
    return { ok: true };
  }

  @Post('now-playing')
  async getNowPlaying(@Body('languageSymbol') languageSymbol?: string): Promise<NowPlayingItem[] | Record<string, NowPlayingItem[]>> {
    if (languageSymbol && languageSymbol.trim()) {
      return this.nowPlayingService.getNowPlaying(languageSymbol);
    }
    return this.nowPlayingService.getAllNowPlaying();
  }
}


