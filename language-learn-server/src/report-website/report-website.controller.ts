import { Controller, Post, Body, Get, BadRequestException } from '@nestjs/common';
import { ReportedUrlService } from '../database/services/reported-url.service';

@Controller('report-website')
export class ReportWebsiteController {
  constructor(private readonly reportedUrlService: ReportedUrlService) {}

  @Post()
  async reportWebsite(@Body() body: { url: string }) {
    try {
      const { url } = body;
      
      if (!url || typeof url !== 'string' || url.trim() === '') {
        throw new BadRequestException('URL is required and must be a non-empty string');
      }

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new BadRequestException('Invalid URL format');
      }

      const result = await this.reportedUrlService.reportUrl(url.trim());
      
      return {
        success: true,
        message: 'Website reported successfully',
        data: {
          url: result.url,
          count: result.count,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in reportWebsite endpoint:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      return {
        success: false,
        message: 'Failed to report website',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get()
  async getReportedUrls() {
    try {
      const reportedUrls = await this.reportedUrlService.getReportedUrls();
      
      return {
        success: true,
        data: reportedUrls,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting reported URLs:', error);
      
      return {
        success: false,
        message: 'Failed to get reported URLs',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
