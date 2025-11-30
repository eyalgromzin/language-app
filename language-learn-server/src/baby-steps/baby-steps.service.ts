import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BabyStepsService as DatabaseBabyStepsService } from '../database/services/baby-steps.service';
import { Language } from '../database/entities/language.entity';
import * as fs from 'fs';
import * as path from 'path';

type StepItem = {
  id: string;
  title: string;
  emoji?: string;
  file?: string;
};

export type StepsFile = {
  language: string;
  overview?: string;
  steps: StepItem[];
};

type IndividualStepFile = {
  id: string;
  title: string;
  emoji?: string;
  language: string;
  items: Array<{
    id: string;
    type: string;
    text: string;
    practiceType: string;
  }>;
};

@Injectable()
export class BabyStepsService {
  private languageMap: Record<string, string> | null = null;
  private languageMapPromise: Promise<void> | null = null;

  constructor(
    @InjectRepository(Language)
    private languageRepository: Repository<Language>,
  ) {}

  private async loadLanguageMap(): Promise<void> {
    if (this.languageMap) {
      return;
    }

    if (this.languageMapPromise) {
      await this.languageMapPromise;
      return;
    }

    this.languageMapPromise = (async () => {
      try {
        const languages = await this.languageRepository.find();
        const map: Record<string, string> = {};
        
        languages.forEach(lang => {
          // Map both name (case-insensitive) and symbol to symbol
          const nameLower = lang.name.toLowerCase();
          const symbolLower = lang.symbol.toLowerCase();
          
          map[nameLower] = lang.symbol;
          map[symbolLower] = lang.symbol;
          
          // Also map capitalized name
          const nameCapitalized = lang.name.charAt(0).toUpperCase() + lang.name.slice(1).toLowerCase();
          map[nameCapitalized] = lang.symbol;
        });
        
        this.languageMap = map;
      } catch (error) {
        console.error('Failed to load language map:', error);
        // Fallback to empty map
        this.languageMap = {};
      }
    })();

    await this.languageMapPromise;
  }

  private async resolveSymbol(languageOrSymbol: string): Promise<string> {
    await this.loadLanguageMap();
    
    const v = (languageOrSymbol || '').trim();
    if (!v) return 'en';
    
    const vLower = v.toLowerCase();
    
    // Check if it's already a symbol in the map
    if (this.languageMap && this.languageMap[vLower]) {
      return this.languageMap[vLower];
    }
    
    // Check capitalized version
    const vCapitalized = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
    if (this.languageMap && this.languageMap[vCapitalized]) {
      return this.languageMap[vCapitalized];
    }
    
    // If it looks like a valid 2-letter code, return it as-is
    if (/^[a-z]{2}$/i.test(v)) {
      return vLower;
    }
    
    // Default to English if not found
    return 'en';
  }

  private loadStepsFile(filePath: string): IndividualStepFile | null {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(raw);
      return json as IndividualStepFile;
    } catch (e) {
      return null;
    }
  }

  async getSteps(languageOrSymbol: string): Promise<StepsFile> {
    const symbol = await this.resolveSymbol(languageOrSymbol);
    
    try {
      // Try to get from database first
      // const dbSteps = await this.databaseBabyStepsService.getSteps(symbol);
      
      // if (dbSteps && dbSteps.length > 0) {
      //   // Convert database format to StepsFile format
      //   return {
      //     language: symbol,
      //     overview: dbSteps[0]?.overview || '',
      //     steps: dbSteps.map(step => ({
      //       id: step.stepId,
      //       title: step.title,
      //       emoji: step.emoji,
      //       file: `${step.stepId}.json` // Keep file reference for compatibility
      //     }))
      //   };
      // }
      
      // Fallback to file system if no database data
      const indexFilePath = path.join(process.cwd(), 'src', 'data', 'baby-steps-json-files', symbol, 'index.json');
      if (!fs.existsSync(indexFilePath)) {
        throw new BadRequestException(`No data found for language: ${languageOrSymbol}`);
      }
      
      const indexRaw = fs.readFileSync(indexFilePath, 'utf8');
      const indexData = JSON.parse(indexRaw);
      
      return indexData as StepsFile;
    } catch (e) {
      throw new BadRequestException(`Failed to read steps for language: ${languageOrSymbol}`);
    }
  }

  async getSpecificStep(languageOrSymbol: string, stepId: string): Promise<any> {
    const symbol = await this.resolveSymbol(languageOrSymbol);
    
    try {
      // Try to get from database first
      // const dbStep = await this.databaseBabyStepsService.getSpecificStep(symbol, stepId);
      
      // if (dbStep) {
      //   // Convert database format to expected format
      //   return {
      //     id: dbStep.stepId,
      //     title: dbStep.title,
      //     emoji: dbStep.emoji,
      //     language: symbol,
      //     items: dbStep.items?.map(item => ({
      //       id: item.itemId,
      //       type: item.type,
      //       text: item.text,
      //       practiceType: item.practiceType
      //     })) || []
      //   };
      // }
      
      // Fallback to file system if no database data
      const indexFilePath = path.join(process.cwd(), 'src', 'data', 'baby-steps-json-files', symbol, 'index.json');
      if (!fs.existsSync(indexFilePath)) {
        throw new BadRequestException(`Index file not found for language: ${languageOrSymbol}`);
      }
      
      const indexRaw = fs.readFileSync(indexFilePath, 'utf8');
      const indexData = JSON.parse(indexRaw);
      
      // Find the step with the matching ID
      const stepMeta = indexData.steps.find((step: any) => step.id === stepId);
      if (!stepMeta) {
        throw new BadRequestException(`Step not found: ${stepId}`);
      }
      
      // Read the specific step file
      if (stepMeta.file) {
        const stepFilePath = path.join(process.cwd(), 'src', 'data', 'baby-steps-json-files', symbol, stepMeta.file);
        const stepFile = this.loadStepsFile(stepFilePath);
        if (stepFile && stepFile.items && stepFile.items.length > 0) {
          // Return the step with metadata merged
          return {
            ...stepMeta,
            items: stepFile.items || []
          };
        }
      }
      
      throw new BadRequestException(`Step file not found for step: ${stepId}`);
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new BadRequestException(`Failed to read step for language: ${languageOrSymbol}, step: ${stepId}`);
    }
  }
}


