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
import { BabyStepsService } from './baby-steps';
import { BabyStepsController } from './baby-steps';

@Module({
  imports: [],
  controllers: [AppController, LibraryController, BabyStepsController],
  providers: [AppService, LibraryService, YouTubeService, TranslateService, WordCacheService, VideoCacheService, NowPlayingService, BabyStepsService],
})
export class AppModule {}
