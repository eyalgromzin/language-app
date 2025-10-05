import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLangCode } from '../../utils/translation';
import { getBabySteps, getBabyStep } from '../../config/api';
import FormulateSentenseScreen from '../practice/formulateSentense/FormulateSentenseScreen';
import MissingWordsScreen from '../practice/missingWords/MissingWordsScreen';
import Choose1OutOfN from '../practice/choose1OutOfN/Choose1OutOfN';
import HearingPracticeScreen from '../practice/hearing/HearingPracticeScreen';
import WordMissingLettersScreen from '../practice/MissingLettersScreen/missingLettersScreen';
import WriteWordScreen from '../practice/writeWord/WriteWordScreen';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import StreakAnimation from '../../components/StreakAnimation';

type StepItem = {
  id: string;
  title?: string;
  type?: 'word' | 'sentence';
  text: string;
  practiceType?: 'chooseTranslation' | 'missingWords' | 'formulateSentense' | 'chooseWord' | 'hearing' | 'translationMissingLetters' | 'wordMissingLetters' | 'writeWord' | string;
};



type RunnerTask =
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

function splitToTokens(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function filterUsefulWords(words: string[]): string[] {
  return words.filter(word => {
    // Filter out very short words, punctuation, and common articles/prepositions
    const cleanWord = word.replace(/[^\w\s]/g, '').trim();
    if (cleanWord.length < 2) return false;
    
    // Filter out common short words that aren't very useful for practice
    const commonWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'];
    if (commonWords.includes(cleanWord.toLowerCase())) return false;
    
    return true;
  });
}

// Helper function to add words from sentences in the native language to a distractor pool
function addSentenceWordsToPool(
  distractorPool: string[],
  currentStepNativeLanguage: any,
  currentItemId: string,
  excludeText: string
): void {
  currentStepNativeLanguage.items.forEach((o: any) => {
    if (o.id !== currentItemId && o.type === 'sentence') {
      const sentenceWords = splitToTokens(o.text);
      sentenceWords.forEach((word: string) => {
        if (word && word !== excludeText && !distractorPool.includes(word)) {
          distractorPool.push(word);
        }
      });
    }
  });
}

// Helper function to add words from sentences in the learning language to a distractor pool
function addLearningLanguageSentenceWordsToPool(
  distractorPool: string[],
  currentStepLearningLanguage: any,
  currentItemId: string,
  excludeText: string
): void {
  currentStepLearningLanguage.items.forEach((o: any) => {
    if (o.id !== currentItemId && o.type === 'sentence') {
      const sentenceWords = splitToTokens(o.text);
      sentenceWords.forEach((word: string) => {
        if (word && word !== excludeText && !distractorPool.includes(word)) {
          distractorPool.push(word);
        }
      });
    }
  });
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleN<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return shuffleArray(arr);
  const a = [...arr];
  const out: T[] = [];
  while (out.length < n && a.length > 0) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a[idx]);
    a.splice(idx, 1);
  }
  return out;
}

const cleanSentense = (sentence: string) => {
  return sentence
    .replace(/\.\.\./g, '') // Remove three dots
    .replace(/…/g, '') // Remove ellipsis character (U+2026)
    .replace(/\.\.\./g, '') // Remove any remaining three dots
    .trim();
};

function BabyStepRunnerScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const stepIndex: number = Math.max(0, Number.parseInt(String(route?.params?.stepIndex ?? '0'), 10) || 0);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [tasks, setTasks] = React.useState<RunnerTask[]>([]);
  const [originalTaskCount, setOriginalTaskCount] = React.useState<number>(0);
  const [currentIdx, setCurrentIdx] = React.useState<number>(0);
  const [inputs, setInputs] = React.useState<Record<number, string>>({});
  const [wrongKey, setWrongKey] = React.useState<string | null>(null);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [numCorrect, setNumCorrect] = React.useState<number>(0);
  const [numWrong, setNumWrong] = React.useState<number>(0);
  const [currentHadMistake, setCurrentHadMistake] = React.useState<boolean>(false);
  const [resetSeed, setResetSeed] = React.useState<number>(0);
  const [selectedIndices, setSelectedIndices] = React.useState<number[]>([]);
  const [streak, setStreak] = React.useState<number>(0);
  const [persistedStreak, setPersistedStreak] = React.useState<number>(0);
  const [showStreakAnimation, setShowStreakAnimation] = React.useState<boolean>(false);
  const { languageMappings } = useLanguageMappings();

  // Animation values for completion screen
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const confettiAnim = React.useRef(new Animated.Value(0)).current;

  // Trigger completion animations when step is completed
  React.useEffect(() => {
    if (originalTaskCount > 0 && numCorrect >= originalTaskCount) {
      // Reset animation values
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
      confettiAnim.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [originalTaskCount, numCorrect, fadeAnim, scaleAnim, slideAnim, confettiAnim]);

  // Helper function to load persisted streak
  const loadPersistedStreak = async () => {
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      const stored = await AsyncStorage.getItem(`babySteps.winningStreak.${currentCode}`);
      const streakValue = Number.parseInt(stored ?? '0', 10);
      setPersistedStreak(streakValue);
      return streakValue;
    } catch (e) {
      console.error('Failed to load persisted streak:', e);
      return 0;
    }
  };

  // Helper function to save streak to AsyncStorage
  const saveStreak = async (streakValue: number) => {
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      await AsyncStorage.setItem(`babySteps.winningStreak.${currentCode}`, String(streakValue));
      setPersistedStreak(streakValue);
    } catch (e) {
      console.error('Failed to save streak:', e);
    }
  };

  // Helper function to reset streak in AsyncStorage
  const resetStreak = async () => {
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      await AsyncStorage.setItem(`babySteps.winningStreak.${currentCode}`, '0');
      setPersistedStreak(0);
    } catch (e) {
      console.error('Failed to reset streak:', e);
    }
  };

  // Helper function to handle streak milestones
  const handleStreakMilestone = (newStreak: number) => {
    console.log('Checking streak milestone:', newStreak);
    if (newStreak === 2 || newStreak === 5 || newStreak === 10) {
      console.log('Triggering streak animation for streak:', newStreak);
      setShowStreakAnimation(true);
    }
  };

  // Helper function to handle correct answer
  const handleCorrectAnswer = () => {
    const newStreak = streak + 1;
    console.log('Correct answer! Current streak:', streak, 'New streak:', newStreak);
    setStreak(newStreak);
    setNumCorrect((c) => c + 1);
    handleStreakMilestone(newStreak);
  };

  // Helper function to handle wrong answer
  const handleWrongAnswer = () => {
    setStreak(0); // Reset streak on wrong answer
    setNumWrong((c) => c + 1);
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Determine current learning and native languages
        const [learningName, nativeName] = await Promise.all([
          AsyncStorage.getItem('language.learning'),
          AsyncStorage.getItem('language.native'),
        ]);
        const currentCode = getLangCode(learningName, languageMappings) || 'en';
        const nativeCode = getLangCode(nativeName, languageMappings) || 'en';

        // Load persisted streak
        const loadedStreak = await loadPersistedStreak();
        if (mounted) {
          setStreak(loadedStreak);
        }

        // First, get the steps list to find the stepId for the given stepIndex
        const stepsFile = await getBabySteps(currentCode);
        if (!mounted) return;
        
        if (!stepsFile || !Array.isArray(stepsFile.steps) || !stepsFile.steps[stepIndex]) {
          setTasks([]);
          return;
        }

        const stepMeta = stepsFile.steps[stepIndex];
        const stepId = stepMeta.id;

        // Now get the specific step data using the new API
        const [currentStepLearningLanguage, currentStepNativeLanguage] = await Promise.all([
          getBabyStep(currentCode, stepId),
          getBabyStep(nativeCode, stepId),
        ]);

        if (!mounted) return;

        if (!currentStepLearningLanguage || !currentStepLearningLanguage) {
          setTasks([]);
          return;
        }

        // Helper to find matching item text by id in other language file
        const findNativeTextById = (itemId: string): string | null => {
          for (const s of (currentStepNativeLanguage?.items || [])) {
            if (s.id === itemId) return s.text;
          }
          return null;
        };

        // Gather extras from same step for word bank (tokens from sentences, word texts from current language)
        const extrasFromStep: string[] = [];
        currentStepLearningLanguage.items.forEach((it: any) => {
          if (it.type === 'sentence' || it.practiceType === 'missingWords') {
            splitToTokens(it.text).forEach((t: string) => extrasFromStep.push(t));
          } else if (it.type === 'word' || it.practiceType === 'chooseTranslation') {
            if (it.text) extrasFromStep.push(it.text);
          }
          // Also include words from other practice types for more variety
          if (it.practiceType && it.practiceType.includes('chooseWord')) {
            if (it.text) extrasFromStep.push(it.text);
          }
          if (it.practiceType && it.practiceType.includes('hearing')) {
            if (it.text) extrasFromStep.push(it.text);
          }
        });

        // Also gather words from other language for additional variety
        const extrasFromNativeLanguage: string[] = [];
        currentStepNativeLanguage.items.forEach((it: any) => {
          if (it.type === 'sentence') {
            splitToTokens(it.text).forEach((t: string) => extrasFromNativeLanguage.push(t));
          } else if (it.type === 'word') {
            if (it.text) extrasFromNativeLanguage.push(it.text);
          }
          // Also include words from other practice types for more variety
          if (it.practiceType && it.practiceType.includes('chooseTranslation')) {
            if (it.text) extrasFromNativeLanguage.push(it.text);
          }
          if (it.practiceType && it.practiceType.includes('hearing')) {
            if (it.text) extrasFromNativeLanguage.push(it.text);
          }
        });

        // Filter out common words and punctuation to make the word bank more useful
        const filteredExtrasFromStep = filterUsefulWords(extrasFromStep);
        const filteredExtrasFromNativeLanguage = filterUsefulWords(extrasFromNativeLanguage);

        const built: RunnerTask[] = currentStepLearningLanguage.items.flatMap((it: any) => {
          const otherText = findNativeTextById(it.id);
          
          // Helper function to create a task based on practice type
          const createTask = (practiceType: string): RunnerTask | null => {
            if (practiceType === 'chooseTranslation' || (practiceType === 'default' && it.type === 'word')) {
              // Build distractors from other word items in same step
              const distractorPool: string[] = [];
              currentStepNativeLanguage.items.forEach((o: any) => {
                if (o.id !== it.id && (o.type === 'word' || o.practiceType?.includes('chooseTranslation'))) {
                  const t = findNativeTextById(o.id);
                  if (t && t !== otherText) distractorPool.push(t);
                }
              });
              
              // Also add words from sentences in the native language for more variety
              if (otherText) {
                addSentenceWordsToPool(distractorPool, currentStepNativeLanguage, it.id, otherText);
              }
              
              // Add some additional words from the current step for context
              currentStepLearningLanguage.items.forEach((o: any) => {
                if (o.id !== it.id && o.type === 'word') {
                  const t = findNativeTextById(o.id);
                  if (t && t !== otherText && !distractorPool.includes(t)) {
                    distractorPool.push(t);
                  }
                }
              });
              
              const picked = sampleN(Array.from(new Set(distractorPool)), Math.min(7, Math.max(0, distractorPool.length)));
              const allOptions = shuffleArray([otherText, ...picked]);
              return {
                kind: 'chooseTranslation',
                sourceWord: it.text,
                correctTranslation: otherText,
                options: allOptions,
                itemId: it.id,
              } as RunnerTask;
            }
            
            if (practiceType === 'chooseWord') {
              // Show translation and ask to pick the correct word
              const distractorPoolWords: string[] = [];
              currentStepLearningLanguage.items.forEach((o: any) => {
                if (o.id !== it.id && (o.type === 'word' || o.practiceType?.includes('chooseTranslation') || o.practiceType?.includes('chooseWord'))) {
                  if (o.text && o.text !== it.text) distractorPoolWords.push(o.text);
                }
              });
              
              // Also add words from sentences in the learning language for more variety
              addLearningLanguageSentenceWordsToPool(distractorPoolWords, currentStepLearningLanguage, it.id, it.text);
              
              // Add some additional words from the current step for context
              currentStepLearningLanguage.items.forEach((o: any) => {
                if (o.id !== it.id && o.type === 'word') {
                  if (o.text && o.text !== it.text && !distractorPoolWords.includes(o.text)) {
                    distractorPoolWords.push(o.text);
                  }
                }
              });
              
              const pickedWords = sampleN(Array.from(new Set(distractorPoolWords)), Math.min(7, Math.max(0, distractorPoolWords.length)));
              const allWordOptions = shuffleArray([it.text, ...pickedWords]);
              return {
                kind: 'chooseWord',
                translation: otherText,
                correctWord: it.text,
                options: allWordOptions,
                itemId: it.id,
              } as RunnerTask;
            }
            
            // Build formulate sentence task (assemble full sentence in current language)
            if (practiceType === 'formulateSentense') {
              const tokens = splitToTokens(cleanSentense(it.text));
              
              // Ensure we have at least 6 words in the shuffled tokens
              let shuffledTokens = [...tokens];

              if (tokens.length < 6) {
                // Add filler words from the current step to reach at least 6 words
                const fillerWords: string[] = [];
                
                // Get words from other items in the same step
                currentStepLearningLanguage.items.forEach((o: any) => {
                  if (o.id !== it.id) {
                    if (o.type === 'word' && o.text && !tokens.includes(o.text)) {
                      fillerWords.push(o.text);
                    } else if (o.type === 'sentence') {
                      const sentenceWords = splitToTokens(cleanSentense(o.text));
                      sentenceWords.forEach((word: string) => {
                        if (word && !tokens.includes(word) && !fillerWords.includes(word)) {
                          fillerWords.push(word);
                        }
                      });
                    }
                  }
                });
                
                // Shuffle and take enough words to reach 6 total
                const neededWords = 6 - tokens.length;
                const selectedFillers = sampleN(fillerWords, Math.min(neededWords, fillerWords.length));
                shuffledTokens = shuffleArray([...tokens, ...selectedFillers]);
              } else {
                shuffledTokens = shuffleArray(tokens);
              }
              
              return {
                kind: 'formulateSentense',
                sentence: it.text,
                translatedSentence: otherText,
                tokens,
                shuffledTokens,
                itemId: it.id,
              } as RunnerTask;
            }
            
            if (practiceType === 'hearing') {
              // Hearing: pick translation options from other words' translations
              const distractorPool: string[] = [];
              currentStepLearningLanguage.items.forEach((o: any) => {
                if (o.id !== it.id && (o.type === 'word' || o.practiceType?.includes('chooseTranslation') || o.practiceType?.includes('hearing'))) {
                  const t = findNativeTextById(o.id);
                  if (t && t !== otherText) distractorPool.push(t);
                }
              });
              
              // Also add words from sentences in the native language for more variety
              if (otherText) {
                addSentenceWordsToPool(distractorPool, currentStepNativeLanguage, it.id, otherText);
              }
              
              // Add some additional words from the current step for context
              currentStepLearningLanguage.items.forEach((o: any) => {
                if (o.id !== it.id && o.type === 'word') {
                  const t = findNativeTextById(o.id);
                  if (t && t !== otherText && !distractorPool.includes(t)) {
                    distractorPool.push(t);
                  }
                }
              });
              
              const picked = sampleN(Array.from(new Set(distractorPool)), Math.min(5, Math.max(0, distractorPool.length)));
              const options = shuffleArray([otherText, ...picked]);
              return {
                kind: 'hearing',
                sourceWord: it.text,
                correctTranslation: otherText,
                options,
                itemId: it.id,
              } as RunnerTask;
            }
            
            if (practiceType === 'translationMissingLetters') {
              // Build indices to input over translation
              const letters = (otherText || '').split('');
              const candidateIdx: number[] = [];
              letters.forEach((ch: string, i: number) => { if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) candidateIdx.push(i); });
              const desired = Math.min(3, Math.max(1, Math.floor(letters.length / 4)));
              const inputIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
              return {
                kind: 'translationMissingLetters',
                word: it.text,
                translation: otherText,
                inputIndices,
                itemId: it.id,
              } as RunnerTask;
            }
            
            if (practiceType === 'wordMissingLetters') {
              const letters = (it.text || '').split('');
              const candidateIdx: number[] = [];
              letters.forEach((ch: string, i: number) => { if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) candidateIdx.push(i); });
              const desired = Math.min(3, Math.max(1, Math.floor(letters.length / 4)));
              const missingIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
              return {
                kind: 'wordMissingLetters',
                word: it.text,
                translation: otherText,
                missingIndices,
                itemId: it.id,
              } as RunnerTask;
            }
            
            if (practiceType === 'writeWord') {
              const letters = (it.text || '').split('');
              const candidateIdx: number[] = [];
              letters.forEach((ch: string, i: number) => { if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) candidateIdx.push(i); });
              const desired = Math.min(3, Math.max(1, Math.floor(letters.length / 4)));
              const missingIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
              return {
                kind: 'writeWord',
                word: it.text,
                translation: otherText,
                missingIndices,
                itemId: it.id,
              } as RunnerTask;
            }
            
            // missingWords for sentences (only when explicitly requested)
            if (practiceType === 'missingWords') {
              const tokens = splitToTokens(it.text);
              // Choose 1-2 indices to blank, prefer alphabetic tokens
              const candidateIdx: number[] = [];
              tokens.forEach((t: string, i: number) => { if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(t)) candidateIdx.push(i); });
              const desired = Math.min(2, Math.max(1, Math.floor(tokens.length / 6)));
              const missingIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
              const required = Array.from(new Set(missingIndices.map((i) => tokens[i])));
              
              // Create a comprehensive word bank from multiple sources
              const allExtras = [...filteredExtrasFromStep, ...filteredExtrasFromNativeLanguage];
              const pool = allExtras.filter((w) => !required.includes(w));
              
              // Also add some words from the current step's other items for context
              const stepContextWords: string[] = [];
              currentStepLearningLanguage.items.forEach((o: any) => {
                if (o.id !== it.id) {
                  if (o.type === 'word') {
                    if (o.text && !required.includes(o.text)) stepContextWords.push(o.text);
                  } else if (o.type === 'sentence') {
                    const sentenceWords = splitToTokens(o.text);
                    sentenceWords.forEach((word: string) => {
                      if (word && !required.includes(word) && !stepContextWords.includes(word)) {
                        stepContextWords.push(word);
                      }
                    });
                  }
                }
              });
              
              // Combine all sources and take more words from the step to fill the word bank
              const allPool = [...pool, ...stepContextWords];
              const targetWordBankSize = Math.max(10, required.length + 6); // Ensure we have enough words
              const picked = sampleN(allPool, Math.max(0, targetWordBankSize - required.length));
              const wordBank = shuffleArray([...required, ...picked]).slice(0, targetWordBankSize);
              
              return {
                kind: 'missingWords',
                sentence: it.text,
                translatedSentence: otherText,
                tokens,
                missingIndices,
                wordBank,
                itemId: it.id,
              } as RunnerTask;
            }
            
            return null;
          };
          
          // Handle multiple practice types separated by commas
          if (it.practiceType && typeof it.practiceType === 'string') {
            const practiceTypes = it.practiceType.split(',').map((pt: string) => pt.trim());
            const tasks: RunnerTask[] = [];
            
            practiceTypes.forEach((pt: string) => {
              const task = createTask(pt);
              if (task) tasks.push(task);
            });
            
            // If no valid practice types were found, use fallback logic
            if (tasks.length === 0) {
                          // Fallback: if still sentence type, use formulate sentence
            if (it.type === 'sentence') {
              const tokens = splitToTokens(it.text);
              
              // Ensure we have at least 6 words in the shuffled tokens
              let shuffledTokens = [...tokens];
              if (tokens.length < 6) {
                // Add filler words from the current step to reach at least 6 words
                const fillerWords: string[] = [];
                
                // Get words from other items in the same step
                currentStepLearningLanguage.items.forEach((o: any) => {
                  if (o.id !== it.id) {
                    if (o.type === 'word' && o.text && !tokens.includes(o.text)) {
                      fillerWords.push(o.text);
                    } else if (o.type === 'sentence') {
                      const sentenceWords = splitToTokens(o.text);
                      sentenceWords.forEach((word: string) => {
                        if (word && !tokens.includes(word) && !fillerWords.includes(word)) {
                          fillerWords.push(word);
                        }
                      });
                    }
                  }
                });
                
                // Shuffle and take enough words to reach 6 total
                const neededWords = 6 - tokens.length;
                const selectedFillers = sampleN(fillerWords, Math.min(neededWords, fillerWords.length));
                shuffledTokens = shuffleArray([...tokens, ...selectedFillers]);
              } else {
                shuffledTokens = shuffleArray(tokens);
              }
              
              tasks.push({
                kind: 'formulateSentense',
                sentence: it.text,
                translatedSentence: otherText,
                tokens,
                shuffledTokens,
                itemId: it.id,
              } as RunnerTask);
            } else {
                // Final fallback: treat as chooseTranslation
                const distractorPool: string[] = [];
                currentStepLearningLanguage.items.forEach((o: any) => {
                  if (o.id !== it.id && (o.type === 'word' || o.practiceType?.includes('chooseTranslation'))) {
                    const t = findNativeTextById(o.id);
                    if (t && t !== otherText) distractorPool.push(t);
                  }
                });
                
                // Also add words from sentences in the native language for more variety
                if (otherText) {
                  addSentenceWordsToPool(distractorPool, currentStepNativeLanguage, it.id, otherText);
                }
                
                const picked = sampleN(Array.from(new Set(distractorPool)), Math.min(7, Math.max(0, distractorPool.length)));
                const allOptions = shuffleArray([otherText, ...picked]);
                tasks.push({
                  kind: 'chooseTranslation',
                  sourceWord: it.text,
                  correctTranslation: otherText,
                  options: allOptions,
                  itemId: it.id,
                } as RunnerTask);
              }
            }
            
            return tasks;
          } else {
            // Handle legacy single practice type or no practice type
            const task = createTask('default');
            if (task) return [task];
            
            // Fallback: if still sentence type, use formulate sentence
            if (it.type === 'sentence') {
              const tokens = splitToTokens(it.text);
              
              // Ensure we have at least 6 words in the shuffled tokens
              let shuffledTokens = [...tokens];
              if (tokens.length < 6) {
                // Add filler words from the current step to reach at least 6 words
                const fillerWords: string[] = [];
                
                // Get words from other items in the same step
                currentStepLearningLanguage.items.forEach((o: any) => {
                  if (o.id !== it.id) {
                    if (o.type === 'word' && o.text && !tokens.includes(o.text)) {
                      fillerWords.push(o.text);
                    } else if (o.type === 'sentence') {
                      const sentenceWords = splitToTokens(o.text);
                      sentenceWords.forEach((word: string) => {
                        if (word && !tokens.includes(word) && !fillerWords.includes(word)) {
                          fillerWords.push(word);
                        }
                      });
                    }
                  }
                });
                
                // Shuffle and take enough words to reach 6 total
                const neededWords = 6 - tokens.length;
                const selectedFillers = sampleN(fillerWords, Math.min(neededWords, fillerWords.length));
                shuffledTokens = shuffleArray([...tokens, ...selectedFillers]);
              } else {
                shuffledTokens = shuffleArray(tokens);
              }
              
              return [{
                kind: 'formulateSentense',
                sentence: it.text,
                translatedSentence: otherText,
                tokens,
                shuffledTokens,
                itemId: it.id,
              } as RunnerTask];
            } else {
              // Final fallback: treat as chooseTranslation
              const distractorPool: string[] = [];
              currentStepLearningLanguage.items.forEach((o: any) => {
                if (o.id !== it.id && (o.type === 'word' || o.practiceType?.includes('chooseTranslation'))) {
                  const t = findNativeTextById(o.id);
                  if (t && t !== otherText) distractorPool.push(t);
                }
              });
              
              // Also add words from sentences in the native language for more variety
              if (otherText) {
                addSentenceWordsToPool(distractorPool, currentStepNativeLanguage, it.id, otherText);
              }
              
              const picked = sampleN(Array.from(new Set(distractorPool)), Math.min(7, Math.max(0, distractorPool.length)));
              const allOptions = shuffleArray([otherText, ...picked]);
              return [{
                kind: 'chooseTranslation',
                sourceWord: it.text,
                correctTranslation: otherText,
                options: allOptions,
                itemId: it.id,
              } as RunnerTask];
            }
          }
        });

        if (!mounted) return;
        const shuffledTasks = shuffleArray(built);
        setTasks(shuffledTasks);
        setOriginalTaskCount(shuffledTasks.length);
        setCurrentIdx(0);
        setInputs({});
        setWrongKey(null);
        setSelectedKey(null);
        setNumCorrect(0);
        setNumWrong(0);
        setCurrentHadMistake(false);
        setSelectedIndices([]);
        setStreak(loadedStreak); // Keep persisted streak when restarting
        setShowStreakAnimation(false);
      } catch (e) {
        if (!mounted) return;
        console.error('Failed to load step:', e);
        setTasks([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [route, stepIndex, resetSeed]);

  // Reset streak when user quits mid-step (component unmounts without completion)
  React.useEffect(() => {
    return () => {
      // Only reset if the step wasn't completed (numCorrect < originalTaskCount)
      // and we're not in the middle of a restart
      if (originalTaskCount > 0 && numCorrect < originalTaskCount) {
        resetStreak();
      }
    };
  }, [originalTaskCount, numCorrect]);

  const current = tasks[currentIdx];

  // Reset formulate state when current changes
  React.useEffect(() => {
    setSelectedIndices([]);
  }, [currentIdx]);





  React.useEffect(() => {
    if (!current || current.kind !== 'missingWords') return;
    // when all filled, check
    const allFilled = current.missingIndices.every((i) => (inputs[i] ?? '').trim() !== '');
    if (!allFilled) return;
    const ok = current.missingIndices.every((i) => (inputs[i] ?? '') === current.tokens[i]);
    if (ok) {
      handleCorrectAnswer();
    } else {
      // Requeue failed item to the end of the queue
      handleWrongAnswer();
      setTasks((prev) => [...prev, prev[currentIdx]]);
    }
    const t = setTimeout(() => {
      setInputs({});
      setCurrentIdx((i) => i + 1);
    }, ok ? 600 : 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, current]);

  const onSkip = () => {
    setInputs({});
    setWrongKey(null);
    setSelectedKey(null);
    // Requeue skipped item to the end and advance
    setTasks((prev) => [...prev, prev[currentIdx]]);
    setCurrentIdx((i) => i + 1);
  };

  // When moving to a new item, clear transient UI state
  React.useEffect(() => {
    setSelectedKey(null);
    setWrongKey(null);
    setInputs({});
    setCurrentHadMistake(false);
  }, [currentIdx]);



  React.useEffect(() => {
    if (!current || current.kind !== 'formulateSentense') return;
    const done = selectedIndices.length === current.tokens.length;
    if (!done) return;
    const isCorrect = current.tokens.every((tok, i) => tok === current.shuffledTokens[selectedIndices[i]]);
    if (isCorrect) {
      handleCorrectAnswer();
      const t = setTimeout(() => {
        setSelectedIndices([]);
        setCurrentIdx((i) => i + 1);
      }, 600);
      return () => clearTimeout(t);
    }
    // Wrong: requeue to end and advance
    handleWrongAnswer();
    const t = setTimeout(() => {
      setSelectedIndices([]);
      setTasks((prev) => [...prev, prev[currentIdx]]);
      setCurrentIdx((i) => i + 1);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndices, current]);

  const onFinish = async () => {
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      
      // Save individual step completion
      const completedStepsKey = `babySteps.completedSteps.${currentCode}`;
      const completedStepsData = await AsyncStorage.getItem(completedStepsKey);
      const completedSteps: Set<number> = completedStepsData 
        ? new Set(JSON.parse(completedStepsData))
        : new Set();
      
      // Add current step to completed steps
      completedSteps.add(stepIndex);
      
      // Save updated completed steps
      await AsyncStorage.setItem(completedStepsKey, JSON.stringify([...completedSteps]));
      
      // Save the current streak only when baby step is completed successfully
      await saveStreak(streak);
    } catch {}
    navigation.goBack();
  };

  const onRestart = async () => {
    // Mark as finished so the path stays completed even if restarting immediately
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      
      // Save individual step completion
      const completedStepsKey = `babySteps.completedSteps.${currentCode}`;
      const completedStepsData = await AsyncStorage.getItem(completedStepsKey);
      const completedSteps: Set<number> = completedStepsData 
        ? new Set(JSON.parse(completedStepsData))
        : new Set();
      
      // Add current step to completed steps
      completedSteps.add(stepIndex);
      
      // Save updated completed steps
      await AsyncStorage.setItem(completedStepsKey, JSON.stringify([...completedSteps]));
      
      // Save the current streak when restarting (step was completed)
      await saveStreak(streak);
    } catch {}
    // Always rebuild tasks within the same screen instance
    setResetSeed((s) => s + 1);
    // Additionally try a full screen refresh; if it's a no-op, the local reset still works
    try {
      (navigation as any).replace('BabyStepRunner', { stepIndex });
    } catch {}
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading step content...</Text>
        <Text style={styles.loadingSubtext}>Preparing your practice exercises</Text>
      </View>
    );
  }

  // When we've completed all original tasks, show completion screen
  if (originalTaskCount > 0 && numCorrect >= originalTaskCount) {
    return (
      <View style={styles.completionContainer}>
        {/* Celebration Background */}
        <Animated.View 
          style={[
            styles.celebrationBackground,
            {
              opacity: confettiAnim,
              transform: [{ scale: confettiAnim }],
            }
          ]} 
        />
        
        {/* Main Content */}
        <Animated.View 
          style={[
            styles.completionContent,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            }
          ]}
        >
          {/* Success Icon */}
          <Animated.View 
            style={[
              styles.successIconContainer,
              {
                transform: [{ 
                  scale: confettiAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.1, 1],
                  })
                }],
              }
            ]}
          >
            <Text style={styles.successIcon}>🎉</Text>
            <Animated.View 
              style={[
                styles.successCheckmark,
                {
                  transform: [{ 
                    scale: confettiAnim.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [0, 1.2, 1],
                    })
                  }],
                }
              ]}
            >
              <Text style={styles.checkmarkText}>✓</Text>
            </Animated.View>
          </Animated.View>
          
          {/* Congratulations Text */}
          <Animated.Text 
            style={[
              styles.congratulationsTitle,
              {
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, -10],
                  })
                }],
              }
            ]}
          >
            Congratulations!
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.stepCompletedText,
              {
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, -5],
                  })
                }],
              }
            ]}
          >
            Step {stepIndex + 1} completed successfully
          </Animated.Text>
          
          {/* Stats Card */}
          <Animated.View 
            style={[
              styles.statsCard,
              {
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, -15],
                  })
                }],
              }
            ]}
          >
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{numCorrect}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{Math.round((numCorrect / (numCorrect + numWrong)) * 100)}%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </Animated.View>
          
          {/* Action Buttons */}
          <Animated.View 
            style={[
              styles.actionButtonsContainer,
              {
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, -20],
                  })
                }],
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={onRestart} 
              accessibilityRole="button" 
              accessibilityLabel="Restart step"
            >
              <Text style={styles.secondaryButtonText}>Practice Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={onFinish} 
              accessibilityRole="button" 
              accessibilityLabel="Finish step"
            >
              <Text style={styles.primaryButtonText}>Continue Learning</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  // Safety check: if we've run out of tasks but haven't completed all original tasks, restart
  if (currentIdx >= tasks.length && originalTaskCount > 0) {
    setResetSeed((s) => s + 1);
    return (
      <View style={styles.centered}>
        <Text>Restarting step...</Text>
      </View>
    );
  }

  // Ensure we have a current task
  if (!current) {
    return (
      <View style={styles.centered}>
        <Text>Loading task...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Step {stepIndex + 1} • {numCorrect}/{originalTaskCount} • {numCorrect} correct • {numWrong} wrong</Text>
          {streak > 0 && (
            <View style={styles.streakIndicator}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          )}
        </View>
        {numCorrect < originalTaskCount ? (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip">
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : null}
        {/* Debug button - remove this later */}
        {/* <TouchableOpacity 
          style={[styles.skipButton, { backgroundColor: '#ff0000', marginLeft: 8 }]} 
          onPress={() => {
            console.log('Manual test - triggering animation');
            setShowStreakAnimation(true);
          }}
        >
          <Text style={[styles.skipText, { color: '#fff' }]}>Test</Text>
        </TouchableOpacity> */}
      </View>

      {current.kind === 'chooseTranslation' ? (
        <Choose1OutOfN
          embedded
          translation={current.sourceWord}
          correctWord={current.correctTranslation}
          options={current.options}
          onFinished={(ok) => {
            if (ok) {
              handleCorrectAnswer();
            } else {
              handleWrongAnswer();
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'chooseWord' ? (
        <Choose1OutOfN
          embedded
          translation={current.translation}
          correctWord={current.correctWord}
          options={current.options}
          onFinished={(ok) => {
            if (ok) {
              handleCorrectAnswer();
            } else {
              handleWrongAnswer();
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'hearing' ? (
        <HearingPracticeScreen
          embedded
          sourceWord={current.sourceWord}
          correctTranslation={current.correctTranslation}
          options={current.options}
          onFinished={(ok) => {
            if (ok) handleCorrectAnswer();
            else {
              handleWrongAnswer();
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'translationMissingLetters' ? (
        <WordMissingLettersScreen
          embedded
          mode="translation"
          word={current.word}
          translation={current.translation}
          missingIndices={current.inputIndices}
          onFinished={(ok) => {
            if (ok) handleCorrectAnswer();
            else {
              handleWrongAnswer();
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'wordMissingLetters' ? (
        <WordMissingLettersScreen
          embedded
          word={current.word}
          translation={current.translation}
          missingIndices={current.missingIndices}
          onFinished={(ok) => {
            if (ok) handleCorrectAnswer();
            else {
              handleWrongAnswer();
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'writeWord' ? (
        <WriteWordScreen
          embedded
          word={current.word}
          translation={current.translation}
          missingIndices={current.missingIndices}
          onFinished={(ok) => {
            if (ok) handleCorrectAnswer();
            else {
              handleWrongAnswer();
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'missingWords' ? (
        <MissingWordsScreen
          embedded
          sentence={current.sentence}
          translatedSentence={current.translatedSentence}
          tokens={current.tokens}
          missingIndices={current.missingIndices}
          wordBank={current.wordBank}
          onFinished={(ok) => {
            if (ok) {
              handleCorrectAnswer();
            } else {
              handleWrongAnswer();
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'formulateSentense' ? (
        <FormulateSentenseScreen
          key={`formulate-${currentIdx}-${current.itemId}`}
          embedded
          sentence={cleanSentense(current.sentence)}
          translatedSentence={cleanSentense(current.translatedSentence)}
          tokens={current.tokens}
          shuffledTokens={current.shuffledTokens}
          itemId={current.itemId}
          onFinished={(ok) => {
            if (ok) {
              handleCorrectAnswer();
            } else {
              handleWrongAnswer();
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : null}

      {/* Streak Animation */}
      <StreakAnimation
        streak={streak}
        visible={showStreakAnimation}
        onAnimationComplete={() => setShowStreakAnimation(false)}
      />
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f8fafc'
  },
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: '#f8fafc'
  },
  loadingText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#333',
    textAlign: 'center'
  },
  loadingSubtext: { 
    fontSize: 14, 
    color: '#666',
    textAlign: 'center',
    marginTop: 4
  },
  container: { 
    padding: 16, 
    gap: 16,
    backgroundColor: '#f8fafc',
    minHeight: '100%'
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700', flex: 1 },
  streakIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FF6B35', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12,
    marginLeft: 8,
    marginRight: 8
  },
  streakEmoji: { fontSize: 14, marginRight: 4 },
  streakText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  skipButton: { borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff' },
  skipText: { color: '#007AFF', fontWeight: '700' },
  wordCard: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center' },
  wordText: { fontSize: 24, fontWeight: '800' },
  translationText: { fontSize: 18, fontWeight: '700' },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  optionButton: { width: '48%', borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10 },
  optionText: { fontSize: 16, fontWeight: '600' },
  optionCorrect: { backgroundColor: '#e6f7e9', borderColor: '#2e7d32' },
  optionWrong: { backgroundColor: '#ffebee', borderColor: '#e53935' },
  sentenceWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  tokenFixed: { paddingHorizontal: 6, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f8f8f8' },
  tokenText: { fontSize: 16 },
  tokenBlank: { paddingHorizontal: 4, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  blankText: { fontSize: 16, paddingHorizontal: 6, paddingVertical: 4 },
  choicesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8 },
  choiceButton: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8 },
  choiceText: { fontSize: 14, fontWeight: '600' },
  assembledBox: { minHeight: 72, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10, justifyContent: 'center' },
  placeholder: { color: '#999', fontStyle: 'italic' },
  tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tokensWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tokenChip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', marginBottom: 8 },
  tokenChipUsed: { backgroundColor: '#eee', borderColor: '#ddd' },
  tokenChipSelected: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#e6f7e9', borderWidth: 1, borderColor: '#2e7d32' },
  finishButton: { marginTop: 8, backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  finishText: { color: '#fff', fontWeight: '800' },
  
  // Completion Screen Styles
  completionContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  celebrationBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#667eea',
    opacity: 0.05,
  },
  completionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  successCheckmark: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  congratulationsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepCompletedText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  actionButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BabyStepRunnerScreen;


