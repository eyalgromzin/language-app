# Internationalization (i18n) System

This document describes the internationalization system implemented for the HelloLingo app.

## Overview

The app now supports 19 languages for the user interface. When a user selects their native language in the settings, the entire app interface will display in that language.

## Supported Languages

- English (en)
- Spanish (es) 
- Hebrew (he)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Hindi (hi)
- Polish (pl)
- Dutch (nl)
- Greek (el)
- Swedish (sv)
- Norwegian (no)
- Finnish (fi)
- Czech (cs)
- Ukrainian (uk)
- Thai (th)
- Vietnamese (vi)

## How It Works

### Language Selection

1. **Native Language**: The language the user speaks natively (used for translations)
2. **Learning Language**: The language the user wants to learn
3. **UI Language**: The language for the app interface (NEW)

### Automatic Language Detection

The app automatically detects the UI language in this order:
1. User's previously selected UI language (stored in AsyncStorage)
2. User's native language setting
3. Device's system language
4. Falls back to English

### Language Switching

Users can change the UI language in Settings:
1. Go to Settings
2. Scroll to "Language Settings" section
3. Select "Language" dropdown
4. Choose desired language
5. The app interface will immediately update

## Technical Implementation

### Files Structure

```
src/i18n/
├── index.ts                 # Main i18n configuration
├── locales/
│   ├── en.json             # English translations
│   ├── es.json             # Spanish translations
│   ├── he.json             # Hebrew translations
│   ├── fr.json             # French translations
│   ├── de.json             # German translations
│   ├── it.json             # Italian translations
│   └── ...                 # Other language files
└── README.md               # This file

src/hooks/
└── useTranslation.ts       # Custom hook for translations
```

### Usage in Components

```typescript
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('screens.settings.title')}</Text>
  );
}
```

### Translation Keys Structure

```json
{
  "navigation": {
    "surf": "Surf",
    "video": "Video",
    "practice": "Practice"
  },
  "screens": {
    "settings": {
      "title": "Settings",
      "subtitle": "Customize your learning experience"
    }
  },
  "common": {
    "loading": "Loading...",
    "error": "Error"
  }
}
```

## Adding New Translations

### 1. Add Translation Keys

Add new keys to `src/i18n/locales/en.json`:

```json
{
  "newSection": {
    "newKey": "New translation text"
  }
}
```

### 2. Update All Language Files

Copy the new keys to all language files in `src/i18n/locales/` and translate them.

### 3. Use in Components

```typescript
const { t } = useTranslation();
<Text>{t('newSection.newKey')}</Text>
```

## Adding New Languages

### 1. Create Translation File

Create `src/i18n/locales/[language-code].json` with all translations.

### 2. Update i18n Configuration

Add the new language to `src/i18n/index.ts`:

```typescript
import newLanguage from './locales/[language-code].json';

const resources = {
  // ... existing languages
  [language-code]: { translation: newLanguage },
};
```

### 3. Update Settings Screen

Add the new language to the UI language picker in `src/screens/Settings/SettingsScreen.tsx`:

```typescript
<Picker.Item label="Language Name" value="language-code" />
```

## Features Implemented

✅ **Tab Navigation**: All tab labels are translated
✅ **Settings Screen**: Complete translation including language picker
✅ **Startup Screen**: Welcome flow in user's language
✅ **Practice Screens**: All practice screen titles translated
✅ **Menu Items**: Side menu items translated
✅ **Alert Messages**: Error and success messages translated
✅ **Loading States**: Loading text translated
✅ **Language Switching**: Real-time language switching in settings

## Future Enhancements

- [ ] Add RTL (Right-to-Left) support for Hebrew and Arabic
- [ ] Implement pluralization rules
- [ ] Add date/time formatting per language
- [ ] Add number formatting per language
- [ ] Implement dynamic language loading (load translations on demand)

## Testing

To test the language switching:

1. Open the app
2. Go to Settings
3. Change the "Language" setting
4. Verify all text updates immediately
5. Navigate through different screens to ensure consistency

## Notes

- The system uses `react-i18next` for translation management
- Translations are stored in JSON files for easy editing
- The app automatically detects and applies the user's preferred language
- All hardcoded text has been replaced with translation keys
- Language switching happens in real-time without app restart
