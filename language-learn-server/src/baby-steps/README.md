# Baby Steps Language Learning Structure

This directory contains language learning steps organized by language and step category.

## Structure

```
baby-steps/
├── index.json                 # Main index listing all available languages
├── en/                       # English language folder
│   ├── index.json           # English language index with all steps
│   ├── 01_essentials.json   # Step 1: Greetings & politeness
│   ├── 02_introductions.json # Step 2: Introductions & basic info
│   ├── 03_core_verbs_pronouns.json # Step 3: Core pronouns & helper verbs
│   ├── 04_numbers_time_basics.json # Step 4: Numbers & time basics
│   ├── 05_getting_around.json # Step 5: Directions & getting around
│   ├── 06_food_drink_basics.json # Step 6: Food & drink basics
│   ├── 07_shopping_money.json # Step 7: Shopping & money
│   ├── 08_travel_hotel.json # Step 8: Travel & hotel
│   ├── 09_emergencies_health.json # Step 9: Emergencies & health
│   ├── 10_daily_routines.json # Step 10: Daily routines & common verbs
│   ├── 11_family_people.json # Step 11: Family & people
│   ├── 12_weather_smalltalk.json # Step 12: Weather & small talk
│   ├── 13_work_study.json # Step 13: Work & study basics
│   ├── 14_plans_invitations.json # Step 14: Making plans & invitations
│   ├── 15_requests_help.json # Step 15: Requests & asking for help
│   ├── 16_phone_internet.json # Step 16: Phone & internet
│   ├── 17_restaurant.json # Step 17: At the restaurant
│   ├── 18_transportation_details.json # Step 18: Transportation details
│   ├── 19_housing_utilities.json # Step 19: Housing & utilities
│   └── 20_connectors_advanced.json # Step 20: Connectors & advanced phrases
└── [other_languages]/        # Future language folders (e.g., fr/, de/, es/)
```

## File Format

Each step file contains:
- `id`: Unique identifier for the step
- `title`: Human-readable title
- `emoji`: Visual representation
- `language`: Language name
- `items`: Array of learning items (words/sentences)

Each item contains:
- `id`: Unique identifier for the item
- `type`: Either "word" or "sentence"
- `text`: The actual text to learn
- `practiceType`: Practice method (e.g., "chooseTranslation", "formulateSentense")

## Adding New Languages

To add a new language:

1. Create a new folder (e.g., `fr/` for French)
2. Create individual step files following the same naming convention
3. Create an `index.json` file for the language
4. Update the main `index.json` to include the new language

## Benefits of This Structure

- **Modularity**: Each step is a separate file, making it easier to maintain
- **Scalability**: Easy to add new languages without affecting existing ones
- **Organization**: Clear separation between languages and steps
- **Maintainability**: Individual files are easier to edit and review
- **Reusability**: Steps can be easily referenced and combined
