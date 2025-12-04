type PracticeOption = {
  key: string;
  label: string;
  emoji?: string;
};

type Navigation = {
  navigate: (name: string, params?: any) => void;
};

const PRACTICE_OPTIONS: PracticeOption[] = [
  { key: 'missingLetters', label: 'missingLetters', emoji: '🔤' },
  { key: 'missingWords', label: 'missingWords', emoji: '🔡' },
  { key: 'matchGame', label: 'matchGame', emoji: '🧩' },
  { key: 'chooseWord', label: 'chooseWord', emoji: '📝' },
  { key: 'chooseTranslation', label: 'chooseTranslation', emoji: '🔎' },
  { key: 'translate', label: 'translate', emoji: '🌐' },
  { key: 'memoryGame', label: 'memoryGame', emoji: '🧠' },
  { key: 'hearing', label: 'hearingPractice', emoji: '🔊' },
];

// Helper function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Module-level state to track shuffled practice order
let shuffledOrder: PracticeOption[] = [];
let currentIndex: number = 0;
let practiceCount: number = 0;

/**
 * Initialize or reshuffle the practice order
 */
export function initializeShuffledOrder(): void {
  const availableOptions = PRACTICE_OPTIONS.filter(opt => opt.key !== 'flipCards');
  
  // Shuffle if we don't have a shuffled order yet, or if we've completed 10 practices
  if (shuffledOrder.length === 0 || practiceCount >= 10) {
    shuffledOrder = shuffleArray(availableOptions);
    currentIndex = 0;
    practiceCount = 0;
  }
}

/**
 * Navigate to the next practice in the shuffled order
 */
export function navigateToNextInShuffledOrder(navigation: Navigation): void {
  // Ensure we have a shuffled order
  if (shuffledOrder.length === 0) {
    initializeShuffledOrder();
  }
  
  // Get the next practice from the shuffled order
  const opt = shuffledOrder[currentIndex];
  
  // Move to the next practice in the shuffled order
  currentIndex = (currentIndex + 1) % shuffledOrder.length;
  practiceCount += 1;
  
  // Check if we need to reshuffle after this practice
  if (practiceCount >= 10) {
    // Will reshuffle on next call to initializeShuffledOrder
  }
  
  // Navigate to the selected practice
  if (opt.key === 'missingLetters') {
    navigation.navigate('MissingLetters', { surprise: true, mode: 'word' });
  } else if (opt.key === 'missingWords') {
    navigation.navigate('MissingWords', { surprise: true });
  } else if (opt.key === 'matchGame') {
    navigation.navigate('WordsMatch', { surprise: true });
  } else if (opt.key === 'memoryGame') {
    navigation.navigate('MemoryGame', { surprise: true });
  } else if (opt.key === 'translate') {
    navigation.navigate('Translate', { surprise: true, mode: 'translation' });
  } else if (opt.key === 'chooseWord') {
    navigation.navigate('ChooseWord', { surprise: true });
  } else if (opt.key === 'chooseTranslation') {
    navigation.navigate('ChooseTranslation', { surprise: true });
  } else if (opt.key === 'hearing') {
    navigation.navigate('HearingPractice', { surprise: true });
  }
}

/**
 * Reset the shuffled order (useful for testing or manual reset)
 */
export function resetShuffledOrder(): void {
  shuffledOrder = [];
  currentIndex = 0;
  practiceCount = 0;
}

