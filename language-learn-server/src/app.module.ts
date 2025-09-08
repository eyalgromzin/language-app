import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LibraryController } from './library/library.controller';
import { YouTubeService } from './youtube/youtube.service';
import { TranslateService } from './translate/translate.service';
import { WordCacheService } from './cache/word-cache.service';
import { VideoCacheService } from './cache/video-cache.service';
import { NowPlayingService } from './cache/now-playing.service';
import { BabyStepsModule } from './baby-steps/baby-steps.module';
import { VideoController } from './video/video.controller';
import { HarmfulWordsModule } from './harmful-words/harmful-words.module';
import { DatabaseModule } from './database/database.module';
import { ReportWebsiteModule } from './report-website/report-website.module';
import { Language } from './database/entities';
import { WordCategoriesService } from './word-categories';

@Module({
  imports: [
    HarmfulWordsModule, 
    DatabaseModule, 
    BabyStepsModule,
    ReportWebsiteModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Language])
  ],
  controllers: [AppController, LibraryController, VideoController],
  providers: [AppService, YouTubeService, TranslateService, WordCacheService, VideoCacheService, NowPlayingService, WordCategoriesService],
})
export class AppModule {}
