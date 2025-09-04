import { Injectable } from '@nestjs/common';
import { WordCacheService } from '../cache/word-cache.service';
import { TranslationService } from '../database/services/translation.service';

export const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
    Czech: 'cs',
    German: 'de',
    Greek: 'el',
    English: 'en',
    Spanish: 'es',
    Finnish: 'fi',
    French: 'fr',
    Hebrew: 'he',
    Hindi: 'hi',
    Italian: 'it',
    Dutch: 'nl',
    Norwegian: 'no',
    Polish: 'pl',
    Portuguese: 'pt',
    Russian: 'ru',
    Swedish: 'sv',
    Thai: 'th',
    Ukrainian: 'uk',
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
    constructor(
        private readonly wordCacheService: WordCacheService,
        private readonly translationService: TranslationService
    ) {}

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

    // check translations table if not in cache
    const dbTranslation = await this.translationService.findTranslationByWord(word, fromCode);
    if (dbTranslation && Object.prototype.hasOwnProperty.call(dbTranslation, toCode)) {
        const foundTranslation = (dbTranslation as any)[toCode];
        await this.wordCacheService.setCachedTranslation(word, fromCode, toCode, foundTranslation);
        await this.wordCacheService.record(word);
        return foundTranslation;
    }

    // If not in cache or database, get from API
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${encodeURIComponent(fromCode)}|${encodeURIComponent(toCode)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const txt = json?.responseData?.translatedText;
        if (typeof txt === 'string' && txt.trim().length > 0) {
            const translated = txt.trim();
            
            // Save to translations table
            await this.translationService.saveTranslation(word, translated, fromCode, toCode);
            
            // Update cache
            await this.wordCacheService.setCachedTranslation(word, fromCode, toCode, translated);
            await this.wordCacheService.record(word);
            
            return translated;
        }
      }
    } catch {}
    return word;
  };
  
}


