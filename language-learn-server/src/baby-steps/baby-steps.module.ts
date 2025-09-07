import { Module } from '@nestjs/common';
import { BabyStepsController } from './baby-steps.controller';
import { BabyStepsService } from './baby-steps.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BabyStepsController],
  providers: [BabyStepsService],
  exports: [BabyStepsService],
})
export class BabyStepsModule {}
