# Baby Steps - Multiple Practice Types

## Overview
The baby-steps system now supports multiple practice types for each word or sentence, allowing for more comprehensive learning experiences. Multiple practice types can be specified by separating them with commas in the `practiceType` field.

## Available Practice Types

### Word Practice Types
- `chooseTranslation` - Choose the correct translation from multiple options
- `chooseWord` - Choose the correct word when given a translation
- `hearing` - Practice listening comprehension with translation options
- `translationMissingLetters` - Fill in missing letters in the translation
- `wordMissingLetters` - Fill in missing letters in the word
- `writeWord` - Write the word with some letters missing

### Sentence Practice Types
- `formulateSentense` - Arrange shuffled words to form the correct sentence
- `missingWords` - Fill in missing words in the sentence

## Usage Examples

### Single Practice Type (Legacy)
```json
{
  "id": "example_word",
  "type": "word",
  "text": "hello",
  "practiceType": "chooseTranslation"
}
```

### Multiple Practice Types
```json
{
  "id": "example_word",
  "type": "word",
  "text": "hello",
  "practiceType": "chooseTranslation,chooseWord,wordMissingLetters"
}
```

### Sentence with Multiple Practice Types
```json
{
  "id": "example_sentence",
  "type": "sentence",
  "text": "Good morning.",
  "practiceType": "formulateSentense,missingWords"
}
```

## How It Works

1. **Parsing**: The system splits the `practiceType` field by commas and trims whitespace
2. **Task Generation**: For each practice type, a corresponding task is created
3. **Multiple Tasks**: One word/sentence can now generate multiple practice tasks
4. **Fallback Logic**: If no valid practice types are found, the system falls back to default behavior

## Benefits

- **Variety**: Learners encounter different types of practice for the same content
- **Reinforcement**: Multiple practice types help reinforce learning
- **Flexibility**: Content creators can design comprehensive learning experiences
- **Backward Compatibility**: Existing single practice type files continue to work

## Best Practices

- Use 2-3 practice types per item for optimal learning
- Mix different types of practice (recognition, production, comprehension)
- Consider the difficulty level when combining practice types
- Test combinations to ensure they work well together

## Example Combinations

### For Basic Words
```
"practiceType": "chooseTranslation,chooseWord"
```

### For Complex Words
```
"practiceType": "chooseTranslation,wordMissingLetters,writeWord"
```

### For Sentences
```
"practiceType": "formulateSentense,missingWords"
```

### For Advanced Practice
```
"practiceType": "chooseTranslation,hearing,translationMissingLetters"
```
