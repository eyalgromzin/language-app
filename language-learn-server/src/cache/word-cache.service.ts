import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

type TranslationEntry = {
    word: string;
    from: string;
    to: string;
    translation: string;
    timestamp: number;
};

@Injectable()
export class WordCacheService {
    private wordsMap: Map<string, boolean> = new Map();
    private translations: TranslationEntry[] = [];
    private readonly maxEntries = 500;
    private readonly dataDir = path.join(process.cwd(), 'data');
    private readonly wordsFilePath = path.join(this.dataDir, 'last_words.json');
    private readonly translationsFilePath = path.join(this.dataDir, 'last_translations_cache.json');
    private initialized = false;
    private initializePromise: Promise<void> | null = null;

    private async ensureInitialized(): Promise<void> {
        if (this.initialized) return;
        if (!this.initializePromise) {
            this.initializePromise = this.loadFromDisk();
        }
        await this.initializePromise;
        this.initialized = true;
    }

    private async loadFromDisk(): Promise<void> {
        try {
            const buf = await fs.readFile(this.wordsFilePath, 'utf8');
            const parsed = JSON.parse(buf);
            if (Array.isArray(parsed)) {
                this.wordsMap = new Map();
                for (const raw of parsed) {
                    if (typeof raw !== 'string') continue;
                    const w = raw.trim();
                    if (!w) continue;
                    if (this.wordsMap.has(w)) this.wordsMap.delete(w);
                    this.wordsMap.set(w, true);
                    while (this.wordsMap.size > this.maxEntries) {
                        const first = this.wordsMap.keys().next().value as string | undefined;
                        if (first === undefined) break;
                        this.wordsMap.delete(first);
                    }
                }
            }
        } catch {
            this.wordsMap = new Map();
        }
        try {
            const buf = await fs.readFile(this.translationsFilePath, 'utf8');
            const parsed = JSON.parse(buf);
            if (Array.isArray(parsed)) {
                this.translations = parsed.filter((e) =>
                    e && typeof e.word === 'string' && typeof e.from === 'string' && typeof e.to === 'string' && typeof e.translation === 'string'
                );
            }
        } catch {
            this.translations = [];
        }
    }

    private async persistWords(): Promise<void> {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            const tmpPath = `${this.wordsFilePath}.tmp`;
            await fs.writeFile(tmpPath, JSON.stringify(Array.from(this.wordsMap.keys()), null, 2), 'utf8');
            await fs.rename(tmpPath, this.wordsFilePath);
        } catch {
            // ignore
        }
    }

    private async persistTranslations(): Promise<void> {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            const tmpPath = `${this.translationsFilePath}.tmp`;
            await fs.writeFile(tmpPath, JSON.stringify(this.translations, null, 2), 'utf8');
            await fs.rename(tmpPath, this.translationsFilePath);
        } catch {
            // ignore
        }
    }

    async record(word: string | null | undefined): Promise<void> {
        const normalized = typeof word === 'string' ? word.trim() : '';
        if (!normalized) return;
        await this.ensureInitialized();
        if (this.wordsMap.has(normalized)) this.wordsMap.delete(normalized);
        this.wordsMap.set(normalized, true);
        while (this.wordsMap.size > this.maxEntries) {
            const first = this.wordsMap.keys().next().value as string | undefined;
            if (first === undefined) break;
            this.wordsMap.delete(first);
        }
        await this.persistWords();
    }

    async getLastWords(): Promise<string[]> {
        await this.ensureInitialized();
        return Array.from(this.wordsMap.keys());
    }

    async getCachedTranslation(word: string, from: string, to: string): Promise<string | null> {
        await this.ensureInitialized();
        const w = word.trim();
        const f = from.trim();
        const t = to.trim();
        if (!w || !f || !t) return null;
        for (let i = this.translations.length - 1; i >= 0; i--) {
            const e = this.translations[i];
            if (e.word === w && e.from === f && e.to === t) {
                return e.translation;
            }
        }
        return null;
    }

    async setCachedTranslation(word: string, from: string, to: string, translation: string): Promise<void> {
        await this.ensureInitialized();
        const w = word.trim();
        const f = from.trim();
        const t = to.trim();
        const tr = translation.trim();
        if (!w || !f || !t || !tr) return;
        // remove older duplicates
        this.translations = this.translations.filter((e) => !(e.word === w && e.from === f && e.to === t));
        this.translations.push({ word: w, from: f, to: t, translation: tr, timestamp: Date.now() });
        while (this.translations.length > this.maxEntries) {
            this.translations.shift();
        }
        await this.persistTranslations();
    }
}


