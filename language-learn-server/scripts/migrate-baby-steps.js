const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { BabyStepsService } = require('../dist/database/services/baby-steps.service');

async function migrateBabySteps() {
  console.log('Starting baby steps migration...');
  
  try {
    // Create the NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the BabyStepsService
    const babyStepsService = app.get(BabyStepsService);
    
    // Run the migration
    await babyStepsService.migrateAllBabySteps();
    
    console.log('Baby steps migration completed successfully!');
    
    // Close the application
    await app.close();
  } catch (error) {
    console.error('Error during baby steps migration:', error);
    process.exit(1);
  }
}

// Run the migration
migrateBabySteps();
