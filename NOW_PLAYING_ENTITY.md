# Now Playing Entity Implementation

## Overview

This implementation creates a database-driven now playing system that tracks videos currently being watched by users. The system automatically upserts video data every minute and maintains a maximum of 20 videos per language.

## Database Entity

### NowPlaying Entity (`now_playing` table)

```typescript
@Entity('now_playing')
export class NowPlaying {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string; // YouTube video URL (unique)

  @Column()
  title: string; // Video title

  @Column({ nullable: true })
  description: string; // Video description

  @Column({ nullable: true })
  thumbnailUrl: string; // Video thumbnail URL

  @Column({ nullable: true })
  length: string; // Video duration

  @Column()
  languageId: number; // Foreign key to languages table

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Language, language => language.nowPlaying)
  @JoinColumn({ name: 'languageId' })
  language: Language;
}
```

### Database Indexes

- `IDX_NOW_PLAYING_LANGUAGE_UPDATED`: Composite index on `(languageId, updatedAt)` for efficient queries
- `IDX_NOW_PLAYING_URL`: Unique index on `url` to prevent duplicates

## API Endpoints

### Upsert Now Playing Video
```
POST /video/now-playing/upsert
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=VIDEO_ID",
  "title": "Video Title",
  "language": "en"
}
```

### Get Now Playing Videos
```
POST /video/now-playing
Content-Type: application/json

{
  "languageSymbol": "en"
}
```

## Services

### DatabaseNowPlayingService
- Handles all database operations for now playing videos
- Enforces 20 videos per language limit
- Automatically removes oldest videos when limit is exceeded
- Updates existing videos when URL already exists

### NowPlayingService (Cache Layer)
- Wrapper around DatabaseNowPlayingService
- Maintains backward compatibility with existing code
- Delegates all operations to database service

### NowPlayingSchedulerService
- Runs every minute via cron job
- Currently logs task execution (placeholder for future enhancements)
- Can be extended to handle cleanup of stale entries

## Client-Side Implementation

### Minute-Based Upsert
The VideoScreen component automatically upserts the current video every minute when:
- Video is playing (`isPlaying` is true)
- Valid URL exists
- Learning language is set

```typescript
React.useEffect(() => {
  if (!isPlaying || !url || !learningLanguage) {
    return;
  }

  const interval = setInterval(async () => {
    // Upsert current video data
    await upsertVideoNowPlaying(videoUrl, title, languageSymbol);
  }, 60000); // Every minute

  return () => clearInterval(interval);
}, [isPlaying, url, learningLanguage, currentVideoTitle]);
```

## Features

### Automatic Thumbnail Generation
- Extracts YouTube video ID from URL
- Generates thumbnail URL: `https://i.ytimg.com/vi/{videoId}/hqdefault.jpg`

### Video Length Detection
- Attempts to fetch video length from YouTube API
- Falls back gracefully if length cannot be determined

### Duplicate Prevention
- Unique constraint on video URL
- Updates existing record instead of creating duplicate

### Language-Based Organization
- Videos are organized by learning language
- Each language maintains separate list of 20 videos

### Automatic Cleanup
- Removes oldest videos when language limit is exceeded
- Maintains performance with large datasets

## Migration

To set up the database:

1. Run the migration to create the `now_playing` table:
   ```bash
   npm run migrate:now-playing
   ```

2. The migration will:
   - Create the `now_playing` table
   - Add foreign key constraint to `languages` table
   - Create necessary indexes for performance

## Configuration

### Max Videos Per Language
The limit is configurable in `DatabaseNowPlayingService`:
```typescript
private readonly maxPerLanguage = 20;
```

### Upsert Interval
The client-side upsert interval is configurable in VideoScreen:
```typescript
const interval = setInterval(async () => {
  // Upsert logic
}, 60000); // 60 seconds
```

## Error Handling

- Graceful fallback when YouTube API calls fail
- Silent error handling for non-critical operations
- Logging for debugging purposes
- Database constraint violations are handled automatically

## Future Enhancements

1. **Stale Entry Cleanup**: Remove videos not updated in last 24 hours
2. **Analytics**: Track most popular videos per language
3. **Real-time Updates**: WebSocket integration for live updates
4. **Video Metadata**: Store additional video information (channel, views, etc.)
5. **User Tracking**: Associate videos with specific users (optional)
