# API Caching System

This document describes the comprehensive caching system implemented for the specified API endpoints in the Language Learning app.

## Overview

The caching system provides automatic caching for the following API endpoints with a 1-week TTL and automatic invalidation on app version changes:

- `HARMFUL_WORDS` - Harmful words list
- `TRANSLATE` - Word translations
- `LIBRARY_GET_META` - Library metadata
- `GET_LANGUAGES` - Available languages
- `BABY_STEPS_GET` - Baby steps for a language
- `BABY_STEPS_GET_STEP` - Specific baby step details

## Features

- **Automatic Caching**: Responses are automatically cached after the first API call
- **1-Week TTL**: Cache entries expire after 1 week
- **Version Invalidation**: Cache is automatically cleared when app version changes
- **Parameter-Aware**: Different parameters create separate cache entries
- **Automatic Cleanup**: Expired entries are automatically removed
- **Size Management**: Maximum cache size is enforced (100 entries)
- **Persistent Storage**: Cache persists between app sessions using AsyncStorage

## Architecture

### Core Components

1. **`ApiCacheService`** (`src/services/apiCacheService.ts`)
   - Core caching logic
   - AsyncStorage integration
   - TTL management
   - Version checking

2. **`CachedApiService`** (`src/services/cachedApiService.ts`)
   - Wraps original API functions with caching
   - Provides cached versions of all supported endpoints

3. **`useCachedApi` Hook** (`src/hooks/useCachedApi.ts`)
   - React hook for easy integration
   - Provides loading states and error handling
   - Specific hooks for each endpoint type

4. **`CacheManager` Component** (`src/components/CacheManager.tsx`)
   - Debug interface for cache management
   - Statistics display
   - Manual cache clearing

## Usage

### Basic Usage with Service

```typescript
import { cachedApiService } from '../services/cachedApiService';

// Get harmful words (cached automatically)
const harmfulWords = await cachedApiService.getHarmfulWords();

// Translate word (cached by parameters)
const translation = await cachedApiService.translateWord('hello', 'en', 'es');

// Get languages (cached automatically)
const languages = await cachedApiService.getLanguages();
```

### Usage with React Hook

```typescript
import { useHarmfulWords, useTranslation, useLanguages } from '../hooks/useCachedApi';

function MyComponent() {
  // Auto-fetch harmful words
  const { data: harmfulWords, loading, error } = useHarmfulWords();
  
  // Translate with parameters
  const { data: translation, loading: translateLoading } = useTranslation(
    'hello',
    'en',
    'es',
    false // Don't auto-fetch
  );
  
  // Get languages
  const { data: languages, refetch } = useLanguages();
  
  // Manual refetch
  const handleRefresh = () => {
    refetch();
  };
  
  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  
  return (
    <View>
      <Text>Harmful words count: {harmfulWords?.length}</Text>
      <Text>Translation: {translation}</Text>
      <Text>Languages: {languages?.length}</Text>
      <Button title="Refresh" onPress={handleRefresh} />
    </View>
  );
}
```

### Advanced Usage

```typescript
import { useCachedApi } from '../hooks/useCachedApi';

function AdvancedComponent() {
  const { data, loading, error, refetch, clearCache } = useCachedApi(
    'BABY_STEPS_GET',
    { language: 'es' },
    {
      autoFetch: true,
      onSuccess: (data) => console.log('Data loaded:', data),
      onError: (error) => console.error('Error:', error),
    }
  );
  
  const handleClearCache = async () => {
    await clearCache();
    // Cache cleared, next call will fetch fresh data
  };
  
  return (
    <View>
      {/* Component content */}
      <Button title="Clear Cache" onPress={handleClearCache} />
      <Button title="Refetch" onPress={refetch} />
    </View>
  );
}
```

## Cache Management

### Manual Cache Control

