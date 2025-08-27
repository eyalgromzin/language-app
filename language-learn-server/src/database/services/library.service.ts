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
}
