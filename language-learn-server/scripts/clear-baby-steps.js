const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { BabyStepsService } = require('../dist/database/services/baby-steps.service');

async function clearBabySteps() {
  console.log('Clearing existing baby steps data...');
  
  try {
    // Create the NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the BabyStepsService
    const babyStepsService = app.get(BabyStepsService);
    
    // Clear all baby step items first (due to foreign key constraints)
    await babyStepsService.babyStepItemRepository.createQueryBuilder().delete().execute();
    console.log('Cleared baby step items');
    
    // Clear all baby steps
    await babyStepsService.babyStepRepository.createQueryBuilder().delete().execute();
    console.log('Cleared baby steps');
    
    console.log('Baby steps data cleared successfully!');
    
    // Close the application
    await app.close();
  } catch (error) {
    console.error('Error clearing baby steps data:', error);
    process.exit(1);
  }
}

// Run the clear script
clearBabySteps();
