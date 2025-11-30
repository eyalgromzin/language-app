import * as RNFS from 'react-native-fs';
import { Alert, Platform, ToastAndroid } from 'react-native';
import { WordEntry } from '../types/words';
import wordCountService from './wordCountService';

const WORDS_FILE_PATH = `${RNFS.DocumentDirectoryPath}/words.json`;

/**
 * Creates a default numberOfCorrectAnswers object with all counters initialized to 0
 */
export function createDefaultNumberOfCorrectAnswers(): WordEntry['numberOfCorrectAnswers'] {
  return {
    missingLetters: 0,
    missingWords: 0,
    chooseTranslation: 0,
    chooseWord: 0,
    memoryGame: 0,
    writeTranslation: 0,
    writeWord: 0,
  };
}

/**
 * Creates a new WordEntry object with the provided data
 */
export function createWordEntry(
  word: string,
  translation: string,
  sentence?: string,
  itemId?: string
): WordEntry {
  return {
    word,
    translation,
    sentence: sentence || '',
    addedAt: new Date().toISOString(),
    itemId,
    numberOfCorrectAnswers: createDefaultNumberOfCorrectAnswers(),
  };
}

/**
 * Normalizes a word entry to ensure it has the correct structure
 */
export function normalizeWordEntry(entry: any): WordEntry {
  const base = entry && typeof entry === 'object' ? entry : {};
  const noa = (base as any).numberOfCorrectAnswers || {};
  const safeNoa = {
    missingLetters: Math.max(0, Number(noa.missingLetters) || 0),
    missingWords: Math.max(0, Number(noa.missingWords) || 0),
    chooseTranslation: Math.max(0, Number(noa.chooseTranslation) || 0),
    chooseWord: Math.max(0, Number(noa.chooseWord) || 0),
    memoryGame: Math.max(0, Number(noa.memoryGame) || 0),
    writeTranslation: Math.max(0, Number(noa.writeTranslation) || 0),
    writeWord: Math.max(0, Number(noa.writeWord) || 0),
    ...(noa.formulateSentence !== undefined && { formulateSentence: Math.max(0, Number(noa.formulateSentence) || 0) }),
    ...(noa.hearing !== undefined && { hearing: Math.max(0, Number(noa.hearing) || 0) }),
  };
  return { ...base, numberOfCorrectAnswers: safeNoa } as WordEntry;
}

/**
 * Reads all word entries from the file, normalizing them
 */
