import { Injectable, BadRequestException } from '@nestjs/common';
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
  private resolveSymbol(languageOrSymbol: string): string {
    const v = (languageOrSymbol || '').trim().toLowerCase();
    if (!v) return 'en';
    // Accept common names or symbols
    if (v === 'en' || v === 'english') return 'en';
    if (v === 'es' || v === 'spanish' || v === 'español' || v === 'espanol') return 'es';
    return v;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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

  getSteps(languageOrSymbol: string): StepsFile {
    const symbol = this.resolveSymbol(languageOrSymbol);
    
    // Read the index.json file from the language symbol folder
    const indexFilePath = path.join(process.cwd(), 'src', 'baby-steps', symbol, 'index.json');
    if (!fs.existsSync(indexFilePath)) {
      throw new BadRequestException(`Index file not found for language: ${languageOrSymbol}`);
    }
    
    try {
      // Read and return the index.json file directly
      const indexRaw = fs.readFileSync(indexFilePath, 'utf8');
      const indexData = JSON.parse(indexRaw);
      
      return indexData as StepsFile;
    } catch (e) {
      throw new BadRequestException(`Failed to read steps for language: ${languageOrSymbol}`);
    }
  }

  getSpecificStep(languageOrSymbol: string, stepId: string): any {
    const symbol = this.resolveSymbol(languageOrSymbol);
    
    // First, read the index.json to find the step file
    const indexFilePath = path.join(process.cwd(), 'src', 'baby-steps', symbol, 'index.json');
    if (!fs.existsSync(indexFilePath)) {
      throw new BadRequestException(`Index file not found for language: ${languageOrSymbol}`);
    }
    
    try {
      const indexRaw = fs.readFileSync(indexFilePath, 'utf8');
      const indexData = JSON.parse(indexRaw);
      
      // Find the step with the matching ID
      const stepMeta = indexData.steps.find((step: any) => step.id === stepId);
      if (!stepMeta) {
        throw new BadRequestException(`Step not found: ${stepId}`);
      }
      
      // Read the specific step file
      if (stepMeta.file) {
        const stepFilePath = path.join(process.cwd(), 'src', 'baby-steps', symbol, stepMeta.file);
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


