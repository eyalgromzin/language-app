import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

type StepItem = {
  id: string;
  title: string;
  items: any[];
  emoji?: string;
};

export type StepsFile = {
  language: string;
  overview?: string;
  steps: StepItem[];
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

  private loadStepsFile(filePath: string): StepsFile | null {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(raw);
      return json as StepsFile;
    } catch (e) {
      return null;
    }
  }

  getSteps(languageOrSymbol: string): StepsFile {
    const symbol = this.resolveSymbol(languageOrSymbol);
    
    // Special handling for expanded Spanish steps
    if (symbol === 'es') {
      const wordsFilePath = path.join(process.cwd(), 'src', 'baby-steps', 'steps_es_expanded_words.json');
      const sentencesFilePath = path.join(process.cwd(), 'src', 'baby-steps', 'steps_es_expanded_sentences.json');
      
      const wordsFile = this.loadStepsFile(wordsFilePath);
      const sentencesFile = this.loadStepsFile(sentencesFilePath);
      
      if (wordsFile && sentencesFile) {
        // Combine words and sentences, ensuring each step has exactly 10 words and 10 sentences
        const combinedSteps = wordsFile.steps.map((wordStep, index) => {
          const sentenceStep = sentencesFile.steps[index];
          if (sentenceStep) {
            // Combine items and shuffle them
            const combinedItems = [...wordStep.items, ...sentenceStep.items];
            const shuffledItems = this.shuffleArray(combinedItems);
            
            return {
              ...wordStep,
              items: shuffledItems
            };
          }
          return wordStep;
        });
        
        return {
          language: wordsFile.language,
          overview: wordsFile.overview,
          steps: combinedSteps
        };
      }
    }
    
    // Default behavior for other languages
    const filePath = path.join(process.cwd(), 'src', 'baby-steps', `steps_${symbol}.json`);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`Steps file not found for language: ${languageOrSymbol}`);
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(raw);
      return json as StepsFile;
    } catch (e) {
      throw new BadRequestException('Failed to read steps file');
    }
  }
}


