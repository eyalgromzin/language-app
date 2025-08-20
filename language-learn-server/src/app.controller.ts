import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';
import { YouTubeService } from './youtube/youtube.service';
import { TranslateService } from './translate/translate.service';
import { WordCacheService } from './cache/word-cache.service';
import { NowPlayingService, NowPlayingItem } from './cache/now-playing.service';
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly youTubeService: YouTubeService,
    private readonly translateService: TranslateService,
    private readonly wordCacheService: WordCacheService,
    private readonly nowPlayingService: NowPlayingService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('transcript')
  async getTranscript(
    @Body('video') video?: string,
    @Body('lang') lang?: string,
  ): Promise<{ text: string; duration: number; offset: number; lang?: string }[]> {
    return this.youTubeService.getTranscript(video, lang);
  }

  @Post('getVideoStartupPage')
  async getVideoStartupPage(
    @Body('symbol') symbol?: string,
    @Body('language') language?: string,
  ): Promise<{
    results: { url: string; thumbnail: string | null; title: string; description?: string; length?: string }[];
    query: string;
  }> {
    return this.youTubeService.getVideoStartupPage({ symbol, language });
  }

  @Post('youtube/search')
  async searchYouTube(
    @Body('query') query?: string,
  ): Promise<{ url: string; thumbnail: string | null; title: string; description?: string; length?: string }[]> {
    return this.youTubeService.searchVideos({ query });
  }
 
  @Post('translate')
  async translate(
    @Body('word') word?: string,
    @Body('fromLanguageSymbol') fromLanguageSymbol?: string,
    @Body('toLanguageSymbol') toLanguageSymbol?: string,
  ): Promise<string> {
    if (!word || !toLanguageSymbol || !fromLanguageSymbol) {
      throw new BadRequestException('Missing required body params: word, fromLanguageSymbol and toLanguageSymbol');
    }

    // console.log(word, ' : ', fromLanguageSymbol, ' > ',toLanguageSymbol);
    const translated = await this.translateService.fetchTranslation(word, fromLanguageSymbol, toLanguageSymbol);
    return translated;
  }

  @Get('cache/last-words')
  async getLastWords(): Promise<string[]> {
    return this.wordCacheService.getLastWords();
  }

  @Post('now-playing/upsert')
  async upsertNowPlaying(
    @Body('languageSymbol') languageSymbol?: string,
    @Body('title') title?: string,
    @Body('description') description?: string,
    @Body('thumbnailUrl') thumbnailUrl?: string,
    @Body('url') url?: string,
  ): Promise<{ ok: true }>
  {
    if (!languageSymbol || !title || !url) {
      throw new BadRequestException('Missing required body params: languageSymbol, title, url');
    }
    await this.nowPlayingService.upsertNowPlaying({ languageSymbol, title, description, thumbnailUrl, url });
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
