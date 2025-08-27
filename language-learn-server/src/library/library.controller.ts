import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { LibraryService } from '../database/services/library.service';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // Library Items
  @Get('items')
  async getAllLibraryItems() {
    return this.libraryService.getAllLibraryItems();
  }

  @Get('items/language/:languageId')
  async getLibraryItemsByLanguage(@Param('languageId') languageId: number) {
    return this.libraryService.getLibraryItemsByLanguage(languageId);
  }

  @Get('items/level/:levelId')
  async getLibraryItemsByLevel(@Param('levelId') levelId: number) {
    return this.libraryService.getLibraryItemsByLevel(levelId);
  }

  @Get('items/type/:typeId')
  async getLibraryItemsByType(@Param('typeId') typeId: number) {
    return this.libraryService.getLibraryItemsByType(typeId);
  }

  @Get('items/media/:mediaId')
  async getLibraryItemsByMedia(@Param('mediaId') mediaId: number) {
    return this.libraryService.getLibraryItemsByMedia(mediaId);
  }

  @Post('items')
  async createLibraryItem(@Body() libraryItemData: any) {
    return this.libraryService.createLibraryItem(libraryItemData);
  }

  @Put('items/:id')
  async updateLibraryItem(@Param('id') id: number, @Body() libraryItemData: any) {
    return this.libraryService.updateLibraryItem(id, libraryItemData);
  }

  @Delete('items/:id')
  async deleteLibraryItem(@Param('id') id: number) {
    return this.libraryService.deleteLibraryItem(id);
  }

  // Item Types
  @Get('item-types')
  async getAllItemTypes() {
    return this.libraryService.getAllItemTypes();
  }

  @Post('item-types')
  async createItemType(@Body() itemTypeData: any) {
    return this.libraryService.createItemType(itemTypeData);
  }

  // Levels
  @Get('levels')
  async getAllLevels() {
    return this.libraryService.getAllLevels();
  }

  @Post('levels')
  async createLevel(@Body() levelData: any) {
    return this.libraryService.createLevel(levelData);
  }

  // Languages
  @Get('languages')
  async getAllLanguages() {
    return this.libraryService.getAllLanguages();
  }

  @Post('languages')
  async createLanguage(@Body() languageData: any) {
    return this.libraryService.createLanguage(languageData);
  }

  // Media
  @Get('media')
  async getAllMedia() {
    return this.libraryService.getAllMedia();
  }

  @Post('media')
  async createMedia(@Body() mediaData: any) {
    return this.libraryService.createMedia(mediaData);
  }
}
