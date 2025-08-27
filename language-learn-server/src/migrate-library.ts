import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LibraryMigrationService } from './database/services/library-migration.service';

async function migrateLibraryData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const migrationService = app.get(LibraryMigrationService);
    await migrationService.migrateLibraryData();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await app.close();
  }
}

migrateLibraryData();