```typescript
import { cachedApiService } from '../services/cachedApiService';

// Clear specific endpoint cache
await cachedApiService.clearEndpointCache('HARMFUL_WORDS');

// Clear all cache
await cachedApiService.clearAllCache();

// Force cleanup of expired entries
await cachedApiService.forceCleanup();

// Get cache statistics
const stats = await cachedApiService.getCacheStats();
console.log('Cache entries:', stats.totalEntries);
```

### Cache Statistics

The cache system provides detailed statistics:

```typescript
interface CacheStats {
  totalEntries: number;    // Total cached entries
  size: number;            // Current cache size
  lastCleanup: number;     // Timestamp of last cleanup
  version: string;         // Current app version
}
```

## Configuration

### Cache Settings

The cache behavior can be configured in `src/services/apiCacheService.ts`:

```typescript
const CACHE_CONFIG = {
  TTL_WEEKS: 1,                    // Time to live in weeks
  TTL_MS: 1 * 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
  STORAGE_KEY: 'api_cache',        // AsyncStorage key
  VERSION_KEY: 'app_version',      // Version storage key
  MAX_CACHE_SIZE: 100,             // Maximum cache entries
};
```

### App Version Detection

The system automatically detects app version changes to invalidate cache. The version detection is handled in `src/utils/appVersion.ts`.

## Integration

### Replacing Existing API Calls

To use the cached version instead of direct API calls:

**Before:**
```typescript
import { getHarmfulWords } from '../config/api';

const words = await getHarmfulWords();
```

**After:**
```typescript
import { cachedApiService } from '../services/cachedApiService';

const words = await cachedApiService.getHarmfulWords();
```

### Using in Components

**Before:**
```typescript
const [words, setWords] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const fetchWords = async () => {
    setLoading(true);
    try {
      const data = await getHarmfulWords();
      setWords(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  fetchWords();
}, []);
```

**After:**
```typescript
import { useHarmfulWords } from '../hooks/useCachedApi';

const { data: words, loading, error } = useHarmfulWords();
```

## Debugging

### Cache Manager Component

The `CacheManager` component provides a visual interface for:

- Viewing cache statistics
- Clearing specific endpoint caches
- Clearing all cache
- Forcing cleanup
- Refreshing statistics

### Console Logging

The cache system provides detailed console logging:

```
[ApiCache] Cache hit for HARMFUL_WORDS
[ApiCache] Cached data for TRANSLATE
[ApiCache] App version changed, clearing cache
[ApiCache] Cache cleared
```

## Performance Benefits

- **Reduced API Calls**: Subsequent requests for the same data are served from cache
- **Faster Response Times**: Cached data is returned instantly
- **Reduced Server Load**: Fewer requests to your backend
- **Better User Experience**: Faster app performance and offline capability

## Best Practices

1. **Use the cached service** instead of direct API calls for supported endpoints
2. **Leverage React hooks** for automatic state management
3. **Handle loading states** provided by the hooks
4. **Use refetch** when you need fresh data
5. **Clear cache** when data becomes stale or invalid
6. **Monitor cache statistics** in development

## Troubleshooting

### Common Issues

1. **Cache not working**: Check if AsyncStorage is properly configured
2. **Version detection issues**: Verify app version configuration
3. **Memory issues**: Check MAX_CACHE_SIZE configuration
4. **Stale data**: Use refetch() or clearCache() as needed

### Debug Commands

```typescript
// Check cache status
const stats = await cachedApiService.getCacheStats();
console.log('Cache stats:', stats);

// Force refresh all data
await cachedApiService.clearAllCache();

// Check specific endpoint cache
const cached = await apiCacheService.getCachedData('HARMFUL_WORDS');
console.log('Cached data:', cached);
```

## Future Enhancements

- **Network-aware caching**: Cache behavior based on network conditions
- **Priority-based eviction**: Important data kept longer in cache
- **Compression**: Reduce storage footprint
- **Background sync**: Automatic cache refresh in background
- **Analytics**: Cache hit/miss metrics

## Support

For issues or questions about the caching system:

1. Check the console logs for error messages
2. Use the CacheManager component to inspect cache state
3. Verify AsyncStorage permissions and configuration
4. Check app version detection logic
