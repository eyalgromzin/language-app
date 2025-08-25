import { Controller, Get } from '@nestjs/common';
import { HarmfulWordsService } from './harmful-words.service';

@Controller('harmful-words')
export class HarmfulWordsController {
  constructor(private readonly harmfulWordsService: HarmfulWordsService) {}

  @Get()
  getHarmfulWords(): string[] {
    console.log('[Server] getHarmfulWords endpoint called');
    const words = this.harmfulWordsService.getHarmfulWords();
    console.log('[Server] Returning', words.length, 'harmful words');
    return words;
  }
}
