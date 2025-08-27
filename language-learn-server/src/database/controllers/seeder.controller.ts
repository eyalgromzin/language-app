import { Controller, Post, Get } from '@nestjs/common';
import { SeederService } from '../services/seeder.service';

@Controller('seeder')
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  @Post('seed')
  async seedDatabase() {
    try {
      await this.seederService.seedAllTables();
      return {
        success: true,
        message: 'Database seeded successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to seed database',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('status')
  async getTableStatus() {
    try {
      const status = await this.seederService.checkTableStatus();
      return {
        success: true,
        data: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get table status',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
