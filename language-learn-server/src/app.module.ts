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
import { VideoController } from './video/video.controller';
import { HarmfulWordsModule } from './harmful-words/harmful-words.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [HarmfulWordsModule, DatabaseModule],
  controllers: [AppController, LibraryController, BabyStepsController, VideoController],
  providers: [AppService, LibraryService, YouTubeService, TranslateService, WordCacheService, VideoCacheService, NowPlayingService, BabyStepsService],
})
export class AppModule {}
