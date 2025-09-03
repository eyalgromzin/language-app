import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';
import { YouTubeService } from './youtube/youtube.service';
import { TranslateService } from './translate/translate.service';
import { WordCacheService } from './cache/word-cache.service';
import { LibraryService } from './database/services/library.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly youTubeService: YouTubeService,
    private readonly translateService: TranslateService,
    private readonly wordCacheService: WordCacheService,
    private readonly libraryService: LibraryService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('word-categories')
  async getWordCategories(): Promise<any> {
    try {
      const filePath = path.join(__dirname, '..', 'data', 'wordCategories.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      throw new BadRequestException('Failed to load word categories');
    }
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

  @Get('languages')
  async getAllLanguages() {
    return this.appService.getAllLanguages();
  }

  @Post('languages')
  async createLanguage(@Body() languageData: any) {
    return this.appService.createLanguage(languageData);
  }

  
}
