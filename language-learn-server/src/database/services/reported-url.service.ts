import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportedUrl } from '../entities/reported-url.entity';

@Injectable()
export class ReportedUrlService {
  constructor(
    @InjectRepository(ReportedUrl)
    private readonly reportedUrlRepository: Repository<ReportedUrl>,
  ) {}

  async reportUrl(url: string): Promise<ReportedUrl> {
    try {
      // Try to find existing record
      const existingReport = await this.reportedUrlRepository.findOne({
        where: { url },
      });

      if (existingReport) {
        // Increment count if URL already exists
        existingReport.count += 1;
        return await this.reportedUrlRepository.save(existingReport);
      } else {
        // Create new record if URL doesn't exist
        const newReport = this.reportedUrlRepository.create({
          url,
          count: 1,
        });
        return await this.reportedUrlRepository.save(newReport);
      }
    } catch (error) {
      console.error('Error reporting URL:', error);
      throw new Error('Failed to report URL');
    }
  }

  async getReportedUrls(): Promise<ReportedUrl[]> {
    try {
      return await this.reportedUrlRepository.find({
        order: { count: 'DESC', updatedAt: 'DESC' },
      });
    } catch (error) {
      console.error('Error getting reported URLs:', error);
      throw new Error('Failed to get reported URLs');
    }
  }

  async getReportCount(url: string): Promise<number> {
    try {
      const report = await this.reportedUrlRepository.findOne({
        where: { url },
      });
      return report ? report.count : 0;
    } catch (error) {
      console.error('Error getting report count:', error);
      return 0;
    }
  }
}
