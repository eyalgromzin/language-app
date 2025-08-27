import { Injectable } from '@nestjs/common';
import { NowPlayingService as DatabaseNowPlayingService, type NowPlayingItem } from '../database/services/now-playing.service';

@Injectable()
export class NowPlayingService {
  private lastUpdateTime: number = 0;
  private readonly MIN_UPDATE_INTERVAL = 60000; // 1 minute in milliseconds

  constructor(
    private readonly databaseNowPlayingService: DatabaseNowPlayingService,
  ) {}

  async upsertNowPlaying(params: {
    languageSymbol: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    url: string;
    length?: string;
  }): Promise<void> {
    const currentTime = Date.now();
    
    // Only update if at least 1 minute has passed since last update
    if (currentTime - this.lastUpdateTime >= this.MIN_UPDATE_INTERVAL) {
      this.lastUpdateTime = currentTime;
      return this.databaseNowPlayingService.upsertNowPlaying(params);
    }
    
    // If not enough time has passed, skip the database update
    return Promise.resolve();
  }

  async getNowPlaying(languageSymbol: string): Promise<NowPlayingItem[]> {
    return this.databaseNowPlayingService.getNowPlaying(languageSymbol);
  }

  async getAllNowPlaying(): Promise<Record<string, NowPlayingItem[]>> {
    return this.databaseNowPlayingService.getAllNowPlaying();
  }
}

export type { NowPlayingItem };


