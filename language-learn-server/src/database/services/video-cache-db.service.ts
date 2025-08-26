import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoCacheEntity } from '../entities/video-cache.entity';

type StartupVideoResult = {
  url: string;
  thumbnail: string | null;
  title: string;
  description?: string;
  length?: string;
};

@Injectable()
export class VideoCacheDbService {
  private readonly ttlMs = 24 * 60 * 60 * 1000; // 1 day

  constructor(
    @InjectRepository(VideoCacheEntity)
    private videoCacheRepository: Repository<VideoCacheEntity>,
  ) {}

  async getCachedStartupVideos(language: string): Promise<{ query: string; results: StartupVideoResult[] } | null> {
    const key = this.normalizeLanguage(language);
    
    const record = await this.videoCacheRepository.findOne({
      where: { language: key }
    });

    if (!record) return null;

    // Check if cache is still fresh
    const isFresh = Date.now() - record.createdAt.getTime() < this.ttlMs;
    if (!isFresh) {
      // Remove expired cache
      await this.videoCacheRepository.remove(record);
      return null;
    }

    return {
      query: record.query,
      results: record.results,
    };
  }

  async setCachedStartupVideos(language: string, query: string, results: StartupVideoResult[]): Promise<void> {
    const key = this.normalizeLanguage(language);

    // Check if record already exists
    const existing = await this.videoCacheRepository.findOne({
      where: { language: key }
    });

    if (existing) {
      // Update existing record
      existing.query = query;
      existing.results = results;
      existing.createdAt = new Date();
      await this.videoCacheRepository.save(existing);
    } else {
      // Create new record
      const newRecord = this.videoCacheRepository.create({
        language: key,
        query,
        results,
      });
      await this.videoCacheRepository.save(newRecord);
    }
  }

  private normalizeLanguage(language: string): string {
    return language.trim().toLowerCase();
  }
}
