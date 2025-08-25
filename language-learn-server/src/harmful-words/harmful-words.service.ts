import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class HarmfulWordsService {
  private harmfulWords: string[] = [];

  constructor() {
    this.loadHarmfulWords();
  }

  private loadHarmfulWords(): void {
    try {
      const filePath = path.join(process.cwd(), 'harmfulWords.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      this.harmfulWords = JSON.parse(fileContent);
    } catch (error) {
      console.error('Failed to load harmful words from JSON file:', error);
      this.harmfulWords = [];
    }
  }

  getHarmfulWords(): string[] {
    return [...this.harmfulWords];
  }
}
