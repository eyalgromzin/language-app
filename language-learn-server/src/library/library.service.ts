import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

type LibraryItem = {
  url: string;
  name?: string;
  language: string;
  typeId: number;
  level: string;
};

type LibraryData = {
  itemTypes: { id: number; name: string }[];
  levels: { id: number; name: string }[];
  languages: { id: number; name: string; symbol: string }[];
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

  private saveLibrary(data: LibraryData): void {
    fs.writeFileSync(LIBRARY_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
  }

  getUrlsByLanguage(language: string): { url: string; name: string; type: string; level: string }[] {
    console.log('getUrlsByLanguage', language);
    const data = this.loadLibrary();
    const typeIdToName = new Map<number, string>(data.itemTypes.map((t) => [t.id, t.name]));

    return data.library
      .filter((item) => item.language.toLowerCase() === language.toLowerCase())
      .map((item) => ({
        url: item.url,
        name: item.name ?? item.url,
        type: typeIdToName.get(item.typeId) ?? String(item.typeId),
        level: item.level,
      }));
  }

  getUrlsWithCriteria(
    language: string,
    level: string,
    type: string | number,
  ): { url: string; name: string; type: string; level: string }[] {
    console.log('getUrlsWithCriteria', language, level, type);      
    const data = this.loadLibrary();

    const typeId = this.resolveTypeId(data, type);
    const typeIdToName = new Map<number, string>(data.itemTypes.map((t) => [t.id, t.name]));

    return data.library
      .filter((item) =>
        item.language.toLowerCase() === language.toLowerCase() &&
        item.level.toLowerCase() === level.toLowerCase() &&
        item.typeId === typeId,
      )
      .map((item) => ({
        url: item.url,
        name: item.name ?? item.url,
        type: typeIdToName.get(item.typeId) ?? String(item.typeId),
        level: item.level,
      }));
  }

  addUrl(url: string, language: string, level: string, type: string | number, name?: string): LibraryItem {
    console.log('addUrl', url, language, level, type, name);
    if (!url || !language || !level || (type === undefined || type === null)) {
      throw new BadRequestException('Missing required fields: url, language, level, type');
    }

    const data = this.loadLibrary();
    const typeId = this.resolveTypeId(data, type);

    const newItem: LibraryItem = {
      url,
      name: name ?? url,
      language,
      typeId,
      level,
    };

    data.library.push(newItem);
    this.saveLibrary(data);
    return newItem;
  }

  private resolveTypeId(data: LibraryData, type: string | number): number {
    if (typeof type === 'number' && Number.isFinite(type)) {
      return type;
    }
    const typeName = String(type).toLowerCase();
    const match = data.itemTypes.find((t) => t.name.toLowerCase() === typeName);
    if (!match) {
      throw new BadRequestException(`Unknown type: ${type}`);
    }
    return match.id;
  }
}
