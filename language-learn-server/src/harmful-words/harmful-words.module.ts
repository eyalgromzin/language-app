import { Module } from '@nestjs/common';
import { HarmfulWordsController } from './harmful-words.controller';
import { HarmfulWordsService } from './harmful-words.service';

@Module({
  controllers: [HarmfulWordsController],
  providers: [HarmfulWordsService],
  exports: [HarmfulWordsService],
})
export class HarmfulWordsModule {}
