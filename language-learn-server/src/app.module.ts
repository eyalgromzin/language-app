import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibraryService } from './library/library.service';
import { LibraryController } from './library/library.controller';
import { YouTubeService } from './youtube/youtube.service';
import { TranslateService } from './translate/translate.service';
import { WordCacheService } from './cache/word-cache.service';
import { VideoCacheService } from './cache/video-cache.service';
import { NowPlayingService } from './cache/now-playing.service';

@Module({
  imports: [],
  controllers: [AppController, LibraryController],
  providers: [AppService, LibraryService, YouTubeService, TranslateService, WordCacheService, VideoCacheService, NowPlayingService],
})
export class AppModule {}
