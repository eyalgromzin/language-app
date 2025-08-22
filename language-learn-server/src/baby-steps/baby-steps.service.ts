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

  getSteps(languageOrSymbol: string): StepsFile {
    const symbol = this.resolveSymbol(languageOrSymbol);
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


