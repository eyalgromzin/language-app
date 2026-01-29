import { WordEntry } from '../../../types/words';

export type WordGroup = {
  startIdx: number;
  endIdx: number;
  letters: string[];
};

export function ensureCounters(entry: WordEntry): WordEntry {
  return {
    ...entry,
    numberOfCorrectAnswers: entry.numberOfCorrectAnswers || {
      missingLetters: 0,
      missingWords: 0,
      chooseTranslation: 0,
      chooseWord: 0,
      memoryGame: 0,
      writeTranslation: 0,
      writeWord: 0,
    },
  };
}

export function pickMissingIndices(letters: string[], desiredCount: number): number[] {
  const candidateIndices: number[] = [];
  for (let i = 0; i < letters.length; i += 1) {
    const ch = letters[i];
    if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) {
      candidateIndices.push(i);
    }
  }
  if (candidateIndices.length === 0) return [];
  const desired = Math.max(1, Math.min(candidateIndices.length, Math.floor(desiredCount)));
  const result: number[] = [];
  const pool = [...candidateIndices];
  while (result.length < desired && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result.sort((a, b) => a - b);
}

export function splitLetters(word: string): string[] {
  // Split into simple code units for now
  return Array.from(word);
}

export function groupLettersByWords(letters: string[]): WordGroup[] {
  const groups: WordGroup[] = [];
  let currentStart = 0;
  
  for (let i = 0; i < letters.length; i++) {
    if (letters[i] === ' ') {
      if (currentStart < i) {
        groups.push({
          startIdx: currentStart,
          endIdx: i - 1,
          letters: letters.slice(currentStart, i),
        });
      }
      currentStart = i + 1;
    }
  }
  
  // Add the last word if there's any remaining
  if (currentStart < letters.length) {
    groups.push({
      startIdx: currentStart,
      endIdx: letters.length - 1,
      letters: letters.slice(currentStart),
    });
  }
  
  // If no spaces found, return single group with all letters
  if (groups.length === 0) {
    groups.push({
      startIdx: 0,
      endIdx: letters.length - 1,
      letters: letters,
    });
  }
  
  return groups;
}

// Compare user input to the target word allowing plain vowels for accented vowels (á, é, í, ó, ú) and ignoring case
export function normalizeForCompare(input: string): string {
  return input
    .toLowerCase()
    .replace(/[áÁ]/g, 'a')
    .replace(/[éÉ]/g, 'e')
    .replace(/[íÍ]/g, 'i')
    .replace(/[óÓ]/g, 'o')
    .replace(/[úÚ]/g, 'u');
}

export function isAlphabeticChar(ch: string): boolean {
  return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(ch);
}

export function pickRandomIndex(length: number, previous?: number): number {
  if (length <= 0) return 0;
  if (length === 1) return 0;
  let nextIndex = Math.floor(Math.random() * length);
  if (typeof previous === 'number' && nextIndex === previous) {
    nextIndex = (nextIndex + 1) % length;
  }
  return nextIndex;
}
