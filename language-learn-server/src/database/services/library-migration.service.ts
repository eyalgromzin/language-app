import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemType, Level, Language, Media, LibraryItem } from '../entities';
const libraryData = require('../../library/library.json');

@Injectable()
export class LibraryMigrationService {
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
  ) {}

  async migrateLibraryData(): Promise<void> {
    console.log('Starting library data migration...');

    // Migrate item types
    await this.migrateItemTypes();
    
    // Migrate levels
    await this.migrateLevels();
    
    // Migrate languages
    await this.migrateLanguages();
    
    // Migrate media
    await this.migrateMedia();
    
    // Migrate library items
    await this.migrateLibraryItems();

    console.log('Library data migration completed successfully!');
  }

  private async migrateItemTypes(): Promise<void> {
    console.log('Migrating item types...');
    for (const itemType of libraryData.itemTypes) {
      const existing = await this.itemTypeRepository.findOne({ where: { id: itemType.id } });
      if (!existing) {
        await this.itemTypeRepository.save(itemType);
      }
    }
  }

  private async migrateLevels(): Promise<void> {
    console.log('Migrating levels...');
    for (const level of libraryData.levels) {
      const existing = await this.levelRepository.findOne({ where: { id: level.id } });
      if (!existing) {
        await this.levelRepository.save(level);
      }
    }
  }

  private async migrateLanguages(): Promise<void> {
    console.log('Migrating languages...');
    for (const language of libraryData.languages) {
      const existing = await this.languageRepository.findOne({ where: { id: language.id } });
      if (!existing) {
        await this.languageRepository.save(language);
      }
    }
  }

  private async migrateMedia(): Promise<void> {
    console.log('Migrating media...');
    for (const media of libraryData.media) {
      const existing = await this.mediaRepository.findOne({ where: { id: media.id } });
      if (!existing) {
        await this.mediaRepository.save(media);
      }
    }
  }

  private async migrateLibraryItems(): Promise<void> {
    console.log('Migrating library items...');
    for (const item of libraryData.library) {
      // Find the corresponding IDs
      const language = await this.languageRepository.findOne({ where: { symbol: item.language } });
      const media = await this.mediaRepository.findOne({ where: { name: item.media } });
      
      // Handle level mapping (some items use string names instead of IDs)
      let levelId: number;
      if (typeof item.level === 'string') {
        const level = await this.levelRepository.findOne({ where: { name: item.level } });
        levelId = level?.id || 1; // Default to easy if not found
      } else {
        levelId = item.level;
      }

      const libraryItem = {
        url: item.url,
        name: item.name,
        languageId: language?.id || 1, // Default to first language if not found
        typeId: item.typeId,
        levelId: levelId,
        mediaId: media?.id || 1, // Default to web if not found
      };

      const existing = await this.libraryItemRepository.findOne({ 
        where: { url: item.url, name: item.name } 
      });
      
      if (!existing) {
        await this.libraryItemRepository.save(libraryItem);
      }
    }
  }
}
