# Word Categories Migration

## Overview

The `wordCategories.json` file has been moved from the client app to the server and is now loaded dynamically on app startup.

## Changes Made

### Server Side
1. **New Endpoint**: Added `/word-categories` GET endpoint in `language-learn-server/src/app.controller.ts`
2. **File Location**: `wordCategories.json` is now served from `language-learn-server/data/wordCategories.json`

### Client Side
1. **New Context**: Created `WordCategoriesContext` to manage word categories data
2. **Server Config**: Added server configuration in `src/config/server.ts`
3. **App Integration**: Wrapped the app with `WordCategoriesProvider` in `App.tsx`
4. **Screen Updates**: Updated `WordsByCategoriesScreen` to use the context instead of local JSON

## How It Works

1. **App Startup**: When the app starts, `WordCategoriesProvider` automatically fetches word categories from the server
2. **Loading States**: The app shows loading indicators while fetching data
3. **Error Handling**: If the server is unavailable, users can retry loading the data
4. **Caching**: The data is stored in React context and available throughout the app

## Usage

### In Components
```typescript
import { useWordCategories } from '../contexts/WordCategoriesContext';

function MyComponent() {
  const { categoriesData, loading, error, refreshCategories } = useWordCategories();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage onRetry={refreshCategories} />;
  }
  
  return (
    <div>
      {categoriesData?.categories.map(category => (
        <CategoryItem key={category.id} category={category} />
      ))}
    </div>
  );
}
```

### Server Configuration
The server URL is configured in `src/config/server.ts`:
- Development: `http://localhost:3000`
- Production: Update the `BASE_URL` in the config file

## Benefits

1. **Dynamic Updates**: Word categories can be updated on the server without app updates
2. **Reduced App Size**: No need to bundle the JSON file with the app
3. **Centralized Management**: All word data is managed in one place
4. **Better Error Handling**: Graceful fallbacks when server is unavailable

## Migration Notes

- The old local `wordCategories.json` file has been removed from the client
- All existing functionality remains the same from a user perspective
- The app will work offline if the data was previously loaded (stored in context)
- Server must be running for initial data load

## Testing

1. Start the server: `npm run server`
2. Start the client: `npm start`
3. Navigate to the Categories tab
4. Verify that categories load correctly
5. Test error handling by stopping the server and refreshing
