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
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${encodeURIComponent(fromCode)}|${encodeURIComponent(toCode)}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const txt = json?.responseData?.translatedText;
      if (typeof txt === 'string' && txt.trim().length > 0) return txt.trim();
    }
  } catch {}
  return word;
};