export async function readWordEntries(): Promise<WordEntry[]> {
  try {
    const exists = await RNFS.exists(WORDS_FILE_PATH);
    if (!exists) {
      return [];
    }
    const content = await RNFS.readFile(WORDS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(content);
    const arr = Array.isArray(parsed) ? parsed : [];
    return arr.map(normalizeWordEntry);
  } catch {
    return [];
  }
}

/**
 * Writes word entries to the file
 */
async function writeWordEntries(entries: WordEntry[]): Promise<void> {
  await RNFS.writeFile(WORDS_FILE_PATH, JSON.stringify(entries, null, 2), 'utf8');
}

/**
 * Checks if a word entry already exists based on word and sentence
 */
function wordExistsByWordAndSentence(entries: WordEntry[], word: string, sentence: string): boolean {
  return entries.some(
    (it) => it && typeof it === 'object' && it.word === word && (it.sentence || '') === (sentence || '')
  );
}

/**
 * Checks if a word entry already exists based on word and translation
 */
function wordExistsByWordAndTranslation(entries: WordEntry[], word: string, translation: string): boolean {
  return entries.some(
    (it) => it && typeof it === 'object' && it.word === word && it.translation === translation
  );
}

export type DuplicateCheckMode = 'wordAndSentence' | 'wordAndTranslation';

export interface SaveWordOptions {
  /** Whether to check authentication and show login gate if needed */
  checkAuthentication?: boolean;
  /** Function to show login gate if authentication check fails */
  showLoginGate?: () => void;
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
  /** Which word count service method to call when saving (for non-authenticated users) */
  incrementWordCount?: 'incrementTranslationsSaved' | 'incrementCategoriesWords';
  /** How to check for duplicates */
  duplicateCheckMode?: DuplicateCheckMode;
  /** Whether to show success/error messages */
  showMessages?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to add word at the beginning of the array (for deep links) */
  addToBeginning?: boolean;
  /** Custom callback when word already exists - returns true if caller handles messages */
  onWordExists?: (word: string) => boolean | void;
  /** Whether to still return true if word exists (for cases where caller handles messaging) */
  returnTrueIfExists?: boolean;
}

/**
 * Saves a word entry to the file, handling duplicates, authentication checks, and word count
 */
export async function saveWordEntry(entry: WordEntry, options: SaveWordOptions = {}): Promise<boolean> {
  const {
    checkAuthentication = false,
    showLoginGate,
    isAuthenticated = false,
    incrementWordCount,
    duplicateCheckMode = 'wordAndSentence',
    showMessages = true,
    successMessage,
    errorMessage,
    addToBeginning = false,
    onWordExists,
    returnTrueIfExists = false,
  } = options;

  // Check authentication if needed
  if (checkAuthentication && !isAuthenticated && showLoginGate) {
    await wordCountService.initialize();
    const currentCount = wordCountService.getWordCount();
    
    // Show login gate if this would be the 3rd word (after saving, count would be 3)
    if (currentCount.totalWordsAdded >= 2) {
      showLoginGate();
      return false;
    }
  }

  try {
    // Read existing entries
    const existingEntries = await readWordEntries();

    // Check for duplicates
    let exists = false;
    if (duplicateCheckMode === 'wordAndSentence') {
      exists = wordExistsByWordAndSentence(existingEntries, entry.word, entry.sentence || '');
    } else {
      exists = wordExistsByWordAndTranslation(existingEntries, entry.word, entry.translation);
    }

    if (exists) {
      if (onWordExists) {
        const handled = onWordExists(entry.word);
        if (returnTrueIfExists || handled === true) {
          return true;
        }
      } else if (showMessages && duplicateCheckMode === 'wordAndTranslation') {
        Alert.alert(
          'Word already exists',
          `"${entry.word}" is already in your word list.`,
          [{ text: 'OK' }]
        );
      }
      return returnTrueIfExists || false;
    }

    // Add entry
    const updatedEntries = addToBeginning
      ? [entry, ...existingEntries]
      : [...existingEntries, entry];

    // Save to file
    await writeWordEntries(updatedEntries);

    // Increment word count if needed
    if (!isAuthenticated && incrementWordCount) {
      if (incrementWordCount === 'incrementTranslationsSaved') {
        await wordCountService.incrementTranslationsSaved();
      } else if (incrementWordCount === 'incrementCategoriesWords') {
        await wordCountService.incrementCategoriesWords();
      }
    }

    // Show success message
    if (showMessages) {
      const message = successMessage || 'Word added to your list.';
      if (Platform.OS === 'android') {
        ToastAndroid.show(duplicateCheckMode === 'wordAndTranslation' ? 'Word added!' : 'Saved', ToastAndroid.SHORT);
      } else {
        Alert.alert(duplicateCheckMode === 'wordAndTranslation' ? 'Word added!' : 'Saved', message);
      }
    }

    return true;
  } catch (error) {
    console.error('[wordService] Error saving word:', error);
    
    // Show error message
    if (showMessages) {
      const message = errorMessage || 'Failed to save the word.';
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to save', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', message);
      }
    }
    
    return false;
  }
}

/**
 * Convenience function to create and save a word entry in one call
 */
export async function createAndSaveWord(
  word: string,
  translation: string,
  sentence?: string,
  options: SaveWordOptions = {}
): Promise<boolean> {
  const entry = createWordEntry(word, translation, sentence);
  return saveWordEntry(entry, options);
}

