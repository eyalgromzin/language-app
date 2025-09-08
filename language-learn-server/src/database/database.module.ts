import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemType } from './entities/item-type.entity';
import { Level } from './entities/level.entity';
import { Language } from './entities/language.entity';
import { Media } from './entities/media.entity';
import { LibraryItem } from './entities/library-item.entity';
import { NowPlaying } from './entities/now-playing.entity';
import { Translation } from './entities/translation.entity';
import { BabyStep } from './entities/baby-step.entity';
import { BabyStepItem } from './entities/baby-step-item.entity';
import { ReportedUrl } from './entities/reported-url.entity';
import { LibraryService } from './services/library.service';
import { NowPlayingService } from './services/now-playing.service';
import { SeederService } from './services/seeder.service';
import { StartupService } from './services/startup.service';
import { TranslationService } from './services/translation.service';
import { BabyStepsService } from './services/baby-steps.service';
import { ReportedUrlService } from './services/reported-url.service';
import { SeederController } from './controllers/seeder.controller';
import { databaseConfig } from '../config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [ItemType, Level, Language, Media, LibraryItem, NowPlaying, Translation, BabyStep, BabyStepItem, ReportedUrl],
    }),
    TypeOrmModule.forFeature([ItemType, Level, Language, Media, LibraryItem, NowPlaying, Translation, BabyStep, BabyStepItem, ReportedUrl]),
  ],
  controllers: [SeederController],
  providers: [LibraryService, NowPlayingService, SeederService, StartupService, TranslationService, BabyStepsService, ReportedUrlService],
  exports: [LibraryService, NowPlayingService, SeederService, TranslationService, BabyStepsService, ReportedUrlService],
})
export class DatabaseModule {}
