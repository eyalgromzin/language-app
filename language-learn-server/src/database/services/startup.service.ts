import { Injectable, OnModuleInit } from '@nestjs/common';
import { SeederService } from './seeder.service';

@Injectable()
export class StartupService implements OnModuleInit {
  constructor(private readonly seederService: SeederService) {}

  async onModuleInit() {
    console.log('Starting database initialization...');
    
    try {
      // Check current table status
      const status = await this.seederService.checkTableStatus();
      
      // Seed tables if they are empty
      await this.seederService.seedAllTables();
      
      console.log('Database initialization completed successfully!');
    } catch (error) {
      console.error('Error during database initialization:', error);
      // Don't throw error to prevent application startup failure
      // The application can still run without seeded data
    }
  }
}
