export const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  German: 'de',
  Italian: 'it',
  Portuguese: 'pt',
  Russian: 'ru',
  'Chinese (Mandarin)': 'zh-CN',
  Japanese: 'ja',
  Korean: 'ko',
  Arabic: 'ar',
  Hindi: 'hi',
  Turkish: 'tr',
  Polish: 'pl',
  Dutch: 'nl',
  Greek: 'el',
  Swedish: 'sv',
  Norwegian: 'no',
  Finnish: 'fi',
  Czech: 'cs',
  Ukrainian: 'uk',
  Hebrew: 'he',
  Thai: 'th',
  Vietnamese: 'vi',
};

// Simple FIFO cache backed by a dictionary and an insertion-order queue
const MAX_TRANSLATION_CACHE_SIZE = 500;
const translationCache: Record<string, string> = {};
const translationCacheOrder: string[] = [];

const makeCacheKey = (word: string, fromCode: string, toCode: string): string =>
  `${fromCode}|${toCode}|${word}`;

const getCached = (key: string): string | null => {
  const val = translationCache[key];
  return typeof val === 'string' ? val : null;
};

const setCached = (key: string, value: string): void => {
  if (translationCache[key] !== undefined) return;
  translationCache[key] = value;
  translationCacheOrder.push(key);
  if (translationCacheOrder.length > MAX_TRANSLATION_CACHE_SIZE) {
    const oldestKey = translationCacheOrder.shift();
    if (oldestKey !== undefined) delete translationCache[oldestKey];
  }
};

export const getLangCode = (nameOrNull: string | null | undefined): string | null => {
  if (!nameOrNull) return null;
  const code = LANGUAGE_NAME_TO_CODE[nameOrNull];
  return typeof code === 'string' ? code : null;
};

export const fetchTranslation = async (
  word: string,
  fromLanguageName: string | null | undefined,
  toLanguageName: string | null | undefined
): Promise<string> => {
  const fromCode = getLangCode(fromLanguageName) || 'en';
  const toCode = getLangCode(toLanguageName) || 'en';
  if (!word || fromCode === toCode) return word;
  const normalizedWord = word.trim();
  const cacheKey = makeCacheKey(normalizedWord, fromCode, toCode);
  const cached = getCached(cacheKey);
  if (cached) return cached;
  try {
    // First try local server endpoint
    const serverRes = await fetch('http://localhost:3000/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: normalizedWord,
        fromLanguageSymbol: fromCode,
        toLanguageSymbol: toCode,
      }),
    });
    if (serverRes.ok) {
      const text = await serverRes.text();
      if (typeof text === 'string' && text.trim().length > 0) {
        const t = text.trim();
        setCached(cacheKey, t);
        return t;
      }
    }
  } catch {}
  // Fallback to direct external API if local server is unavailable
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(normalizedWord)}&langpair=${encodeURIComponent(fromCode)}|${encodeURIComponent(toCode)}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const txt = json?.responseData?.translatedText;
      if (typeof txt === 'string' && txt.trim().length > 0) {
        const t = txt.trim();
        setCached(cacheKey, t);
        return t;
      }
    }
  } catch {}
  return word;
};


