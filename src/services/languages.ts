import { API_CONFIG } from '../config/api';

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
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): LanguagesService {
    if (!LanguagesService.instance) {
      LanguagesService.instance = new LanguagesService();
    }
    return LanguagesService.instance;
  }

  async getLanguages(): Promise<Language[]> {
    // Return cached data if it's still valid
    if (this.languages.length > 0 && Date.now() - this.lastFetchTime < this.CACHE_DURATION) {
      return this.languages;
    }

    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      // Wait for the current request to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.languages;
    }

    this.isLoading = true;

    try {
      const response = await fetch(`${API_CONFIG.SERVER_URL}${API_CONFIG.ENDPOINTS.GET_LANGUAGES}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const languages = await response.json();
      
      // Validate the response structure
      if (Array.isArray(languages) && languages.every(lang => 
        typeof lang === 'object' && 
        typeof lang.id === 'number' && 
        typeof lang.name === 'string' && 
        typeof lang.symbol === 'string'
      )) {
        this.languages = languages;
        this.lastFetchTime = Date.now();
        return languages;
      } else {
        throw new Error('Invalid language data structure received from server');
      }
    } catch (error) {
      console.error('Error fetching languages from server:', error);
      
      // Return empty array on error, but don't clear existing cache
      if (this.languages.length === 0) {
        return [];
      }
      
      return this.languages;
    } finally {
      this.isLoading = false;
    }
  }

  // Get language names for display (used in pickers)
  async getLanguageNames(): Promise<string[]> {
    const languages = await this.getLanguages();
    return languages.map(lang => {
      // Capitalize first letter and ensure proper formatting
      const name = lang.name.toLowerCase();
      return name.charAt(0).toUpperCase() + name.slice(1);
    });
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
