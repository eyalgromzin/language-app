# Database Seeding System

This document describes the complete database seeding system that has been implemented for the Language Learn application.

## Overview

The seeding system automatically loads initial data into empty database tables when the application starts. It includes JSON files with sample data for all 6 database tables and a complete service infrastructure to manage the seeding process.

## Database Tables

The system manages 6 main database tables:

1. **item_types** - Content types (video, audio, text, interactive, quiz)
2. **levels** - Difficulty levels (beginner, intermediate, advanced, expert)
3. **languages** - Supported languages with symbols (en, es, he, fr, de, etc.)
4. **media** - Media platforms (youtube, spotify, podcast, pdf, epub, website, app)
5. **library_items** - Learning content with foreign key relationships
6. **now_playing** - Currently playing content for different languages

## Files Created

### JSON Seed Files
- `data/seeds/item-types.json` - 5 item types
- `data/seeds/levels.json` - 4 difficulty levels
- `data/seeds/languages.json` - 12 supported languages
- `data/seeds/media.json` - 7 media platforms
- `data/seeds/library-items.json` - 10 sample learning items
- `data/seeds/now-playing.json` - 5 sample playing items

### Service Files
- `src/database/services/seeder.service.ts` - Main seeding logic
- `src/database/services/startup.service.ts` - Automatic startup seeding
- `src/database/controllers/seeder.controller.ts` - API endpoints for manual seeding

### Documentation
- `data/seeds/README.md` - Detailed usage instructions

## Features

### Automatic Seeding
- **StartupService**: Automatically seeds empty tables when the application starts
- **Safe Operation**: Only seeds tables that are completely empty
- **Error Handling**: Graceful error handling that doesn't prevent application startup

### Manual Seeding
- **API Endpoints**: REST endpoints for manual seeding and status checking
- **Programmatic Access**: SeederService can be injected and used in other services

### Data Integrity
- **Foreign Key Relationships**: All JSON data maintains proper relationships
- **Validation**: Data structure matches database entity definitions
- **Logging**: Detailed logging for debugging and monitoring

## API Endpoints

### Check Database Status
```
GET /seeder/status
```
Returns the current record count for each table.

### Manual Seeding
```
POST /seeder/seed
```
Manually triggers the seeding process for all empty tables.

## Usage Examples

### Check Table Status
```bash
curl http://localhost:3000/seeder/status
```

### Trigger Manual Seeding
```bash
curl -X POST http://localhost:3000/seeder/seed
```

### Programmatic Usage
```typescript
import { SeederService } from './database/services/seeder.service';

// Inject the service
constructor(private seederService: SeederService) {}

// Check status
const status = await this.seederService.checkTableStatus();

// Seed tables
await this.seederService.seedAllTables();
```

## Data Structure

Each JSON file contains an array of objects that directly correspond to the database entity structure:

```json
[
  {
    "id": 1,
    "name": "video"
  },
  {
    "id": 2,
    "name": "audio"
  }
]
```

## Foreign Key Relationships

The system maintains proper relationships between tables:

- **library_items** references: languageId, typeId, levelId, mediaId
- **now_playing** references: languageId

All foreign key values in the JSON files correspond to valid primary keys in the referenced tables.

## Error Handling

The seeding system includes comprehensive error handling:

- **File Loading Errors**: Graceful handling of missing or malformed JSON files
- **Database Errors**: Proper error logging without crashing the application
- **Validation Errors**: Checks for data integrity before insertion

## Logging

The system provides detailed logging:

- Startup initialization messages
- Table seeding progress
- Record counts for each operation
- Error messages with context

## Benefits

1. **Zero Configuration**: Works automatically on first run
2. **Safe**: Can be run multiple times without issues
3. **Maintainable**: Easy to update seed data
4. **Flexible**: Supports both automatic and manual seeding
5. **Debuggable**: Comprehensive logging and status checking

## Future Enhancements

Potential improvements for the seeding system:

1. **Environment-specific seeds**: Different data for development/production
2. **Incremental seeding**: Add new data without clearing existing records
3. **Data validation**: Schema validation for JSON files
4. **Backup/restore**: Export current data as new seed files
5. **Admin interface**: Web interface for managing seed data

## Conclusion

The database seeding system provides a robust, safe, and maintainable way to initialize the database with sample data. It ensures that the application always has the necessary reference data to function properly, while maintaining data integrity and providing flexibility for different deployment scenarios.
