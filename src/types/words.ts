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


