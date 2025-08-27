import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemType, Level, Language, Media, LibraryItem } from '../entities';

@Injectable()
export class LibraryService {
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

  // Library Items
  async getAllLibraryItems() {
    return this.libraryItemRepository.find({
      relations: ['language', 'itemType', 'level', 'media'],
    });
  }

  async getLibraryItemsByLanguage(languageId: number) {
    return this.libraryItemRepository.find({
      where: { languageId },
      relations: ['language', 'itemType', 'level', 'media'],
    });
  }

  async getLibraryItemsByLevel(levelId: number) {
    return this.libraryItemRepository.find({
      where: { levelId },
      relations: ['language', 'itemType', 'level', 'media'],
    });
  }

  async getLibraryItemsByType(typeId: number) {
    return this.libraryItemRepository.find({
      where: { typeId },
      relations: ['language', 'itemType', 'level', 'media'],
    });
  }

  async getLibraryItemsByMedia(mediaId: number) {
    return this.libraryItemRepository.find({
      where: { mediaId },
      relations: ['language', 'itemType', 'level', 'media'],
    });
  }

  async createLibraryItem(libraryItemData: Partial<LibraryItem>) {
    const libraryItem = this.libraryItemRepository.create(libraryItemData);
    return this.libraryItemRepository.save(libraryItem);
  }

  async updateLibraryItem(id: number, libraryItemData: Partial<LibraryItem>) {
    await this.libraryItemRepository.update(id, libraryItemData);
    return this.libraryItemRepository.findOne({ where: { id } });
  }

  async deleteLibraryItem(id: number) {
    return this.libraryItemRepository.delete(id);
  }

  // Item Types
  async getAllItemTypes() {
    return this.itemTypeRepository.find();
  }

  async createItemType(itemTypeData: Partial<ItemType>) {
    const itemType = this.itemTypeRepository.create(itemTypeData);
    return this.itemTypeRepository.save(itemType);
  }

  // Levels
  async getAllLevels() {
    return this.levelRepository.find();
  }

  async createLevel(levelData: Partial<Level>) {
    const level = this.levelRepository.create(levelData);
    return this.levelRepository.save(level);
  }

  // Languages
  async getAllLanguages() {
    return this.languageRepository.find();
  }

  async createLanguage(languageData: Partial<Language>) {
    const language = this.languageRepository.create(languageData);
    return this.languageRepository.save(language);
  }

  // Media
  async getAllMedia() {
    return this.mediaRepository.find();
  }

  async createMedia(mediaData: Partial<Media>) {
    const media = this.mediaRepository.create(mediaData);
    return this.mediaRepository.save(media);
  }

  // Language utilities
  async getLanguageNameBySymbol(symbol: string): Promise<string | undefined> {
    if (!symbol) return undefined;
    const language = await this.languageRepository.findOne({
      where: { symbol: symbol.trim().toLowerCase() }
    });
    return language?.name;
  }

  // Frontend compatibility methods
  async getMeta(): Promise<{ itemTypes: string[]; levels: string[] }> {
    const [itemTypes, levels] = await Promise.all([
      this.itemTypeRepository.find(),
      this.levelRepository.find()
    ]);
    
    return {
      itemTypes: itemTypes.map(t => t.name),
      levels: levels.map(l => l.name)
    };
  }

  async getUrlsByLanguage(languageOrSymbol: string): Promise<{ url: string; name?: string; type: string; level: string; media: string }[]> {
    const language = await this.languageRepository.findOne({
      where: [
        { symbol: languageOrSymbol.trim().toLowerCase() },
        { name: languageOrSymbol.trim().toLowerCase() }
      ]
    });

    if (!language) {
      return [];
    }

    const libraryItems = await this.libraryItemRepository.find({
      where: { languageId: language.id },
      relations: ['language', 'itemType', 'level', 'media']
    });

    return libraryItems.map(item => ({
      url: item.url,
      name: item.name,
      type: item.itemType?.name || String(item.typeId),
      level: item.level?.name || String(item.levelId),
      media: item.media?.name || 'unknown'
    }));
  }

