import { Body, Controller, Post } from '@nestjs/common';
import { BabyStepsService } from './baby-steps.service';
import type { StepsFile } from './baby-steps.service';

@Controller('baby-steps')
export class BabyStepsController {
  constructor(private readonly babyStepsService: BabyStepsService) {}

  // POST /baby-steps/get
  @Post('get')
  async get(@Body() body: { language: string }): Promise<StepsFile> {
    const lang = (body?.language ?? 'en');
    return await this.babyStepsService.getSteps(lang);
  }

  // POST /baby-steps/get-step
  @Post('get-step')
  async getStep(@Body() body: { language: string; stepId: string }): Promise<any> {
    const lang = (body?.language ?? 'en');
    const stepId = body?.stepId;
    if (!stepId) {
      throw new Error('stepId is required');
    }
    return await this.babyStepsService.getSpecificStep(lang, stepId);
  }
}


