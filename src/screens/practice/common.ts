import TTS from 'react-native-tts';
import Sound from 'react-native-sound';

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
  try {
    Sound.setCategory('Playback');
    const sound = new Sound('win_sound.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        return;
      }
      sound.play(() => {
        sound.release();
      });
    });
  } catch {}
}

export function playWrongFeedback(): void {
  try { TTS.stop(); } catch {}
  try {
    Sound.setCategory('Playback');
    const sound = new Sound('bad_sound.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        return;
      }
      sound.play(() => {
        sound.release();
      });
    });
  } catch {}
}

