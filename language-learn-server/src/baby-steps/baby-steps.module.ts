import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BabyStepsController } from './baby-steps.controller';
import { BabyStepsService } from './baby-steps.service';
import { DatabaseModule } from '../database/database.module';
import { Language } from '../database/entities/language.entity';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Language])],
  controllers: [BabyStepsController],
  providers: [BabyStepsService],
  exports: [BabyStepsService],
})
export class BabyStepsModule {}
