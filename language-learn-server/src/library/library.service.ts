import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

type LibraryItem = {
  url: string;
  name: string;
  language: string;
  typeId: number;
  level: string | number;
  media: string;
};

type LibraryData = {
  itemTypes: { id: number; name: string }[];
  levels: { id: number; name: string }[];
  languages: { id: number; name: string; symbol: string }[];
  media?: { id: number; name: string }[];
  library: LibraryItem[];
};

const LIBRARY_JSON_PATH = path.join(process.cwd(), 'src', 'library', 'library.json');

@Injectable()
export class LibraryService {
  private loadLibrary(): LibraryData {
    if (!fs.existsSync(LIBRARY_JSON_PATH)) {
      throw new BadRequestException('library.json not found');
    }
    const raw = fs.readFileSync(LIBRARY_JSON_PATH, 'utf8');
    return JSON.parse(raw) as LibraryData;
  }

  getMeta(): { itemTypes: string[]; levels: string[] } {
    const data = this.loadLibrary();
    const itemTypes = data.itemTypes.map((t) => t.name);
    const levels = data.levels.map((l) => l.name);
    return { itemTypes, levels };
  }

  private saveLibrary(data: LibraryData): void {
    fs.writeFileSync(LIBRARY_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
  }

  getLanguageNameBySymbol(symbol: string): string | undefined {
    if (!symbol) return undefined;
    const data = this.loadLibrary();
    const sym = symbol.trim().toLowerCase();
    const match = data.languages.find((l) => l.symbol.trim().toLowerCase() === sym);
    return match?.name;
  }

  getUrlsByLanguage(languageOrSymbol: string): { url: string; name?: string; type: string; level: string; media: string }[] {
    const data = this.loadLibrary();
    const typeIdToName = new Map<number, string>(data.itemTypes.map((t) => [t.id, t.name]));
    const levelIdToName = new Map<number, string>(data.levels.map((l) => [l.id, l.name]));

    const requested = (languageOrSymbol || '').trim().toLowerCase();
    const bySymbol = data.languages.find((l) => l.symbol.trim().toLowerCase() === requested)?.symbol.toLowerCase();
    const byName = data.languages.find((l) => l.name.trim().toLowerCase() === requested)?.symbol.toLowerCase();
    const canonicalSymbol = bySymbol || byName || requested;

    return data.library
      .filter((item) => (item.language || '').toLowerCase() === canonicalSymbol)
      .map((item) => ({
        url: item.url,
        name: item.name,
        type: typeIdToName.get(item.typeId) ?? String(item.typeId),
        level: typeof item.level === 'number' ? (levelIdToName.get(item.level) ?? String(item.level)) : item.level,
        media: item.media,
      }));
  }

  getUrlsWithCriteria(
    languageOrSymbol: string,
    level?: string | number,
    type?: string | number,
    media?: string,
  ): { url: string; name?: string; type: string; level: string; media: string }[] {
    const data = this.loadLibrary();

    const requested = (languageOrSymbol || '').trim().toLowerCase();
    const bySymbol = data.languages.find((l) => l.symbol.trim().toLowerCase() === requested)?.symbol.toLowerCase();
    const byName = data.languages.find((l) => l.name.trim().toLowerCase() === requested)?.symbol.toLowerCase();
    const canonicalSymbol = bySymbol || byName || requested;

    const typeId =
      type === undefined || (typeof type === 'string' && type.trim().toLowerCase() === 'all')
        ? null
        : this.resolveTypeId(data, type as string | number);
    const requestedLevelName =
      level === undefined || (typeof level === 'string' && level.trim().toLowerCase() === 'all')
        ? null
        : this.resolveLevelName(data, level as string | number)?.toLowerCase();
    const requestedMedia =
      media === undefined || String(media).trim().toLowerCase() === 'all'
        ? null
        : String(media).trim().toLowerCase();

    const typeIdToName = new Map<number, string>(data.itemTypes.map((t) => [t.id, t.name]));
    const levelIdToName = new Map<number, string>(data.levels.map((l) => [l.id, l.name]));

    return data.library
      .filter((item) =>
        (item.language || '').toLowerCase() === canonicalSymbol &&
        (requestedLevelName ? this.resolveLevelName(data, item.level)?.toLowerCase() == requestedLevelName : true) &&
        (typeId !== null ? item.typeId === typeId : true) &&
        (requestedMedia ? (item.media || '').toLowerCase() === requestedMedia : true),
      )
      .map((item) => ({
        url: item.url,
        name: item.name,
        type: typeIdToName.get(item.typeId) ?? String(item.typeId),
        level: typeof item.level === 'number' ? (levelIdToName.get(item.level) ?? String(item.level)) : item.level,
        media: item.media,
      }));
  }

  addUrl(url: string, language: string, level: string | number, type: string | number, name: string, media: string): LibraryItem {
    if (!url || !language || !level || (type === undefined || type === null)) {
      throw new BadRequestException('Missing required fields: url, language, level, type');
    }

    const data = this.loadLibrary();
    const normalizedUrl = url.trim();
    const existing = data.library.find((item) => item.url.trim() === normalizedUrl);
    if (existing) {
      return existing;
    }
    const typeId = this.resolveTypeId(data, type) ?? 1;
    // Validate level exists
    this.resolveLevelName(data, level);

    const newItem: LibraryItem = {
      url: normalizedUrl,
      name: name,
      language,
      typeId,
      level,
      media: media,
    };

    data.library.push(newItem);
    this.saveLibrary(data);
    return newItem;
  }

  private resolveTypeId(data: LibraryData, type: string | number): number | undefined {
    if (typeof type === 'number' && Number.isFinite(type)) {
      return type;
    }
    const typeName = String(type).toLowerCase();
    const match = data.itemTypes.find((t) => t.name.toLowerCase() === typeName);
    if (!match) {
      return undefined;
    }
    return match.id;
  }

  private resolveLevelName(data: LibraryData, level: string | number): string | undefined {
    if (typeof level === 'number' && Number.isFinite(level)) {
      const match = data.levels.find((l) => l.id === level);
      if (!match) {
        throw new BadRequestException(`Unknown level id: ${level}`);
      }
      return match.name;
    }
    const levelName = String(level).toLowerCase();
    const match = data.levels.find((l) => l.name.toLowerCase() === levelName);
    if (!match) {
      return undefined;
    }
    return match.name;
  }
}
