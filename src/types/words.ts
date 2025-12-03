export type LocalizedText = Record<string, string>;

export type WordItem = {
  id: string;
  type: 'word' | 'sentence';
  text: LocalizedText;
  example?: LocalizedText;
};

export type WordCategoryType = {
  id: string;
  emoji?: string;
  name: LocalizedText;
  description?: LocalizedText;
  items: WordItem[];
};

export type WordEntry = {
  word: string;
  translation: string;
  sentence?: string;
  addedAt?: string;
  itemId?: string;
  numberOfCorrectAnswers?: {
    missingLetters: number;
    missingWords: number;
    chooseTranslation: number;
    chooseWord: number;
    memoryGame: number;
    writeTranslation: number;
    writeWord: number;
    formulateSentence?: number;
    hearing?: number;
    flipCards?: number;
  };
};


