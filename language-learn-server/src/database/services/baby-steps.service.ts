import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BabyStep } from '../entities/baby-step.entity';
import { BabyStepItem } from '../entities/baby-step-item.entity';
import { Language } from '../entities/language.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BabyStepsService {
  constructor(
    @InjectRepository(BabyStep)
    private babyStepRepository: Repository<BabyStep>,
    @InjectRepository(BabyStepItem)
    private babyStepItemRepository: Repository<BabyStepItem>,
    @InjectRepository(Language)
    private languageRepository: Repository<Language>,
  ) {}

  async migrateAllBabySteps(): Promise<void> {
    const babyStepsDir = path.join(process.cwd(), 'src', 'baby-steps');
    
    // Get all language directories
    const languageDirs = fs.readdirSync(babyStepsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'index.json')
      .map(dirent => dirent.name);

    console.log(`Found ${languageDirs.length} language directories:`, languageDirs);

    for (const languageDir of languageDirs) {
      await this.migrateLanguageBabySteps(languageDir);
    }
  }

  async migrateLanguageBabySteps(languageSymbol: string): Promise<void> {
    console.log(`Migrating baby steps for language: ${languageSymbol}`);
    
    // Find or create language
    let language = await this.languageRepository.findOne({ where: { symbol: languageSymbol } });
    if (!language) {
      language = this.languageRepository.create({
        symbol: languageSymbol,
        name: this.getLanguageName(languageSymbol)
      });
      language = await this.languageRepository.save(language);
      console.log(`Created language: ${language.name} (${language.symbol})`);
    }

    const languageDir = path.join(process.cwd(), 'src', 'baby-steps', languageSymbol);
    const indexFilePath = path.join(languageDir, 'index.json');

    if (!fs.existsSync(indexFilePath)) {
      console.log(`Index file not found for language: ${languageSymbol}`);
      return;
    }

    try {
      const indexData = JSON.parse(fs.readFileSync(indexFilePath, 'utf8'));
      
      for (const stepMeta of indexData.steps) {
        await this.migrateStep(language.id, languageDir, stepMeta);
      }

      console.log(`Completed migration for language: ${languageSymbol}`);
    } catch (error) {
      console.error(`Error migrating language ${languageSymbol}:`, error);
    }
  }

  private async migrateStep(languageId: number, languageDir: string, stepMeta: any): Promise<void> {
    const stepFilePath = path.join(languageDir, stepMeta.file);
    
    if (!fs.existsSync(stepFilePath)) {
      console.log(`Step file not found: ${stepMeta.file}`);
      return;
    }

    try {
      const stepData = JSON.parse(fs.readFileSync(stepFilePath, 'utf8'));
      
      // Check if step already exists
      let babyStep = await this.babyStepRepository.findOne({ 
        where: { stepId: stepMeta.id, languageId } 
      });

      if (babyStep) {
        console.log(`Step ${stepMeta.id} already exists, skipping...`);
        return;
      }

      // Create baby step
      babyStep = this.babyStepRepository.create({
        stepId: stepMeta.id,
        title: stepMeta.title,
        emoji: stepMeta.emoji,
        languageId: languageId,
        languageName: stepData.language || null,
        overview: stepData.overview || null
      });

      babyStep = await this.babyStepRepository.save(babyStep);

      // Create baby step items
      if (stepData.items && Array.isArray(stepData.items)) {
        for (const item of stepData.items) {
          const babyStepItem = this.babyStepItemRepository.create({
            itemId: item.id,
            type: item.type,
            text: item.text,
            practiceType: item.practiceType,
            babyStepId: babyStep.id
          });

          await this.babyStepItemRepository.save(babyStepItem);
        }
      }

      console.log(`Migrated step: ${stepMeta.id} with ${stepData.items?.length || 0} items`);
    } catch (error) {
      console.error(`Error migrating step ${stepMeta.id}:`, error);
    }
  }

  private getLanguageName(symbol: string): string {
    const languageNames: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'hi': 'Hindi',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'uk': 'Ukrainian',
      'pl': 'Polish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'fi': 'Finnish',
      'el': 'Greek',
      'cs': 'Czech'
    };
    
    return languageNames[symbol] || symbol.toUpperCase();
  }

  async getSteps(languageSymbol: string): Promise<BabyStep[]> {
    const language = await this.languageRepository.findOne({ where: { symbol: languageSymbol } });
    if (!language) {
      return [];
    }

    return this.babyStepRepository.find({
      where: { languageId: language.id },
      relations: ['items'],
      order: { stepId: 'ASC' }
    });
  }

  async getSpecificStep(languageSymbol: string, stepId: string): Promise<BabyStep | null> {
    const language = await this.languageRepository.findOne({ where: { symbol: languageSymbol } });
    if (!language) {
      return null;
    }

    return this.babyStepRepository.findOne({
      where: { stepId, languageId: language.id },
      relations: ['items']
    });
  }
}
