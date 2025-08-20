import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

type StartupVideoResult = {
  url: string;
  thumbnail: string | null;
  title: string;
  description?: string;
  length?: string;
};

type StartupVideosEntry = {
  query: string;
  results: StartupVideoResult[];
  timestamp: number;
};

type CacheShape = Record<string, StartupVideosEntry>;

@Injectable()
export class VideoCacheService {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly cacheFilePath = path.join(this.dataDir, 'video_startup_cache.json');
  private readonly ttlMs = 24 * 60 * 60 * 1000; // 1 day

  private cache: CacheShape = {};
  private initialized = false;
  private initializePromise: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (!this.initializePromise) {
      this.initializePromise = this.loadFromDisk();
    }
    await this.initializePromise;
    this.initialized = true;
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const buf = await fs.readFile(this.cacheFilePath, 'utf8');
      const parsed = JSON.parse(buf);
      if (parsed && typeof parsed === 'object') {
        this.cache = parsed as CacheShape;
      } else {
        this.cache = {};
      }
    } catch {
      this.cache = {};
    }
  }

  private async persist(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      const tmpPath = `${this.cacheFilePath}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(this.cache, null, 2), 'utf8');
      await fs.rename(tmpPath, this.cacheFilePath);
    } catch {
      // ignore persistence errors
    }
  }

  private normalizeLanguage(language: string): string {
    return language.trim().toLowerCase();
  }

  async getCachedStartupVideos(language: string): Promise<{ query: string; results: StartupVideoResult[] } | null> {
    const key = this.normalizeLanguage(language);
    await this.ensureInitialized();
    const entry = this.cache[key];
    if (!entry) return null;
    const isFresh = Date.now() - entry.timestamp < this.ttlMs;
    if (!isFresh) return null;
    return { query: entry.query, results: entry.results };
  }

  async setCachedStartupVideos(language: string, query: string, results: StartupVideoResult[]): Promise<void> {
    const key = this.normalizeLanguage(language);
    await this.ensureInitialized();
    this.cache[key] = { query, results, timestamp: Date.now() };
    await this.persist();
  }
}


