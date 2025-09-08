import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportWebsiteController } from './report-website.controller';
import { ReportedUrlService } from '../database/services/reported-url.service';
import { ReportedUrl } from '../database/entities/reported-url.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReportedUrl])],
  controllers: [ReportWebsiteController],
  providers: [ReportedUrlService],
  exports: [ReportedUrlService],
})
export class ReportWebsiteModule {}
