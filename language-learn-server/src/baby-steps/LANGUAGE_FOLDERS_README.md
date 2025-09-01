# Language Folders Structure

This document describes the new language folder structure for the baby-steps language learning system.

## Overview

The baby-steps folder now contains language-specific subfolders, each containing translated versions of the English lesson files.

## Current Language Folders

- **en/** - English (original)
- **fr/** - French (Français)
- **es/** - Spanish (Español)
- **de/** - German (Deutsch)
- **it/** - Italian (Italiano)
- **pt/** - Portuguese (Português)
- **ru/** - Russian (Русский)
- **ja/** - Japanese (日本語)
- **zh/** - Chinese (中文)
- **ar/** - Arabic (العربية)
- **hi/** - Hindi (हिन्दी)

## Folder Structure

Each language folder contains:

```
language_folder/
├── index.json          # Language-specific index with translated titles
├── 01_essentials.json  # Greetings & politeness
├── 02_introductions.json # Introductions & basic info
├── 03_core_verbs_pronouns.json # Core verbs & pronouns
├── 04_numbers_time_basics.json # Numbers & time basics
├── 05_getting_around.json # Getting around
├── 06_food_drink_basics.json # Food & drink basics
├── 07_shopping_money.json # Shopping & money
├── 08_travel_hotel.json # Travel & hotel
├── 09_emergencies_health.json # Emergencies & health
├── 10_daily_routines.json # Daily routines
├── 11_family_people.json # Family & people
├── 12_weather_smalltalk.json # Weather & small talk
├── 13_work_study.json # Work & study
├── 14_plans_invitations.json # Plans & invitations
├── 15_requests_help.json # Requests & help
├── 16_phone_internet.json # Phone & internet
├── 17_restaurant.json # Restaurant
├── 18_transportation_details.json # Transportation details
├── 19_housing_utilities.json # Housing & utilities
├── 20_connectors_advanced.json # Advanced connectors
├── 21_technology_basics.json # Technology basics
├── 22_weather_and_nature.json # Weather & nature
├── 23_shopping_and_money.json # Shopping & money
├── 24_family_and_relationships.json # Family & relationships
├── 25_work_and_profession.json # Work & profession
├── 26_health_and_medical.json # Health & medical
├── 27_education_and_learning.json # Education & learning
├── 28_sports_and_exercise.json # Sports & exercise
├── 29_travel_and_transportation.json # Travel & transportation
├── 30_hobbies_and_entertainment.json # Hobbies & entertainment
├── 31_emotions_and_feelings.json # Emotions & feelings
├── 32_time_and_dates.json # Time & dates
├── 33_numbers_and_quantities.json # Numbers & quantities
├── 34_colors_and_appearance.json # Colors & appearance
├── 35_food_and_drinks.json # Food & drinks
├── 36_clothing_and_fashion.json # Clothing & fashion
├── 37_home_and_furniture.json # Home & furniture
├── 38_animals_and_pets.json # Animals & pets
├── 39_communication_and_language.json # Communication & language
└── 40_advanced_phrases.json # Advanced phrases
```

## File Format

Each JSON file follows this structure:

```json
{
  "id": "lesson_id",
  "title": "Translated lesson title",
  "emoji": "🎯",
  "language": "Language Name in Native Script",
  "items": [
    {
      "id": "unique_item_id",
      "type": "word|sentence",
      "text": "Translated text content",
      "practiceType": "chooseTranslation|formulateSentense"
    }
  ]
}
```

## Translation Guidelines

1. **Keep IDs unchanged** - All item IDs must remain the same across languages
2. **Translate text fields** - Only translate the `text` field and `title` field
3. **Maintain structure** - Keep the same number of items and practice types
4. **Cultural adaptation** - Adapt phrases to be natural in the target language
5. **Consistent terminology** - Use consistent translations for recurring concepts

## Adding New Languages

To add a new language:

1. Create a new language folder (e.g., `ko/` for Korean)
2. Copy the English lesson files to the new folder
3. Translate the content following the guidelines above
4. Create an `index.json` file with translated titles
5. Update the main `index.json` file to include the new language

## Automation Script

Use the `create-language-files.ps1` script to quickly create the basic structure:

```powershell
.\create-language-files.ps1 -LanguageCode "ko" -LanguageName "Korean" -LanguageNativeName "한국어"
```

## Main Index File

The main `index.json` file lists all available languages:

```json
{
  "languages": [
    {
      "code": "en",
      "name": "English",
      "folder": "en",
      "indexFile": "en/index.json"
    }
  ]
}
```

## Next Steps

1. Complete the translation of all lesson files for each language
2. Update the language-specific index.json files with proper titles
3. Test the system with different language selections
4. Add more languages as needed

## Notes

- The English folder serves as the source template
- All translations should maintain the same learning progression
- Consider adding language-specific cultural notes where appropriate
- Regular review and updates of translations may be needed
