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
  Hindi: 'hi-IN',
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

// Language code to TTS language code mapping
export const LANGUAGE_CODE_TO_TTS: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-PT',
  ru: 'ru-RU',
  hi: 'hi-IN',
  pl: 'pl-PL',
  nl: 'nl-NL',
  el: 'el-GR',
  sv: 'sv-SE',
  no: 'nb-NO', // Norwegian
  fi: 'fi-FI',
  cs: 'cs-CZ',
  uk: 'uk-UA',
  he: 'he-IL',
  th: 'th-TH',
  vi: 'vi-VN',
};

export function getTtsLangCode(nameOrCode: string | null | undefined): string | null {
  if (!nameOrCode) return null;
  
  // First try language code mapping (e.g., "en" -> "en-US")
  const codeFromCode = LANGUAGE_CODE_TO_TTS[nameOrCode];
  if (codeFromCode) return codeFromCode;
  
  // Then try language name mapping (e.g., "English" -> "en-US")
  const codeFromName = LANGUAGE_NAME_TO_TTS[nameOrCode];
  if (codeFromName) return codeFromName;
  
  // If no match found, return null
  return null;
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
    const sound = new Sound('bad_sound2.wav', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        return;
      }
      sound.play(() => {
        sound.release();
      });
    });
  } catch {}
}


export function parseYandexImageUrlsFromHtml(html: string): string[] {
  try {
    const results: string[] = [];
    const imgTagRegex = /<img\b[^>]*class=(["'])([^"']*?)\1[^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = imgTagRegex.exec(html)) !== null) {
      const classAttr = match[2] || '';
      if (
        classAttr.indexOf('ImagesContentImage-Image') !== -1 &&
        classAttr.indexOf('ImagesContentImage-Image_clickable') !== -1
      ) {
        const tag = match[0];
        let url: string | null = null;
        const srcsetMatch = /srcset=(["'])([^"']+?)\1/i.exec(tag);
        if (srcsetMatch && srcsetMatch[2]) {
          url = srcsetMatch[2].split(',')[0].trim().split(/\s+/)[0];
        }
        if (!url) {
          const dataSrcMatch = /data-src=(["'])([^"']+?)\1/i.exec(tag);
          if (dataSrcMatch && dataSrcMatch[2]) url = dataSrcMatch[2];
        }
        if (!url) {
          const srcMatch = /src=(["'])([^"']+?)\1/i.exec(tag);
          if (srcMatch && srcMatch[2]) url = srcMatch[2];
        }
        if (url) {
          let normalized = url;
          if (normalized.startsWith('//')) normalized = 'https:' + normalized;
          else if (normalized.startsWith('/')) normalized = 'https://yandex.com' + normalized;
          if (!results.includes(normalized)) {
            results.push(normalized);
            if (results.length >= 6) break;
          }
        }
      }
    }
    return results.slice(0, 6);
  } catch {
    return [];
  }
}

export interface ImageScrapeCallbacks {
  onImageScrapeStart: (url: string, word: string) => void;
  onImageScrapeComplete: (urls: string[]) => void;
  onImageScrapeError: () => void;
}

export const fetchImageUrls = async (
  word: string, 
  callbacks: ImageScrapeCallbacks
): Promise<string[]> => {
  const searchUrl = `https://yandex.com/images/search?text=${encodeURIComponent(word)}`;
  
  return new Promise<string[]>((resolve, reject) => {
    callbacks.onImageScrapeStart(searchUrl, word);
    
    // Store the callbacks for later use
    const originalOnComplete = callbacks.onImageScrapeComplete;
    const originalOnError = callbacks.onImageScrapeError;
    
    callbacks.onImageScrapeComplete = (urls: string[]) => {
      originalOnComplete(urls);
      if (Array.isArray(urls) && urls.length > 0) {
        resolve(urls.slice(0, 6));
      } else {
        resolve([]);
      }
    };
    
    callbacks.onImageScrapeError = () => {
      originalOnError();
      resolve([]);
    };
  }).catch(() => [] as string[]);
};
