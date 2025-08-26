import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WordCacheEntity } from '../entities/word-cache.entity';
import { TranslationCacheEntity } from '../entities/translation-cache.entity';

@Injectable()
export class WordCacheDbService {
  private readonly maxEntries = 500;

  constructor(
    @InjectRepository(WordCacheEntity)
    private wordCacheRepository: Repository<WordCacheEntity>,
    @InjectRepository(TranslationCacheEntity)
    private translationCacheRepository: Repository<TranslationCacheEntity>,
  ) {}

  async record(word: string | null | undefined): Promise<void> {
    const normalized = typeof word === 'string' ? word.trim() : '';
    if (!normalized) return;

    // Check if word already exists
    const existing = await this.wordCacheRepository.findOne({
      where: { word: normalized }
    });

    if (existing) {
      // Update timestamp by deleting and recreating (to move to top)
      await this.wordCacheRepository.remove(existing);
    }

    // Create new record
    const newRecord = this.wordCacheRepository.create({
      word: normalized,
    });
    await this.wordCacheRepository.save(newRecord);

    // Enforce capacity limit
    await this.enforceCapacityLimit();
  }

  async getLastWords(): Promise<string[]> {
    const records = await this.wordCacheRepository.find({
      order: { createdAt: 'DESC' },
      take: this.maxEntries,
    });

    return records.map(record => record.word);
  }

  async getCachedTranslation(word: string, from: string, to: string): Promise<string | null> {
    const w = word.trim();
    const f = from.trim();
    const t = to.trim();
    
    if (!w || !f || !t) return null;

    const record = await this.translationCacheRepository.findOne({
      where: { word: w, fromLanguage: f, toLanguage: t }
    });

    return record ? record.translation : null;
  }

  async setCachedTranslation(word: string, from: string, to: string, translation: string): Promise<void> {
    const w = word.trim();
    const f = from.trim();
    const t = to.trim();
    const tr = translation.trim();
    
    if (!w || !f || !t || !tr) return;

    // Check if translation already exists
    const existing = await this.translationCacheRepository.findOne({
      where: { word: w, fromLanguage: f, toLanguage: t }
    });

    if (existing) {
      // Update existing translation
      existing.translation = tr;
      existing.createdAt = new Date();
      await this.translationCacheRepository.save(existing);
    } else {
      // Create new translation record
      const newRecord = this.translationCacheRepository.create({
        word: w,
        fromLanguage: f,
        toLanguage: t,
        translation: tr,
      });
      await this.translationCacheRepository.save(newRecord);
    }

    // Enforce capacity limit for translations
    await this.enforceTranslationCapacityLimit();
  }

  private async enforceCapacityLimit(): Promise<void> {
    const count = await this.wordCacheRepository.count();

    if (count > this.maxEntries) {
      const recordsToDelete = await this.wordCacheRepository.find({
        order: { createdAt: 'ASC' },
        skip: this.maxEntries,
      });

      if (recordsToDelete.length > 0) {
        await this.wordCacheRepository.remove(recordsToDelete);
      }
    }
  }

  private async enforceTranslationCapacityLimit(): Promise<void> {
    const count = await this.translationCacheRepository.count();

    if (count > this.maxEntries) {
      const recordsToDelete = await this.translationCacheRepository.find({
        order: { createdAt: 'ASC' },
        skip: this.maxEntries,
      });

      if (recordsToDelete.length > 0) {
        await this.translationCacheRepository.remove(recordsToDelete);
      }
    }
  }
}
