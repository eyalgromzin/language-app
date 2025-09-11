import { useTranslation as useI18nTranslation } from 'react-i18next';
import { getCurrentUILanguage, setUILanguage } from '../i18n';

// Custom hook that extends react-i18next's useTranslation
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  // Function to change the UI language
  const changeLanguage = async (languageCode: string) => {
    await setUILanguage(languageCode);
  };

  // Function to get current language
  const getCurrentLanguage = () => {
    return i18n.language;
  };

  // Function to get available languages
  const getAvailableLanguages = () => {
    return Object.keys(i18n.options.resources || {});
  };

  return {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    i18n,
  };
};

export default useTranslation;
