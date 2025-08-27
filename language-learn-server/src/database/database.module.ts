import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemType } from './entities/item-type.entity';
import { Level } from './entities/level.entity';
import { Language } from './entities/language.entity';
import { Media } from './entities/media.entity';
import { LibraryItem } from './entities/library-item.entity';
import { NowPlaying } from './entities/now-playing.entity';
import { LibraryService } from './services/library.service';
import { NowPlayingService } from './services/now-playing.service';
import { SeederService } from './services/seeder.service';
import { StartupService } from './services/startup.service';
import { SeederController } from './controllers/seeder.controller';
import { databaseConfig } from '../config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [ItemType, Level, Language, Media, LibraryItem, NowPlaying],
    }),
    TypeOrmModule.forFeature([ItemType, Level, Language, Media, LibraryItem, NowPlaying]),
  ],
  controllers: [SeederController],
  providers: [LibraryService, NowPlayingService, SeederService, StartupService],
  exports: [LibraryService, NowPlayingService, SeederService],
})
export class DatabaseModule {}
