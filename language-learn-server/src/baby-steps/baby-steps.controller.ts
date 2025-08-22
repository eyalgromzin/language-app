import { Body, Controller, Post } from '@nestjs/common';
import { BabyStepsService } from './baby-steps.service';
import type { StepsFile } from './baby-steps.service';

@Controller('baby-steps')
export class BabyStepsController {
  constructor(private readonly babyStepsService: BabyStepsService) {}

  // POST /baby-steps/get
  @Post('get')
  get(@Body() body: { language: string }): StepsFile {
    const lang = (body?.language ?? 'en');
    return this.babyStepsService.getSteps(lang);
  }
}