  async getUrlsWithCriteria(
    languageOrSymbol: string,
    level?: string | number,
    type?: string | number,
    media?: string,
  ): Promise<{ url: string; name?: string; type: string; level: string; media: string }[]> {
    if (!languageOrSymbol) {
      return [];
    }
    
    const language = await this.languageRepository.findOne({
      where: [
        { symbol: languageOrSymbol.trim().toLowerCase() },
        { name: languageOrSymbol.trim().toLowerCase() }
      ]
    });

    if (!language) {
      return [];
    }

    let query = this.libraryItemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.language', 'language')
      .leftJoinAndSelect('item.itemType', 'itemType')
      .leftJoinAndSelect('item.level', 'level')
      .leftJoinAndSelect('item.media', 'media')
      .where('item.languageId = :languageId', { languageId: language.id });

    if (level && level !== 'all') {
      if (typeof level === 'number') {
        query = query.andWhere('item.levelId = :levelId', { levelId: level });
      } else {
        const levelEntity = await this.levelRepository.findOne({
          where: { name: level.toLowerCase() }
        });
        if (levelEntity) {
          query = query.andWhere('item.levelId = :levelId', { levelId: levelEntity.id });
        }
      }
    }

    if (type && type !== 'all') {
      if (typeof type === 'number') {
        query = query.andWhere('item.typeId = :typeId', { typeId: type });
      } else {
        const typeEntity = await this.itemTypeRepository.findOne({
          where: { name: type.toLowerCase() }
        });
        if (typeEntity) {
          query = query.andWhere('item.typeId = :typeId', { typeId: typeEntity.id });
        }
      }
    }

    if (media && media !== 'all') {
      const mediaEntity = await this.mediaRepository.findOne({
        where: { name: media.toLowerCase() }
      });
      if (mediaEntity) {
        query = query.andWhere('item.mediaId = :mediaId', { mediaId: mediaEntity.id });
      }
    }

    const libraryItems = await query.getMany();

    return libraryItems.map(item => ({
      url: item.url,
      name: item.name,
      type: item.itemType?.name || String(item.typeId),
      level: item.level?.name || String(item.levelId),
      media: item.media?.name || 'unknown'
    }));
  }

  async addUrl(url: string, language: string, level: string | number, type: string | number, name: string, media: string): Promise<any> {
    if (!url || !language || !level || (type === undefined || type === null)) {
      throw new Error('Missing required fields: url, language, level, type');
    }

    const normalizedUrl = url.trim();
    const existing = await this.libraryItemRepository.findOne({
      where: { url: normalizedUrl }
    });
    
    if (existing) {
      return existing;
    }

    // Find language
    const languageEntity = await this.languageRepository.findOne({
      where: [
        { symbol: language.toLowerCase() },
        { name: language.toLowerCase() }
      ]
    });

    if (!languageEntity) {
      throw new Error(`Language not found: ${language}`);
    }

    // Find level
    let levelId: number;
    if (typeof level === 'number') {
      levelId = level;
    } else {
      const levelEntity = await this.levelRepository.findOne({
        where: { name: level.toLowerCase() }
      });
      if (!levelEntity) {
        throw new Error(`Level not found: ${level}`);
      }
      levelId = levelEntity.id;
    }

    // Find type
    let typeId: number;
    if (typeof type === 'number') {
      typeId = type;
    } else {
      const typeEntity = await this.itemTypeRepository.findOne({
        where: { name: type.toLowerCase() }
      });
      if (!typeEntity) {
        typeId = 1; // Default to first type if not found
      } else {
        typeId = typeEntity.id;
      }
    }

    // Find media
    let mediaId: number = 1; // Default to first media if not found
    if (media) {
      const mediaEntity = await this.mediaRepository.findOne({
        where: { name: media.toLowerCase() }
      });
      if (mediaEntity) {
        mediaId = mediaEntity.id;
      }
    }

    const newItem = this.libraryItemRepository.create({
      url: normalizedUrl,
      name,
      languageId: languageEntity.id,
      levelId,
      typeId,
      mediaId
    });

    return this.libraryItemRepository.save(newItem);
  }
}
