import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TranslationEntity } from '../entities/translation.entity';

@Injectable()
export class TranslationDbService {
  constructor(
    @InjectRepository(TranslationEntity)
    private readonly translationRepository: Repository<TranslationEntity>,
  ) {}

  async findTranslation(word: string): Promise<TranslationEntity | null> {
    return this.translationRepository.findOne({
      where: { word: word.toLowerCase() }
    });
  }

  async createTranslation(word: string, languageCode: string, translation: string): Promise<TranslationEntity> {
    const translationEntity = new TranslationEntity();
    translationEntity.word = word.toLowerCase();
    translationEntity[languageCode] = translation;
    
    return this.translationRepository.save(translationEntity);
  }

  async updateTranslation(existingTranslation: TranslationEntity, languageCode: string, translation: string): Promise<TranslationEntity> {
    existingTranslation[languageCode] = translation;
    existingTranslation.updatedAt = new Date();
    
    return this.translationRepository.save(existingTranslation);
  }

  async getTranslation(word: string, languageCode: string): Promise<string | null> {
    const translation = await this.findTranslation(word);
    if (translation && translation[languageCode]) {
      return translation[languageCode];
    }
    return null;
  }

  async saveTranslation(word: string, languageCode: string, translation: string): Promise<void> {
    const existingTranslation = await this.findTranslation(word);
    
    if (existingTranslation) {
      await this.updateTranslation(existingTranslation, languageCode, translation);
    } else {
      await this.createTranslation(word, languageCode, translation);
    }
  }
}
