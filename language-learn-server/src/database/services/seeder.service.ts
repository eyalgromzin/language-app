import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemType } from '../entities/item-type.entity';
import { Level } from '../entities/level.entity';
import { Language } from '../entities/language.entity';
import { Media } from '../entities/media.entity';
import { LibraryItem } from '../entities/library-item.entity';
import { NowPlaying } from '../entities/now-playing.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(ItemType)
    private itemTypeRepository: Repository<ItemType>,
    @InjectRepository(Level)
    private levelRepository: Repository<Level>,
    @InjectRepository(Language)
    private languageRepository: Repository<Language>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    @InjectRepository(LibraryItem)
    private libraryItemRepository: Repository<LibraryItem>,
    @InjectRepository(NowPlaying)
    private nowPlayingRepository: Repository<NowPlaying>,
  ) {}

  async seedAllTables(): Promise<void> {
    console.log('Starting database seeding...');
    
    try {
      await this.seedItemTypes();
      await this.seedLevels();
      await this.seedLanguages();
      await this.seedMedia();
      await this.seedLibraryItems();
      await this.seedNowPlaying();
      
      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Error during database seeding:', error);
      throw error;
    }
  }

  private async seedItemTypes(): Promise<void> {
    const count = await this.itemTypeRepository.count();
    if (count === 0) {
      console.log('Seeding item_types table...');
      const data = this.loadJsonFile('item-types.json');
      await this.itemTypeRepository.save(data);
      console.log(`Inserted ${data.length} item types`);
    } else {
      console.log('item_types table already has data, skipping...');
    }
  }

  private async seedLevels(): Promise<void> {
    const count = await this.levelRepository.count();
    if (count === 0) {
      console.log('Seeding levels table...');
      const data = this.loadJsonFile('levels.json');
      await this.levelRepository.save(data);
      console.log(`Inserted ${data.length} levels`);
    } else {
      console.log('levels table already has data, skipping...');
    }
  }

  private async seedLanguages(): Promise<void> {
    const count = await this.languageRepository.count();
    if (count === 0) {
      console.log('Seeding languages table...');
      const data = this.loadJsonFile('languages.json');
      await this.languageRepository.save(data);
      console.log(`Inserted ${data.length} languages`);
    } else {
      console.log('languages table already has data, skipping...');
    }
  }

  private async seedMedia(): Promise<void> {
    const count = await this.mediaRepository.count();
    if (count === 0) {
      console.log('Seeding media table...');
      const data = this.loadJsonFile('media.json');
      await this.mediaRepository.save(data);
      console.log(`Inserted ${data.length} media types`);
    } else {
      console.log('media table already has data, skipping...');
    }
  }

  private async seedLibraryItems(): Promise<void> {
    const count = await this.libraryItemRepository.count();
    if (count === 0) {
      console.log('Seeding library_items table...');
      const data = this.loadJsonFile('library-items.json');
      await this.libraryItemRepository.save(data);
      console.log(`Inserted ${data.length} library items`);
    } else {
      console.log('library_items table already has data, skipping...');
    }
  }

  private async seedNowPlaying(): Promise<void> {
    const count = await this.nowPlayingRepository.count();
    if (count === 0) {
      console.log('Seeding now_playing table...');
      const data = this.loadJsonFile('now-playing.json');
      await this.nowPlayingRepository.save(data);
      console.log(`Inserted ${data.length} now playing items`);
    } else {
      console.log('now_playing table already has data, skipping...');
    }
  }

  private loadJsonFile(filename: string): any[] {
    const filePath = path.join(__dirname, '../../../data/seeds', filename);
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error loading JSON file ${filename}:`, error);
      throw new Error(`Failed to load seed data from ${filename}`);
    }
  }

  async checkTableStatus(): Promise<Record<string, number>> {
    const status = {
      itemTypes: await this.itemTypeRepository.count(),
      levels: await this.levelRepository.count(),
      languages: await this.languageRepository.count(),
      media: await this.mediaRepository.count(),
      libraryItems: await this.libraryItemRepository.count(),
      nowPlaying: await this.nowPlayingRepository.count(),
    };

    console.log('Database table status:', status);
    return status;
  }
}
