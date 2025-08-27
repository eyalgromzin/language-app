import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function migrateLanguageSymbolToId() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    console.log('Starting migration: languageSymbol to languageId...');
    
    // Step 1: Add the new languageId column
    console.log('Step 1: Adding languageId column...');
    await dataSource.query(`
      ALTER TABLE library_items 
      ADD COLUMN language_id INTEGER;
    `);
    
    // Step 2: Populate languageId based on existing languageSymbol values
    console.log('Step 2: Populating languageId values...');
    await dataSource.query(`
      UPDATE library_items 
      SET language_id = (
        SELECT id 
        FROM languages 
        WHERE languages.symbol = library_items.language_symbol
      )
      WHERE language_symbol IS NOT NULL;
    `);
    
    // Step 3: Set default value for any NULL language_id (use first language)
    console.log('Step 3: Setting default values for NULL language_id...');
    await dataSource.query(`
      UPDATE library_items 
      SET language_id = (SELECT id FROM languages LIMIT 1)
      WHERE language_id IS NULL;
    `);
    
    // Step 4: Make language_id NOT NULL
    console.log('Step 4: Making language_id NOT NULL...');
    await dataSource.query(`
      ALTER TABLE library_items 
      ALTER COLUMN language_id SET NOT NULL;
    `);
    
    // Step 5: Add foreign key constraint
    console.log('Step 5: Adding foreign key constraint...');
    await dataSource.query(`
      ALTER TABLE library_items 
      ADD CONSTRAINT fk_library_items_language 
      FOREIGN KEY (language_id) 
      REFERENCES languages(id);
    `);
    
    // Step 6: Drop the old language_symbol column
    console.log('Step 6: Dropping old language_symbol column...');
    await dataSource.query(`
      ALTER TABLE library_items 
      DROP COLUMN language_symbol;
    `);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

migrateLanguageSymbolToId();
