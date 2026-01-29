/**
 * Utility functions for handling RTL languages
 */

// List of RTL language names
const RTL_LANGUAGES = ['hebrew', 'arabic', 'urdu', 'farsi', 'persian'];

/**
 * Check if a language name corresponds to an RTL language
 * @param languageName - The name of the language (case-insensitive)
 * @returns true if the language is RTL, false otherwise
 */
export const isRTLLanguage = (languageName: string | null): boolean => {
  if (!languageName) return false;
  return RTL_LANGUAGES.includes(languageName.toLowerCase());
};

/**
 * Get the text direction for a language
 * @param languageName - The name of the language
 * @returns 'rtl' if RTL, 'ltr' if LTR
 */
export const getTextDirection = (languageName: string | null): 'rtl' | 'ltr' => {
  return isRTLLanguage(languageName) ? 'rtl' : 'ltr';
};
