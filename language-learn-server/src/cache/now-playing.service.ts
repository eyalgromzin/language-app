import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export type NowPlayingItem = {
  languageSymbol: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  url: string;
  length?: string;
  updated_at: number;
};

type PersistShape = Record<string, NowPlayingItem[]>; // key: languageSymbol

class ListNode {
  value: NowPlayingItem;
  prev: ListNode | null = null;
  next: ListNode | null = null;
  constructor(value: NowPlayingItem) {
    this.value = value;
  }
}

class DoublyLinkedList {
  private head: ListNode | null = null;
  private tail: ListNode | null = null;
  private _size = 0;

  get size(): number {
    return this._size;
  }

  unshift(node: ListNode): void {
    node.prev = null;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
    this._size++;
  }

  remove(node: ListNode): void {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (this.head === node) this.head = node.next;
    if (this.tail === node) this.tail = node.prev;
    node.prev = null;
    node.next = null;
    this._size--;
  }

  pop(): ListNode | null {
    if (!this.tail) return null;
    const node = this.tail;
    this.remove(node);
    return node;
  }

  toArray(): NowPlayingItem[] {
    const arr: NowPlayingItem[] = [];
    let cur = this.head;
    while (cur) {
      arr.push(cur.value);
      cur = cur.next;
    }
    return arr;
  }
}

type PerLanguageState = {
  list: DoublyLinkedList;
  byUrl: Map<string, ListNode>;
};

@Injectable()
export class NowPlayingService {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly filePath = path.join(this.dataDir, 'nowPlaying.json');
  private readonly maxPerLanguage = 20;

  private stateByLanguage: Map<string, PerLanguageState> = new Map();
  private initialized = false;
  private initializePromise: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    if (!this.initializePromise) {
      this.initializePromise = this.initializeFromDisk();
    }
    await this.initializePromise;
    this.initialized = true;
  }

  private async initializeFromDisk(): Promise<void> {
    const parsed = await this.loadFromDisk();
    
    this.stateByLanguage = new Map();
    if (parsed) {
      for (const [languageSymbol, items] of Object.entries(parsed)) {
        const list = new DoublyLinkedList();
        const byUrl = new Map<string, ListNode>();
        if (Array.isArray(items)) {
          // items stored newest-first; rebuild preserving order
          for (let i = items.length - 1; i >= 0; i--) {
            const raw = items[i];
            if (!raw || typeof raw.url !== 'string' || typeof raw.title !== 'string') continue;
            const normalized: NowPlayingItem = {
              languageSymbol,
              title: raw.title,
              ...(raw.description ? { description: String(raw.description) } : {}),
              ...(raw.thumbnailUrl ? { thumbnailUrl: String(raw.thumbnailUrl) } : {}),
              ...(raw.length ? { length: String(raw.length) } : {}),
              url: raw.url,
              updated_at: typeof raw.updated_at === 'number' ? raw.updated_at : Date.now(),
            };
            const node = new ListNode(normalized);
            list.unshift(node);
            byUrl.set(normalized.url, node);
          }
        }
        this.stateByLanguage.set(languageSymbol, { list, byUrl });
      }
    }
  }

  private async loadFromDisk(): Promise<PersistShape | undefined> {
    let parsed: PersistShape | null = null;
    try {
      const buf = await fs.readFile(this.filePath, 'utf8');
      const data = JSON.parse(buf);
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        parsed = data as PersistShape;
      }
    } catch {
      return undefined;
    }

    return parsed || undefined;
  }

  private async persist(): Promise<void> {
    try {
      const output: PersistShape = {};
      for (const [lang, state] of this.stateByLanguage.entries()) {
        output[lang] = state.list.toArray();
      }
      await fs.mkdir(this.dataDir, { recursive: true });
      const tmpPath = `${this.filePath}.tmp`;
      await fs.writeFile(tmpPath, JSON.stringify(output, null, 2), 'utf8');
      await fs.rename(tmpPath, this.filePath);
    } catch {
      // ignore persistence errors
    }
  }

  private getOrCreateState(languageSymbol: string): PerLanguageState {
    const key = languageSymbol.trim().toLowerCase();
    let state = this.stateByLanguage.get(key);
    if (!state) {
      state = { list: new DoublyLinkedList(), byUrl: new Map() };
      this.stateByLanguage.set(key, state);
    }
    return state;
  }

  async upsertNowPlaying(params: {
    languageSymbol: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    url: string;
    length?: string;
  }): Promise<void> {
    const languageSymbol = (params.languageSymbol ?? '').trim();
    const title = (params.title ?? '').trim();
    const url = (params.url ?? '').trim();
    const description = typeof params.description === 'string' ? params.description : undefined;
    const thumbnailUrl = typeof params.thumbnailUrl === 'string' ? params.thumbnailUrl : undefined;
    if (!languageSymbol || !title || !url) return;
    await this.ensureInitialized();

    const state = this.getOrCreateState(languageSymbol);
    const existing = state.byUrl.get(url);
    const now = Date.now();
    if (existing) {
      existing.value.updated_at = now;
      if (typeof description === 'string' && description.trim().length > 0) {
        existing.value.description = description;
      }
      if (typeof thumbnailUrl === 'string' && thumbnailUrl.trim().length > 0) {
        existing.value.thumbnailUrl = thumbnailUrl;
      }
      if (typeof params.length === 'string' && params.length.trim().length > 0) {
        existing.value.length = params.length;
      }
      // move to front in O(1)
      state.list.remove(existing);
      state.list.unshift(existing);
    } else {
      const node = new ListNode({
        languageSymbol,
        title,
        ...(description ? { description } : {}),
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
        ...(params.length ? { length: params.length } : {}),
        url,
        updated_at: now,
      });
      state.list.unshift(node);
      state.byUrl.set(url, node);
      // enforce capacity
      while (state.list.size > this.maxPerLanguage) {
        const removed = state.list.pop();
        if (removed) {
          state.byUrl.delete(removed.value.url);
        } else {
          break;
        }
      }
    }

    await this.persist();
  }

  async getNowPlaying(languageSymbol: string): Promise<NowPlayingItem[]> {
    await this.ensureInitialized();
    const state = this.getOrCreateState(languageSymbol);
    return state.list.toArray();
  }

  async getAllNowPlaying(): Promise<Record<string, NowPlayingItem[]>> {
    await this.ensureInitialized();
    const out: Record<string, NowPlayingItem[]> = {};
    for (const [lang, state] of this.stateByLanguage.entries()) {
      out[lang] = state.list.toArray();
    }
    return out;
  }
}


