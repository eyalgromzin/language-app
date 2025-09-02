import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateWord, getMyMemoryTranslation } from '../config/api';

// Simple FIFO cache backed by a dictionary and an insertion-order queue
const MAX_TRANSLATION_CACHE_SIZE = 500;
const translationCache: Record<string, string> = {};
const translationCacheOrder: string[] = [];

// Persistence wiring (React Native AsyncStorage)
const STORAGE_KEYS = {
  map: '@translation_cache_map_v1',
  order: '@translation_cache_order_v1',
};

let cacheLoaded = false;
let cacheLoadPromise: Promise<void> | null = null;
let persistScheduled = false;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

const makeCacheKey = (word: string, fromCode: string, toCode: string): string =>
  `${fromCode}|${toCode}|${word}`;

const getCached = (key: string): string | null => {
  const val = translationCache[key];
  return typeof val === 'string' ? val : null;
};

const setCached = (key: string, value: string): void => {
  if (translationCache[key] !== undefined) return;
  translationCache[key] = value;
  translationCacheOrder.push(key);
  if (translationCacheOrder.length > MAX_TRANSLATION_CACHE_SIZE) {
    const oldestKey = translationCacheOrder.shift();
    if (oldestKey !== undefined) delete translationCache[oldestKey];
  }
  schedulePersist();
};

const ensureCacheLoaded = async (): Promise<void> => {
  if (cacheLoaded) return;
  if (!cacheLoadPromise) cacheLoadPromise = loadCacheFromStorage();
  await cacheLoadPromise;
};

const loadCacheFromStorage = async (): Promise<void> => {
  try {
    const [[, mapJson], [, orderJson]] = await AsyncStorage.multiGet([
      STORAGE_KEYS.map,
      STORAGE_KEYS.order,
    ]);
    if (mapJson) {
      const parsedMap = JSON.parse(mapJson) as Record<string, string>;
      for (const k of Object.keys(parsedMap)) {
        translationCache[k] = parsedMap[k];
      }
    }
    if (orderJson) {
      const parsedOrder = JSON.parse(orderJson) as string[];
      for (const k of parsedOrder) translationCacheOrder.push(k);
    }
  } catch {}
  cacheLoaded = true;
};

const schedulePersist = (): void => {
  if (persistScheduled) return;
  persistScheduled = true;
  persistTimer && clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    persistScheduled = false;
    try {
      const payload: [string, string][] = [
        [STORAGE_KEYS.map, JSON.stringify(translationCache)],
        [STORAGE_KEYS.order, JSON.stringify(translationCacheOrder)],
      ];
      await AsyncStorage.multiSet(payload);
    } catch {}
  }, 750);
};

export const getLangCode = (nameOrNull: string | null | undefined, languageMappings: Record<string, string>): string | null => {
  if (!nameOrNull) return null;
  const code = languageMappings[nameOrNull];
  return typeof code === 'string' ? code : null;
};

export const fetchTranslation = async (
  word: string,
  fromLanguageName: string | null | undefined,
  toLanguageName: string | null | undefined,
  languageMappings: Record<string, string>
): Promise<string> => {
  const fromCode = getLangCode(fromLanguageName, languageMappings) || 'en';
  const toCode = getLangCode(toLanguageName, languageMappings) || 'en';
  if (!word || fromCode === toCode) return word;
  await ensureCacheLoaded();
  const normalizedWord = word.trim();
  const cacheKey = makeCacheKey(normalizedWord, fromCode, toCode);
  const cached = getCached(cacheKey);
  if (cached) return cached;
  
  try {
    // First try local server endpoint
    const text = await translateWord(normalizedWord, fromCode, toCode);
    if (typeof text === 'string' && text.trim().length > 0) {
      const t = text.trim();
      setCached(cacheKey, t);
      return t;
    }
  } catch {}
  
  // Fallback to direct external API if local server is unavailable
  try {
    const json = await getMyMemoryTranslation(normalizedWord, fromCode, toCode);
    const txt = json?.responseData?.translatedText;
    if (typeof txt === 'string' && txt.trim().length > 0) {
      const t = txt.trim();
      setCached(cacheKey, t);
      return t;
    }
  } catch {}
  
  return word;
};


