import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from './database/entities';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Language)
    private languageRepository: Repository<Language>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  // Languages
  async getAllLanguages() {
    return this.languageRepository.find();
  }

  async createLanguage(languageData: Partial<Language>) {
    const language = this.languageRepository.create(languageData);
    return this.languageRepository.save(language);
  }

  // Language utilities
  async getLanguageNameBySymbol(symbol: string): Promise<string | undefined> {
    if (!symbol) return undefined;
    const language = await this.languageRepository.findOne({
      where: { symbol: symbol.trim().toLowerCase() }
    });
    return language?.name;
  }
}
