import TTS from 'react-native-tts';

export const LANGUAGE_NAME_TO_TTS: Record<string, string> = {
  English: 'en-US',
  Spanish: 'es-ES',
  French: 'fr-FR',
  German: 'de-DE',
  Italian: 'it-IT',
  Portuguese: 'pt-PT',
  Russian: 'ru-RU',
  'Chinese (Mandarin)': 'zh-CN',
  Japanese: 'ja-JP',
  Korean: 'ko-KR',
  Arabic: 'ar-SA',
  Hindi: 'hi-IN',
  Turkish: 'tr-TR',
  Polish: 'pl-PL',
  Dutch: 'nl-NL',
  Greek: 'el-GR',
  Swedish: 'sv-SE',
  Norwegian: 'nb-NO',
  Finnish: 'fi-FI',
  Czech: 'cs-CZ',
  Ukrainian: 'uk-UA',
  Hebrew: 'he-IL',
  Thai: 'th-TH',
  Vietnamese: 'vi-VN',
};


export function getTtsLangCode(nameOrNull: string | null | undefined): string | null {
  if (!nameOrNull) return null;
  const code = LANGUAGE_NAME_TO_TTS[nameOrNull];
  return typeof code === 'string' ? code : null;
}


export function playCorrectFeedback(): void {
  try { TTS.stop(); } catch {}
  try { TTS.speak('wuuhuuu!'); } catch {}
}

export function playWrongFeedback(): void {
  try { TTS.stop(); } catch {}
  try { TTS.speak('beee'); } catch {}
}

