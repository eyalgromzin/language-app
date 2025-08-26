import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NowPlayingEntity } from '../entities/now-playing.entity';

export type NowPlayingItem = {
  languageSymbol: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  url: string;
  length?: string;
  updated_at: number;
};

@Injectable()
export class NowPlayingDbService {
  private readonly maxPerLanguage = 20;

  constructor(
    @InjectRepository(NowPlayingEntity)
    private nowPlayingRepository: Repository<NowPlayingEntity>,
  ) {}

  async upsertNowPlaying(params: {
    languageSymbol: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    url: string;
    length?: string;
  }): Promise<void> {
    const languageSymbol = (params.languageSymbol ?? '').trim();
    const title = (params.title ?? '').trim();
    const url = (params.url ?? '').trim();
    const description = typeof params.description === 'string' ? params.description : undefined;
    const thumbnailUrl = typeof params.thumbnailUrl === 'string' ? params.thumbnailUrl : undefined;
    
    if (!languageSymbol || !title || !url) return;

    // Check if record exists
    const existing = await this.nowPlayingRepository.findOne({
      where: { languageSymbol, url }
    });

    if (existing) {
      // Update existing record
      existing.title = title;
      if (description) existing.description = description;
      if (thumbnailUrl) existing.thumbnailUrl = thumbnailUrl;
      if (params.length) existing.length = params.length;
      existing.updatedAt = new Date();
      await this.nowPlayingRepository.save(existing);
    } else {
      // Create new record
      const newRecord = this.nowPlayingRepository.create({
        languageSymbol,
        title,
        description,
        thumbnailUrl,
        url,
        length: params.length,
      });
      await this.nowPlayingRepository.save(newRecord);

      // Enforce capacity limit
      await this.enforceCapacityLimit(languageSymbol);
    }
  }

  async getNowPlaying(languageSymbol: string): Promise<NowPlayingItem[]> {
    const records = await this.nowPlayingRepository.find({
      where: { languageSymbol: languageSymbol.trim().toLowerCase() },
      order: { updatedAt: 'DESC' },
      take: this.maxPerLanguage,
    });

    return records.map(record => ({
      languageSymbol: record.languageSymbol,
      title: record.title,
      description: record.description,
      thumbnailUrl: record.thumbnailUrl,
      url: record.url,
      length: record.length,
      updated_at: record.updatedAt.getTime(),
    }));
  }

  async getAllNowPlaying(): Promise<Record<string, NowPlayingItem[]>> {
    const records = await this.nowPlayingRepository.find({
      order: { updatedAt: 'DESC' },
    });

    const result: Record<string, NowPlayingItem[]> = {};
    
    for (const record of records) {
      if (!result[record.languageSymbol]) {
        result[record.languageSymbol] = [];
      }
      
      if (result[record.languageSymbol].length < this.maxPerLanguage) {
        result[record.languageSymbol].push({
          languageSymbol: record.languageSymbol,
          title: record.title,
          description: record.description,
          thumbnailUrl: record.thumbnailUrl,
          url: record.url,
          length: record.length,
          updated_at: record.updatedAt.getTime(),
        });
      }
    }

    return result;
  }

  private async enforceCapacityLimit(languageSymbol: string): Promise<void> {
    const count = await this.nowPlayingRepository.count({
      where: { languageSymbol }
    });

    if (count > this.maxPerLanguage) {
      const recordsToDelete = await this.nowPlayingRepository.find({
        where: { languageSymbol },
        order: { updatedAt: 'ASC' },
        skip: this.maxPerLanguage,
      });

      if (recordsToDelete.length > 0) {
        await this.nowPlayingRepository.remove(recordsToDelete);
      }
    }
  }
}
