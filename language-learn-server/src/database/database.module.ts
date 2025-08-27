import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NowPlayingEntity } from './entities/now-playing.entity';
import { WordCacheEntity } from './entities/word-cache.entity';
import { TranslationCacheEntity } from './entities/translation-cache.entity';
import { VideoCacheEntity } from './entities/video-cache.entity';
import { NowPlayingDbService, WordCacheDbService, VideoCacheDbService } from './services';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'dpg-d2mpmr15pdvs7395ke1g-a.oregon-postgres.render.com',
      port: 5432,
      username: 'admin',
      password: 'pXhtaqRCFlb5v2BTav6gulaoVpLzlpWC',
      database: 'hello_lingo',
      entities: [NowPlayingEntity, WordCacheEntity, TranslationCacheEntity, VideoCacheEntity],
      synchronize: true, // Be careful with this in production
      ssl: {
        rejectUnauthorized: false,
      },
    }),
    TypeOrmModule.forFeature([NowPlayingEntity, WordCacheEntity, TranslationCacheEntity, VideoCacheEntity]),
  ],
  providers: [NowPlayingDbService, WordCacheDbService, VideoCacheDbService],
  exports: [TypeOrmModule, NowPlayingDbService, WordCacheDbService, VideoCacheDbService],
})
export class DatabaseModule {}
