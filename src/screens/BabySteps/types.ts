export type StepItem = {
  id: string;
  title?: string;
  type?: 'word' | 'sentence';
  text: string;
  practiceType?: 'chooseTranslation' | 'missingWords' | 'formulateSentense' | 'chooseWord' | 'hearing' | 'translationMissingLetters' | 'wordMissingLetters' | 'writeWord' | string;
};

export type RunnerTask =
  | {
      kind: 'chooseTranslation';
      sourceWord: string; // in current language
      correctTranslation: string; // from other language file matched by id
      options: string[]; // includes correct + distractors
      itemId: string;
    }
  | {
      kind: 'chooseWord';
      translation: string; // translation shown
      correctWord: string; // correct word in current language
      options: string[]; // includes correct + distractors
      itemId: string;
    }
  | {
      kind: 'hearing';
      sourceWord: string;
      correctTranslation: string;
      options: string[];
      itemId: string;
    }
  | {
      kind: 'translationMissingLetters';
      word: string;
      translation: string;
      inputIndices: number[];
      itemId: string;
    }
  | {
      kind: 'wordMissingLetters';
      word: string;
      translation: string;
      missingIndices: number[];
      itemId: string;
    }
  | {
      kind: 'writeWord';
      word: string;
      translation: string;
      missingIndices: number[];
      itemId: string;
    }
  | {
      kind: 'missingWords';
      sentence: string; // in current language
      translatedSentence: string; // from other language file
      tokens: string[];
      missingIndices: number[];
      wordBank: string[]; // include correct missing words + extras from same step
      itemId: string;
    }
  | {
      kind: 'formulateSentense';
      sentence: string; // in current language to assemble
      translatedSentence: string; // helper translation from other language
      tokens: string[]; // expected order
      shuffledTokens: string[]; // options presented to user
      itemId: string;
    };
