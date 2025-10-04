/**
 * Dictionary of children's stories websites by language symbol
 * Keys are ISO 639-1 language codes, values are URLs to children's stories websites
 */
export const CHILDREN_STORIES_WEBSITES: Record<string, string> = {
  // English
  en: 'https://www.storylineonline.net/',
  
  // Spanish
  es: 'https://www.cuentosinfantiles.net/',
  
  // French
  fr: 'https://www.iletaitunehistoire.com/',
  
  // German
  de: 'https://www.vorleser.net/',
  
  // Italian
  it: 'https://www.favole.net/',
  
  // Portuguese
  pt: 'https://www.contosinfantis.com.br/',
  
  // Russian
  ru: 'https://www.detki-74.ru/',
  
  // Dutch
  nl: 'https://www.sprookjes.org/',
  
  // Polish
  pl: 'https://www.bajki-zasypianki.pl/',
  
  // Czech
  cs: 'https://www.pohadky.cz/',
  
  // Finnish
  fi: 'https://www.satukirja.fi/',
  
  // Norwegian
  no: 'https://www.eventyr.no/',
  
  // Swedish
  sv: 'https://www.sagor.se/',
  
  // Greek
  el: 'https://www.paramythia.gr/',
  
  // Hebrew
  he: 'https://www.sipur.net/',
  
  // Hindi
  hi: 'https://www.kahaniyan.com/',
  
  // Thai
  th: 'https://www.nanmeebooks.com/',
  
  // Ukrainian
  uk: 'https://www.kazky.org.ua/',
  
  // Vietnamese
  vi: 'https://www.truyencotich.vn/',
};

/**
 * Get a children's stories website URL for a given language code
 * @param languageCode - ISO 639-1 language code (e.g., 'en', 'es', 'fr')
 * @returns URL to children's stories website, or undefined if language not supported
 */
export const getChildrenStoriesWebsite = (languageCode: string): string | undefined => {
  return CHILDREN_STORIES_WEBSITES[languageCode.toLowerCase()];
};

/**
 * Get all supported language codes for children's stories
 * @returns Array of supported language codes
 */
export const getSupportedLanguages = (): string[] => {
  return Object.keys(CHILDREN_STORIES_WEBSITES);
};

/**
 * Check if a language code is supported for children's stories
 * @param languageCode - ISO 639-1 language code
 * @returns true if language is supported, false otherwise
 */
export const isLanguageSupported = (languageCode: string): boolean => {
  return languageCode.toLowerCase() in CHILDREN_STORIES_WEBSITES;
};
