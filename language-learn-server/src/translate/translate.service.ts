import { Injectable } from '@nestjs/common';
import { WordCacheService } from '../cache/word-cache.service';

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

// Precompute case-insensitive lookups for both names and codes
const LANGUAGE_NAMES_LOWER_TO_CODE: Record<string, string> = Object.entries(LANGUAGE_NAME_TO_CODE).reduce(
    (acc, [name, code]) => {
        acc[name.toLowerCase()] = code;
        return acc;
    },
    {} as Record<string, string>,
);

const LANGUAGE_CODES_LOWER_TO_CANONICAL: Record<string, string> = Object.values(LANGUAGE_NAME_TO_CODE).reduce(
    (acc, code) => {
        acc[code.toLowerCase()] = code;
        return acc;
    },
    {} as Record<string, string>,
);

export const getLangCode = (nameOrCode: string | null | undefined): string | null => {
    if (!nameOrCode) return null;
    const normalized = nameOrCode.trim();
    if (normalized.length === 0) return null;

    // If it's already a valid language code (case-insensitive), return canonical form
    const byCode = LANGUAGE_CODES_LOWER_TO_CANONICAL[normalized.toLowerCase()];
    if (typeof byCode === 'string') return byCode;

    // Otherwise, attempt to map from language name (case-insensitive)
    const byName = LANGUAGE_NAMES_LOWER_TO_CODE[normalized.toLowerCase()];
    if (typeof byName === 'string') return byName;

    // Unknown input → let caller default to 'en'
    return null;
};

@Injectable()
export class TranslateService {
    constructor(private readonly wordCacheService: WordCacheService) {}

async fetchTranslation (
    word: string,
    fromLanguageSymbol: string | null | undefined,
    toLanguageSymbol: string | null | undefined
  ): Promise<string> {
    const fromCode = getLangCode(fromLanguageSymbol) || 'en';
    const toCode = getLangCode(toLanguageSymbol) || 'en';
    if (!word || fromCode === toCode) return word;

    // check cache first
    const cached = await this.wordCacheService.getCachedTranslation(word, fromCode, toCode);
    if (typeof cached === 'string' && cached.length > 0) {
        await this.wordCacheService.record(word);
        return cached;
    }

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${encodeURIComponent(fromCode)}|${encodeURIComponent(toCode)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const txt = json?.responseData?.translatedText;
        if (typeof txt === 'string' && txt.trim().length > 0) {
            const translated = txt.trim();
            await this.wordCacheService.setCachedTranslation(word, fromCode, toCode, translated);
            await this.wordCacheService.record(word);
            return translated;
        }
      }
    } catch {}
    return word;
  };
  
}


