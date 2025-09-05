import AsyncStorage from '@react-native-async-storage/async-storage';

const WORD_COUNT_KEY = 'user.word_count';
const LOGIN_REQUIRED_THRESHOLD = 3; // Show login after 3 words (4th word attempt)

export interface WordCountData {
  categoriesWordsAdded: number;
  translationsSaved: number;
  totalWordsAdded: number;
}

class WordCountService {
  private wordCountData: WordCountData = {
    categoriesWordsAdded: 0,
    translationsSaved: 0,
    totalWordsAdded: 0,
  };

  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(WORD_COUNT_KEY);
      if (stored) {
        this.wordCountData = JSON.parse(stored);
      }
    } catch (error) {
      console.log('[WordCountService] Error loading word count:', error);
    }
  }

  async incrementCategoriesWords(): Promise<number> {
    this.wordCountData.categoriesWordsAdded += 1;
    this.wordCountData.totalWordsAdded += 1;
    await this.save();
    return this.wordCountData.categoriesWordsAdded;
  }

  async incrementTranslationsSaved(): Promise<number> {
    this.wordCountData.translationsSaved += 1;
    this.wordCountData.totalWordsAdded += 1;
    await this.save();
    return this.wordCountData.translationsSaved;
  }

  getWordCount(): WordCountData {
    return { ...this.wordCountData };
  }

  shouldShowLoginGate(): boolean {
    return this.wordCountData.totalWordsAdded >= LOGIN_REQUIRED_THRESHOLD;
  }

  async reset(): Promise<void> {
    this.wordCountData = {
      categoriesWordsAdded: 0,
      translationsSaved: 0,
      totalWordsAdded: 0,
    };
    await this.save();
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(WORD_COUNT_KEY, JSON.stringify(this.wordCountData));
    } catch (error) {
      console.log('[WordCountService] Error saving word count:', error);
    }
  }
}

export default new WordCountService();
