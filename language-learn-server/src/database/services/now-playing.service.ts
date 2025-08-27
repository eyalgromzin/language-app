import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NowPlaying } from '../entities/now-playing.entity';
import { Language } from '../entities/language.entity';

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
export class NowPlayingService {
  private readonly maxPerLanguage = 20;

  constructor(
    @InjectRepository(NowPlaying)
    private nowPlayingRepository: Repository<NowPlaying>,
    @InjectRepository(Language)
    private languageRepository: Repository<Language>,
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
    const length = typeof params.length === 'string' ? params.length : undefined;

    if (!languageSymbol || !title || !url) return;

    // Find the language by symbol
    const language = await this.languageRepository.findOne({
      where: { symbol: languageSymbol.toLowerCase() }
    });

    if (!language) {
      console.warn(`Language with symbol ${languageSymbol} not found`);
      return;
    }

    // Check if video already exists
    const existing = await this.nowPlayingRepository.findOne({
      where: { url }
    });

    if (existing) {
      // Update existing record
      existing.title = title;
      if (description) existing.description = description;
      if (thumbnailUrl) existing.thumbnailUrl = thumbnailUrl;
      if (length) existing.length = length;
      existing.updatedAt = new Date();
      await this.nowPlayingRepository.save(existing);
    } else {
      // Create new record
      const newNowPlaying = this.nowPlayingRepository.create({
        url,
        title,
        description,
        thumbnailUrl,
        length,
        languageId: language.id,
      });
      await this.nowPlayingRepository.save(newNowPlaying);

      // Enforce max 20 videos per language
      await this.enforceMaxPerLanguage(language.id);
    }
  }

  private async enforceMaxPerLanguage(languageId: number): Promise<void> {
    const count = await this.nowPlayingRepository.count({
      where: { languageId }
    });

    if (count > this.maxPerLanguage) {
      // Get the oldest videos beyond the limit
      const toDelete = await this.nowPlayingRepository.find({
        where: { languageId },
        order: { updatedAt: 'ASC' },
        skip: this.maxPerLanguage,
      });

      if (toDelete.length > 0) {
        await this.nowPlayingRepository.remove(toDelete);
      }
    }
  }

  async getNowPlaying(languageSymbol: string): Promise<NowPlayingItem[]> {
    const language = await this.languageRepository.findOne({
      where: { symbol: languageSymbol.toLowerCase() }
    });

    if (!language) {
      return [];
    }

    const videos = await this.nowPlayingRepository.find({
      where: { languageId: language.id },
      order: { updatedAt: 'DESC' },
      take: this.maxPerLanguage,
    });

    return videos.map(video => ({
      languageSymbol: language.symbol,
      title: video.title,
      description: video.description,
      thumbnailUrl: video.thumbnailUrl,
      url: video.url,
      length: video.length,
      updated_at: video.updatedAt.getTime(),
    }));
  }

  async getAllNowPlaying(): Promise<Record<string, NowPlayingItem[]>> {
    const languages = await this.languageRepository.find();
    const result: Record<string, NowPlayingItem[]> = {};

    for (const language of languages) {
      result[language.symbol] = await this.getNowPlaying(language.symbol);
    }

    return result;
  }
}
