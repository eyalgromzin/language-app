import { RunnerTask } from './types';

export function splitToTokens(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function filterUsefulWords(words: string[]): string[] {
  return words.filter(word => {
    // Filter out very short words, punctuation, and common articles/prepositions
    const cleanWord = word.replace(/[^\w\s]/g, '').trim();
    if (cleanWord.length < 2) return false;
    
    // Filter out common short words that aren't very useful for practice
    const commonWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'];
    if (commonWords.includes(cleanWord.toLowerCase())) return false;
    
    return true;
  });
}

// Helper function to add words from sentences in the native language to a distractor pool
export function addSentenceWordsToPool(
  distractorPool: string[],
  currentStepNativeLanguage: any,
  currentItemId: string,
  excludeText: string
): void {
  currentStepNativeLanguage.items.forEach((o: any) => {
    if (o.id !== currentItemId && o.type === 'sentence') {
      const sentenceWords = splitToTokens(o.text);
      sentenceWords.forEach((word: string) => {
        if (word && word !== excludeText && !distractorPool.includes(word)) {
          distractorPool.push(word);
        }
      });
    }
  });
}

// Helper function to add words from sentences in the learning language to a distractor pool
export function addLearningLanguageSentenceWordsToPool(
  distractorPool: string[],
  currentStepLearningLanguage: any,
  currentItemId: string,
  excludeText: string
): void {
  currentStepLearningLanguage.items.forEach((o: any) => {
    if (o.id !== currentItemId && o.type === 'sentence') {
      const sentenceWords = splitToTokens(o.text);
      sentenceWords.forEach((word: string) => {
        if (word && word !== excludeText && !distractorPool.includes(word)) {
          distractorPool.push(word);
        }
      });
    }
  });
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sampleN<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return shuffleArray(arr);
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length > 0) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a[idx]);
    a.splice(idx, 1);
  }
  return out;
}

export const cleanSentense = (sentence: string) => {
  return sentence
    .replace(/\.\.\./g, '') // Remove three dots
    .replace(/…/g, '') // Remove ellipsis character (U+2026)
    .replace(/\.\.\./g, '') // Remove any remaining three dots
    .trim();
};
