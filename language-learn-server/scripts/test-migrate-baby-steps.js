const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { BabyStepsService } = require('../dist/database/services/baby-steps.service');

async function testMigrateBabySteps() {
  console.log('Starting baby steps migration test...');
  
  try {
    // Create the NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the BabyStepsService
    const babyStepsService = app.get(BabyStepsService);
    
    // Test with just English first
    console.log('Testing migration for English language...');
    await babyStepsService.migrateLanguageBabySteps('en');
    
    console.log('Baby steps migration test completed successfully!');
    
    // Close the application
    await app.close();
  } catch (error) {
    console.error('Error during baby steps migration test:', error);
    process.exit(1);
  }
}

// Run the test migration
testMigrateBabySteps();
