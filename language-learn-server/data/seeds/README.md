# Database Seeding System

This directory contains JSON files with initial data for all 6 database tables. The seeding system will automatically load this data into empty database tables.

## Tables and Seed Files

1. **item_types** - `item-types.json`
   - Defines different types of learning content (video, audio, text, interactive, quiz)

2. **levels** - `levels.json`
   - Defines difficulty levels (beginner, intermediate, advanced, expert)

3. **languages** - `languages.json`
   - Defines supported languages with their symbols (en, es, he, fr, de, etc.)

4. **media** - `media.json`
   - Defines media platforms (youtube, spotify, podcast, pdf, epub, website, app)

5. **library_items** - `library-items.json`
   - Sample learning content with references to the above tables

6. **now_playing** - `now-playing.json`
   - Sample currently playing content for different languages

## How to Use

### Automatic Seeding
The seeding system automatically checks if tables are empty and loads the JSON data when needed.

### Manual Seeding via API
You can trigger seeding manually using the API endpoints:

1. **Check table status:**
   ```
   GET /seeder/status
   ```

2. **Seed all tables:**
   ```
   POST /seeder/seed
   ```

### Programmatic Seeding
You can also use the `SeederService` in your code:

```typescript
import { SeederService } from './database/services/seeder.service';

// Inject the service and call:
await seederService.seedAllTables();
await seederService.checkTableStatus();
```

## Data Structure

Each JSON file contains an array of objects that match the corresponding database entity structure. The seeding system will:

- Check if each table is empty
- Load the JSON data only for empty tables
- Skip tables that already contain data
- Provide detailed logging of the seeding process

## Adding New Data

To add new seed data:

1. Edit the appropriate JSON file in this directory
2. Follow the existing data structure
3. Ensure foreign key relationships are correct
4. Restart the application or trigger manual seeding

## Notes

- The seeding system is safe to run multiple times - it only seeds empty tables
- Foreign key relationships are maintained in the JSON data
- All timestamps (created_at, updated_at) are automatically handled by the database
- The system provides detailed logging for debugging purposes
