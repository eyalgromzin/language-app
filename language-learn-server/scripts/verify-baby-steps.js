const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { BabyStepsService } = require('../dist/database/services/baby-steps.service');

async function verifyBabySteps() {
  console.log('Verifying baby steps data...');
  
  try {
    // Create the NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the BabyStepsService
    const babyStepsService = app.get(BabyStepsService);
    
    // Get all baby steps for English
    const steps = await babyStepsService.getSteps('en');
    console.log(`Found ${steps.length} baby steps for English`);
    
    if (steps.length > 0) {
      const firstStep = steps[0];
      console.log('First step details:');
      console.log(`- ID: ${firstStep.stepId}`);
      console.log(`- Title: ${firstStep.title}`);
      console.log(`- Language Name: ${firstStep.languageName}`);
      console.log(`- Items count: ${firstStep.items?.length || 0}`);
      
      if (firstStep.items && firstStep.items.length > 0) {
        console.log('First item details:');
        console.log(`- Item ID: ${firstStep.items[0].itemId}`);
        console.log(`- Type: ${firstStep.items[0].type}`);
        console.log(`- Text: ${firstStep.items[0].text}`);
        console.log(`- Practice Type: ${firstStep.items[0].practiceType}`);
      }
    }
    
    console.log('Baby steps verification completed successfully!');
    
    // Close the application
    await app.close();
  } catch (error) {
    console.error('Error verifying baby steps data:', error);
    process.exit(1);
  }
}

// Run the verification
verifyBabySteps();
