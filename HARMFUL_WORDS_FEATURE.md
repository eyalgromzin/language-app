# Harmful Words Filter Feature

This feature prevents users from saving URLs containing inappropriate content to their favorites.

## Overview

The harmful words filter automatically checks URLs before they can be added to favorites and blocks URLs containing words related to:
- Pornography and adult content
- Palestine/Israel conflict and war-related content
- Curses and harmful language
- Suicide and self-harm content

## Implementation

### Server Side (NestJS)

**Files:**
- `language-learn-server/src/harmful-words/harmful-words.service.ts`
- `language-learn-server/src/harmful-words/harmful-words.controller.ts`
- `language-learn-server/src/harmful-words/harmful-words.module.ts`

**Features:**
- Maintains a list of harmful words
- Provides endpoints to fetch and check URLs
- Supports adding/removing words from the list

**Endpoints:**
- `GET /harmful-words` - Get all harmful words
- `POST /harmful-words/check` - Check if a URL contains harmful words
- `POST /harmful-words/add` - Add a new harmful word
- `POST /harmful-words/remove` - Remove a harmful word

### Client Side (React Native)

**Files:**
- `src/services/harmfulWordsService.ts` - Service to interact with harmful words API
- `src/config/api.ts` - API configuration
- `src/screens/Surf/SurfScreen.tsx` - Modified to check URLs before saving
- `src/screens/Video/VideoScreen.tsx` - Modified to check URLs before saving

**Features:**
- Caches harmful words locally for 24 hours
- Automatically fetches harmful words on app startup
- Checks URLs before adding to favorites
- Shows user-friendly error messages when content is blocked

## Usage

### For Users

1. The app automatically fetches the harmful words list when it starts
2. When trying to add a URL to favorites, the app checks if it contains harmful words
3. If harmful content is detected, the user sees an error message explaining why the URL cannot be saved
4. The error message includes which specific words triggered the block

### For Developers

**Adding new harmful words:**
```typescript
// Server side - add to the array in harmful-words.service.ts
private harmfulWords: string[] = [
  // ... existing words
  'new-harmful-word',
];
```

**Checking a URL programmatically:**
```typescript
import harmfulWordsService from '../services/harmfulWordsService';

const result = await harmfulWordsService.checkUrl('https://example.com/some-url');
if (result.isHarmful) {
  console.log('Blocked words:', result.matchedWords);
}
```

**Updating server URL for different environments:**
```typescript
import { updateServerUrl } from '../config/api';

updateServerUrl('https://your-production-server.com');
```

## Configuration

### Server URL
Update the server URL in `src/config/api.ts`:
```typescript
export const API_CONFIG = {
  SERVER_URL: 'http://localhost:3000', // Change for production
  // ...
};
```

### Cache Duration
Modify the cache duration in `src/services/harmfulWordsService.ts`:
```typescript
const HARMFUL_WORDS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

## Error Handling

- If the server is unavailable, the app falls back to cached harmful words
- If no cache is available, the app allows all URLs (fails open)
- Network errors are logged but don't prevent the app from functioning

## Security Considerations

- Harmful words are cached locally but not stored permanently
- The list is updated daily to ensure fresh content filtering
- Server-side validation provides the authoritative list
- Client-side checks are for user experience, server-side checks should be used for security

## Testing

To test the feature:

1. Start the server: `cd language-learn-server && npm start`
2. Start the app: `npm start`
3. Try to add a URL containing harmful words to favorites
4. Verify that the URL is blocked with an appropriate error message

Example test URLs:
- `https://example.com/porn-content` (should be blocked)
- `https://example.com/war-news` (should be blocked)
- `https://example.com/educational-content` (should be allowed)
