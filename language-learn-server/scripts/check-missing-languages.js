const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { BabyStepsService } = require('../dist/database/services/baby-steps.service');
const fs = require('fs');
const path = require('path');

async function checkMissingLanguages() {
  console.log('Checking for missing languages in database...');
  
  try {
    // Create the NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the BabyStepsService
    const babyStepsService = app.get(BabyStepsService);
    
    // Get all language directories from file system
    const babyStepsDir = path.join(process.cwd(), 'src', 'baby-steps');
    const languageDirs = fs.readdirSync(babyStepsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== 'index.json')
      .map(dirent => dirent.name);
    
    console.log(`Found ${languageDirs.length} language directories in file system:`, languageDirs);
    
    // Check which languages have data in database
    const languagesWithData = [];
    const languagesWithoutData = [];
    
    for (const languageSymbol of languageDirs) {
      try {
        const steps = await babyStepsService.getSteps(languageSymbol);
        if (steps && steps.length > 0) {
          languagesWithData.push(languageSymbol);
          console.log(`✅ ${languageSymbol}: ${steps.length} steps in database`);
        } else {
          languagesWithoutData.push(languageSymbol);
          console.log(`❌ ${languageSymbol}: No data in database`);
        }
      } catch (error) {
        languagesWithoutData.push(languageSymbol);
        console.log(`❌ ${languageSymbol}: Error checking database - ${error.message}`);
      }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Languages with data: ${languagesWithData.length}`);
    console.log(`Languages missing data: ${languagesWithoutData.length}`);
    
    if (languagesWithoutData.length > 0) {
      console.log('\nMissing languages:', languagesWithoutData);
      console.log('\nAttempting to migrate missing languages...');
      
      for (const languageSymbol of languagesWithoutData) {
        try {
          console.log(`\nMigrating ${languageSymbol}...`);
          await babyStepsService.migrateLanguageBabySteps(languageSymbol);
        } catch (error) {
          console.error(`Failed to migrate ${languageSymbol}:`, error.message);
        }
      }
    } else {
      console.log('\n🎉 All languages are properly migrated!');
    }
    
    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    for (const languageSymbol of languageDirs) {
      try {
        const steps = await babyStepsService.getSteps(languageSymbol);
        if (steps && steps.length > 0) {
          console.log(`✅ ${languageSymbol}: ${steps.length} steps`);
        } else {
          console.log(`❌ ${languageSymbol}: Still no data`);
        }
      } catch (error) {
        console.log(`❌ ${languageSymbol}: Error - ${error.message}`);
      }
    }
    
    console.log('\nLanguage check completed!');
    
    // Close the application
    await app.close();
  } catch (error) {
    console.error('Error checking languages:', error);
    process.exit(1);
  }
}

// Run the check
checkMissingLanguages();
