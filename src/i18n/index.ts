import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'react-native-localize';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import he from './locales/he.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import hi from './locales/hi.json';
import pl from './locales/pl.json';
import nl from './locales/nl.json';
import el from './locales/el.json';
import sv from './locales/sv.json';
import no from './locales/no.json';
import fi from './locales/fi.json';
import cs from './locales/cs.json';
import uk from './locales/uk.json';
import th from './locales/th.json';
import vi from './locales/vi.json';

// Language code to translation mapping
const resources = {
  en: { translation: en },
  es: { translation: es },
  he: { translation: he },
  fr: { translation: fr },
  de: { translation: de },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  hi: { translation: hi },
  pl: { translation: pl },
  nl: { translation: nl },
  el: { translation: el },
  sv: { translation: sv },
  no: { translation: no },
  fi: { translation: fi },
  cs: { translation: cs },
  uk: { translation: uk },
  th: { translation: th },
  vi: { translation: vi },
};

// Language name to code mapping (matching the server's API response)
const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  English: 'en',
  Spanish: 'es',
  Hebrew: 'he',
  French: 'fr',
  German: 'de',
  Italian: 'it',
  Portuguese: 'pt',
  Russian: 'ru',
  Hindi: 'hi',
  Polish: 'pl',
  Dutch: 'nl',
  Greek: 'el',
  Swedish: 'sv',
  Norwegian: 'no',
  Finnish: 'fi',
  Czech: 'cs',
  Ukrainian: 'uk',
  Thai: 'th',
  Vietnamese: 'vi',
};

// AsyncStorage key for storing the selected UI language
const UI_LANGUAGE_KEY = 'ui.language';

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    debug: __DEV__,
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

// Function to get the current UI language from AsyncStorage
export const getCurrentUILanguage = async (): Promise<string> => {
  try {
    const storedLanguage = await AsyncStorage.getItem(UI_LANGUAGE_KEY);
    if (storedLanguage && resources[storedLanguage as keyof typeof resources]) {
      return storedLanguage;
    }
    
    // Try to get from native language setting
    const nativeLanguage = await AsyncStorage.getItem('language.native');
    if (nativeLanguage && resources[nativeLanguage as keyof typeof resources]) {
      return nativeLanguage;
    }
    
    // Fallback to device locale
    const locales = getLocales();
    const deviceLanguage = locales[0]?.languageCode;
    if (deviceLanguage && resources[deviceLanguage as keyof typeof resources]) {
      return deviceLanguage;
    }
    
    return 'en';
  } catch (error) {
    console.error('Error getting UI language:', error);
    return 'en';
  }
};

// Function to set the UI language
export const setUILanguage = async (languageCode: string): Promise<void> => {
  try {
    if (resources[languageCode as keyof typeof resources]) {
      await AsyncStorage.setItem(UI_LANGUAGE_KEY, languageCode);
      await i18n.changeLanguage(languageCode);
    } else {
      console.warn(`Language code ${languageCode} not supported`);
    }
  } catch (error) {
    console.error('Error setting UI language:', error);
  }
};

// Function to get language code from language name
export const getLanguageCodeFromName = (languageName: string): string => {
  return LANGUAGE_NAME_TO_CODE[languageName] || 'en';
};

// Function to get language name from language code
export const getLanguageNameFromCode = (languageCode: string): string => {
  const entry = Object.entries(LANGUAGE_NAME_TO_CODE).find(([_, code]) => code === languageCode);
  return entry ? entry[0] : 'English';
};

// Initialize the language on app start
export const initializeLanguage = async (): Promise<void> => {
  try {
    const currentLanguage = await getCurrentUILanguage();
    await i18n.changeLanguage(currentLanguage);
  } catch (error) {
    console.error('Error initializing language:', error);
  }
};

export default i18n;
