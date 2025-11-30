import { cachedApiService } from './cachedApiService';

export interface Language {
  id: number;
  name: string;
  symbol: string;
}

export class LanguagesService {
  private static instance: LanguagesService;
  private languages: Language[] = [];
  private isLoading = false;
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): LanguagesService {
    if (!LanguagesService.instance) {
      LanguagesService.instance = new LanguagesService();
    }
    return LanguagesService.instance;
  }

  async getLanguages(): Promise<Language[]> {
    // Return in-memory cached data if it's still valid
    if (this.languages.length > 0 && Date.now() - this.lastFetchTime < this.CACHE_DURATION) {
      return [...this.languages].sort((a, b) => a.name.localeCompare(b.name));
    }

    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      // Wait for the current request to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return [...this.languages].sort((a, b) => a.name.localeCompare(b.name));
    }

    this.isLoading = true;

    try {
      // Use cachedApiService which handles local cache checking and API fetching
      const languages = await cachedApiService.getLanguages();
      
      // Validate the response structure
      if (Array.isArray(languages) && languages.every(lang => 
        typeof lang === 'object' && 
        typeof lang.id === 'number' && 
        typeof lang.name === 'string' && 
        typeof lang.symbol === 'string'
      )) {
        const sortedLanguages = languages.sort((a, b) => a.name.localeCompare(b.name));
        
        // Update in-memory cache for backward compatibility
        this.languages = sortedLanguages;
        this.lastFetchTime = Date.now();
        
        return [...this.languages];
      } else {
        throw new Error('Invalid language data structure received from server');
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      
      // Return empty array on error, but don't clear existing cache
      if (this.languages.length === 0) {
        return [];
      }
      
      return [...this.languages].sort((a, b) => a.name.localeCompare(b.name));
    } finally {
      this.isLoading = false;
    }
  }

  // Get language names for display (used in pickers)
  async getLanguageNames(): Promise<string[]> {
    const languages = await this.getLanguages();
    const names = languages.map(lang => {
      // Capitalize first letter and ensure proper formatting
      const name = lang.name.toLowerCase();
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
    return names.sort();
  }

  // Get language by name
  async getLanguageByName(name: string): Promise<Language | undefined> {
    const languages = await this.getLanguages();
    return languages.find(lang => lang.name === name);
  }

  // Get language by symbol
  async getLanguageBySymbol(symbol: string): Promise<Language | undefined> {
    const languages = await this.getLanguages();
    return languages.find(lang => lang.symbol === symbol);
  }

  // Clear cache (useful for testing or when data might be stale)
  clearCache(): void {
    this.languages = [];
    this.lastFetchTime = 0;
  }
}

export const languagesService = LanguagesService.getInstance();
