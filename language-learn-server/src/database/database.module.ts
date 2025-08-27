import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemType } from './entities/item-type.entity';
import { Level } from './entities/level.entity';
import { Language } from './entities/language.entity';
import { Media } from './entities/media.entity';
import { LibraryItem } from './entities/library-item.entity';
import { LibraryService } from './services/library.service';
import { LibraryMigrationService } from './services/library-migration.service';
import { databaseConfig } from '../config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [ItemType, Level, Language, Media, LibraryItem],
    }),
    TypeOrmModule.forFeature([ItemType, Level, Language, Media, LibraryItem]),
  ],
  providers: [LibraryService, LibraryMigrationService],
  exports: [LibraryService, LibraryMigrationService],
})
export class DatabaseModule {}
