export const FAVOURITE_TYPES = [
  { id: 1, name: 'article' },
  { id: 2, name: 'story' },
  { id: 3, name: 'conversation' },
  { id: 4, name: 'lyrics' },
  { id: 5, name: 'video' },
  { id: 6, name: 'book' },
  { id: 7, name: 'website' },
] as const;

export const normalizeUrl = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';
  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
  const startsWithWww = /^www\./i.test(trimmed);
  const looksLikeDomain = /^[^\s]+\.[^\s]{2,}$/.test(trimmed);
  const looksLikeIp = /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(trimmed);
  if (!hasScheme && (startsWithWww || looksLikeDomain || looksLikeIp)) {
    return `https://${trimmed}`;
  }
  return hasScheme ? trimmed : '';
};


function capitalizeFirstLetter(str: string): string {
  if (typeof str !== 'string' || str.length === 0) {
    return str; // Handle empty strings or non-string inputs
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const toLanguageSymbol = (input: string | null): string => {
  const v = capitalizeFirstLetter((input || '')).trim();
  
  // If it's already a symbol, return it
  if (v === 'en' || v === 'es' || v === 'fr' || v === 'de' || v === 'it' || v === 'pt' || v === 'ru' || v === 'zh' || v === 'ja' || v === 'ko' || v === 'ar' || v === 'hi' || v === 'tr' || v === 'pl' || v === 'nl' || v === 'el' || v === 'sv' || v === 'no' || v === 'fi' || v === 'cs' || v === 'uk' || v === 'he' || v === 'th' || v === 'vi') {
    return v;
  }
  
  // Map from common language names to symbols
  const languageMap: Record<string, string> = {
    'Czech': 'cs',
    'English': 'en',
    'Finnish': 'fi',
    'French': 'fr',
    'German': 'de',
    'Greek': 'el',
    'Hebrew': 'he',
    'Hindi': 'hi',
    'Italian': 'it',
    'Dutch': 'nl',
    'Norwegian': 'no',
    'Polish': 'pl',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Spanish': 'es',
    'Swedish': 'sv',
    'Thai': 'th',
    'Ukrainian': 'uk',
    'Vietnamese': 'vi',
  };
  
  const symbol = languageMap[v];
  if (symbol) {
    return symbol;
  }
  
  // Default to English if not found
  return 'en';
};

/**
 * Cleans a word by trimming whitespace and removing special characters (punctuation and symbols)
 * from both the beginning and end of the word.
 * Preserves letters, numbers, and Unicode characters in the middle.
 */
export const cleanWordForTranslation = (word: string): string => {
  if (!word || typeof word !== 'string') return '';
  // Trim whitespace, then remove punctuation and symbols from both sides
  return word.trim().replace(/^[\s\p{P}\p{S}]+|[\s\p{P}\p{S}]+$/gu, '').trim();
};