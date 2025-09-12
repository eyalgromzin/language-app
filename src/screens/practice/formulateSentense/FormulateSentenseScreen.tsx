import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, NativeModules, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { getLangCode } from '../../../utils/translation';
import { playCorrectFeedback, playWrongFeedback } from '../common';
import AnimatedToast from '../../../components/AnimatedToast';
import FinishedWordAnimation from '../../../components/FinishedWordAnimation';
import NotEnoughWordsMessage from '../../../components/NotEnoughWordsMessage';
import { useTranslation } from '../../../hooks/useTranslation';
import { getBabySteps } from '../../../config/api';
import { WordEntry } from '../../../types/words';
import { useLanguageMappings } from '../../../contexts/LanguageMappingsContext';

type StepItem = {
  id: string;
  title?: string;
  type?: 'word' | 'sentence';
  text: string;
  practiceType?: 'chooseTranslation' | 'missingWords' | 'formulateSentense' | string;
};

type StepsFile = {
  language: string;
  overview?: string;
  steps: Array<{
    id: string;
    title: string;
    items: StepItem[];
  }>;
};



function ensureCounters(entry: WordEntry): WordEntry {
  return {
    ...entry,
    numberOfCorrectAnswers: entry.numberOfCorrectAnswers || {
      missingLetters: 0,
      missingWords: 0,
      chooseTranslation: 0,
      chooseWord: 0,
      memoryGame: 0,
      writeTranslation: 0,
      writeWord: 0,
      formulateSentence: 0,
    },
  };
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
  if (n <= 0) return [];
  if (arr.length <= n) return shuffleArray(arr);
  const taken = new Set<number>();
  const out: T[] = [];
  while (out.length < n) {
    const idx = Math.floor(Math.random() * arr.length);
    if (taken.has(idx)) continue;
    taken.add(idx);
    out.push(arr[idx]);
  }
  return out;
}

function tokenizeSentence(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function isHebrewText(text: string): boolean {
  // Check if text contains Hebrew characters (Unicode range U+0590-U+05FF)
  return /[\u0590-\u05FF]/.test(text);
}

type EmbeddedProps = {
  embedded?: boolean;
  sentence?: string;
  translatedSentence?: string;
  tokens?: string[];
  shuffledTokens?: string[];
  onFinished?: (isCorrect: boolean) => void;
  itemId?: string;
};

function FormulateSentenseScreen(props: EmbeddedProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { languageMappings } = useLanguageMappings();
  const RANDOM_GAME_ROUTES: string[] = [
    'MissingLetters',
    'MissingWords',
    'WordsMatch',
    'Translate',
    'ChooseWord',
    'ChooseTranslation',
    'MemoryGame',
    'HearingPractice',
    'FormulateSentense',
  ];
  const navigateToRandomNext = React.useCallback(() => {
    const currentName = (route as any)?.name as string | undefined;
    const choices = RANDOM_GAME_ROUTES.filter((n) => n !== currentName);
    const target = choices[Math.floor(Math.random() * choices.length)] as string;
    navigation.navigate(target as never, { surprise: true } as never);
  }, [navigation, route]);

  const [loading, setLoading] = React.useState<boolean>(props.embedded ? false : true);
  const [entries, setEntries] = React.useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [shuffledTokens, setShuffledTokens] = React.useState<string[]>(props.embedded ? (props.shuffledTokens || tokenizeSentence(props.sentence || '')) : []);
  const [selectedIndices, setSelectedIndices] = React.useState<number[]>([]);
  const [showWrongToast, setShowWrongToast] = React.useState<boolean>(false);
  const [showCorrectToast, setShowCorrectToast] = React.useState<boolean>(false);
  const [showFinishedWordAnimation, setShowFinishedWordAnimation] = React.useState<boolean>(false);
  const [showWrongAnswerDialog, setShowWrongAnswerDialog] = React.useState<boolean>(false);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);
  const [fallbackTokens, setFallbackTokens] = React.useState<string[]>([]);
  const [translationsCache, setTranslationsCache] = React.useState<Record<string, string>>({});

  const lastWordKeyRef = React.useRef<string | null>(null);
  const animationTriggeredRef = React.useRef<Set<string>>(new Set());

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  // Function to fetch translation by item ID from baby steps
  const fetchTranslationById = React.useCallback(async (itemId: string): Promise<string | null> => {
    try {
      const [learningName, nativeName] = await Promise.all([
        AsyncStorage.getItem('language.learning'),
        AsyncStorage.getItem('language.native'),
      ]);
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      const nativeCode = getLangCode(nativeName, languageMappings) || 'en';
      const otherCode = nativeCode !== currentCode ? nativeCode : (currentCode === 'en' ? 'es' : 'en');

      const stepsFile: StepsFile = await getBabySteps(otherCode);
      for (const step of (stepsFile.steps || [])) {
        const match = step.items.find((it) => it.id === itemId);
        if (match) return match.text;
      }
    } catch {}
    return null;
  }, []);

  const loadBase = React.useCallback(async () => {
    if (props.embedded) {
      // In embedded mode we do not load entries; data is passed via props
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let totalThreshold = 6;
      try {
        const rawTotal = await AsyncStorage.getItem('words.removeAfterTotalCorrect');
        const parsedTotal = Number.parseInt(rawTotal ?? '', 10);
        totalThreshold = parsedTotal >= 1 && parsedTotal <= 50 ? parsedTotal : 6;
        setRemoveAfterTotalCorrect(totalThreshold);
      } catch {}

      // Prepare fallback tokens from BabySteps steps fetched from server
      try {
        const learningName = await AsyncStorage.getItem('language.learning');
        const code = getLangCode(learningName, languageMappings) || 'en';
        const stepsFile: StepsFile = await getBabySteps(code);
        const tokensSet = new Set<string>();
        (stepsFile.steps || []).forEach((step) => {
          (step.items || []).forEach((it) => {
            if (it.type === 'sentence' || (it.practiceType && typeof it.practiceType === 'string' && (it.practiceType.includes('missingWords') || it.practiceType.includes('formulateSentense')))) {
              tokenizeSentence(it.text).forEach((t) => t && tokensSet.add(t));
            } else if (it.type === 'word' || (it.practiceType && typeof it.practiceType === 'string' && it.practiceType.includes('chooseTranslation'))) {
              if (it.text) tokensSet.add(it.text);
            }
          });
        });
        setFallbackTokens(Array.from(tokensSet));
      } catch {
        setFallbackTokens([]);
      }

      const exists = await RNFS.exists(filePath);
      if (!exists) {
        setEntries([]);
        return;
      }
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      const arr = Array.isArray(parsed) ? (parsed as WordEntry[]).map(ensureCounters) : [];
      
      // Fetch missing translations for entries with itemId
      const newTranslations: Record<string, string> = {};
      for (const entry of arr) {
        if (entry.itemId && entry.sentence && !entry.translation) {
          const translation = await fetchTranslationById(entry.itemId);
          if (translation) {
            newTranslations[entry.itemId] = translation;
          }
        }
      }
      setTranslationsCache(newTranslations);
      
      const filtered = arr
        .filter((w) => w.word && w.sentence && tokenizeSentence(w.sentence).length >= 2)
        .filter((w) => w.translation || (w.itemId && newTranslations[w.itemId]))
        .filter((w) => {
          const noa = ensureCounters(w).numberOfCorrectAnswers!;
          const total =
            (noa.missingLetters || 0) +
            (noa.missingWords || 0) +
            (noa.chooseTranslation || 0) +
            (noa.chooseWord || 0) +
            (noa.memoryGame || 0) +
            (noa.writeTranslation || 0) +
            (noa.writeWord || 0) +
            (noa.formulateSentence || 0);
          return total < totalThreshold;
        });
      setEntries(filtered);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  const pickNextIndex = React.useCallback((items: WordEntry[]) => {
    if (items.length <= 1) return 0;
    let pool = items
      .map((_, i) => i)
      .filter((i) => items[i].word !== lastWordKeyRef.current);
    if (pool.length === 0) pool = items.map((_, i) => i);
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const prepareRound = React.useCallback((items: WordEntry[]) => {
    if (items.length === 0) {
      setShuffledTokens([]);
      setSelectedIndices([]);
      return;
    }
    const idx = pickNextIndex(items);
    setCurrentIndex(idx);
    lastWordKeyRef.current = items[idx].word;
    const sentence = items[idx].sentence || '';
    const tokens = tokenizeSentence(sentence);
    // Build a global pool of candidate distractor tokens from all other sentences
    const globalTokensSet = new Set<string>();
    for (let i = 0; i < items.length; i += 1) {
      if (i === idx) continue;
      const s = items[i].sentence || '';
      tokenizeSentence(s).forEach((t) => globalTokensSet.add(t));
    }
    // Exclude tokens that are part of the expected answer to avoid duplicates/confusion
    let distractorPool = Array.from(globalTokensSet).filter((t) => !tokens.includes(t));
    const extrasNeeded = tokens.length;
    // If we don't have enough distractors from user sentences, top up from BabySteps tokens
    if (distractorPool.length < extrasNeeded) {
      const fallbackFiltered = fallbackTokens.filter((t) => !tokens.includes(t));
      const combinedSet = new Set<string>([...distractorPool, ...fallbackFiltered]);
      distractorPool = Array.from(combinedSet);
    }
    const extras = sampleN(distractorPool, extrasNeeded);
    const choices = shuffleArray<string>([...tokens, ...extras]);
    setShuffledTokens(choices);
    setSelectedIndices([]);
    setShowWrongToast(false);
    setShowCorrectToast(false);
  }, [pickNextIndex]);

  React.useEffect(() => {
    if (!props.embedded) {
      loadBase();
    }
  }, [loadBase, props.embedded]);

  useFocusEffect(
    React.useCallback(() => {
      if (!props.embedded) {
        loadBase();
      }
    }, [loadBase, props.embedded])
  );

  React.useEffect(() => {
    if (props.embedded) return;
    if (!loading) {
      prepareRound(entries);
    }
  }, [loading, entries, prepareRound, props.embedded]);

  const current = props.embedded
    ? ({ translation: props.translatedSentence || '', sentence: props.sentence || '' } as Pick<WordEntry, 'translation' | 'sentence'>)
    : entries[currentIndex] ? {
        ...entries[currentIndex],
        translation: entries[currentIndex].translation || 
                    (entries[currentIndex].itemId && translationsCache[entries[currentIndex].itemId!]) || 
                    entries[currentIndex].translation || ''
      } : undefined;
  const expectedTokens = props.embedded
    ? (props.tokens || tokenizeSentence(props.sentence || ''))
    : (current?.sentence ? tokenizeSentence(current.sentence) : []);
  const selectedTokens = selectedIndices.map((i) => shuffledTokens[i]);

  const moveToNext = React.useCallback(() => {
    setShowCorrectToast(false);
    setShowWrongToast(false);
    prepareRound(entries);
  }, [prepareRound, entries]);

  const writeBackIncrement = React.useCallback(async (wordKey: string) => {
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) return;
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      if (!Array.isArray(parsed)) return;
      const arr = (parsed as WordEntry[]).map(ensureCounters);
      const idx = arr.findIndex((it) => it.word === wordKey);
      if (idx >= 0) {
        const copy = [...arr];
        const it = { ...copy[idx] };
        it.numberOfCorrectAnswers = {
          ...ensureCounters(it).numberOfCorrectAnswers!,
          formulateSentence: (ensureCounters(it).numberOfCorrectAnswers?.formulateSentence || 0) + 1,
        };
        const noa = it.numberOfCorrectAnswers!;
        const total =
          (noa.missingLetters || 0) +
          (noa.missingWords || 0) +
          (noa.chooseTranslation || 0) +
          (noa.chooseWord || 0) +
          (noa.memoryGame || 0) +
          (noa.writeTranslation || 0) +
          (noa.writeWord || 0) +
          (noa.formulateSentence || 0);
        const totalThreshold = removeAfterTotalCorrect || 6;
        if (total >= totalThreshold) {
          copy.splice(idx, 1);
          // Show finished word animation when word is removed (only once per word)
          if (!animationTriggeredRef.current.has(wordKey)) {
            animationTriggeredRef.current.add(wordKey);
            setShowFinishedWordAnimation(true);
          }
        } else {
          copy[idx] = it;
        }
        try {
          await RNFS.writeFile(filePath, JSON.stringify(copy, null, 2), 'utf8');
        } catch {}
      }
    } catch {}
  }, [filePath, removeAfterTotalCorrect]);

  const onPickIndex = (idx: number) => {
    if (!current) return;
    if (selectedIndices.includes(idx)) return;
    const next = [...selectedIndices, idx];
    setSelectedIndices(next);
    const done = next.length === expectedTokens.length;
    if (!done) return;
    const isCorrect = expectedTokens.every((tok, i) => tok === shuffledTokens[next[i]]);
    if (isCorrect) {
      setShowWrongToast(false);
      setShowCorrectToast(true);
      try { playCorrectFeedback(); } catch {}
      if (props.embedded && props.onFinished) {
        const t = setTimeout(() => {
          props.onFinished?.(true);
        }, 1500); // Increased from 600 to 1500 to allow success toast to show
        return () => clearTimeout(t as unknown as number);
      }
      writeBackIncrement(current as any as string);
      const t = setTimeout(() => {
        prepareRound(entries);
      }, 2000);
      return () => clearTimeout(t as unknown as number);
    }
    setShowCorrectToast(false);
    setShowWrongToast(false);
    setShowWrongAnswerDialog(true);
    try { playWrongFeedback(); } catch {}
    // Removed automatic timeout - modal will only close when user presses Continue button
  };

  const onRemoveWord = (indexToRemove: number) => {
    if (indexToRemove < 0 || indexToRemove >= selectedIndices.length) return;
    
    // Remove the word at the specified position
    const newSelectedIndices = selectedIndices.filter((_, i) => i !== indexToRemove);
    setSelectedIndices(newSelectedIndices);
    setShowWrongToast(false);
    setShowCorrectToast(false);
  };

  const onReset = () => {
    setSelectedIndices([]);
    setShowWrongToast(false);
    setShowCorrectToast(false);
  };

  const onContinueFromWrongAnswer = () => {
    setShowWrongAnswerDialog(false);
    setSelectedIndices([]);
    prepareRound(entries);
  };

  if (!props.embedded && loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!props.embedded && (!current || expectedTokens.length === 0)) {
    return <NotEnoughWordsMessage message={t('notEnoughWords.noSentencesMessage')} />;
  }

  if (props.embedded) {
    return (
      <View>
        <View style={styles.wordCard}>
          <Text style={styles.wordText}>{current?.translation}</Text>
        </View>
        <View style={styles.assembledBox}>
          {selectedIndices.length === 0 ? (
            <Text style={styles.placeholder}>Tap words below in order</Text>
          ) : (
            <View style={styles.tokenRow}>
              {selectedIndices.map((i, index) => (
                <TouchableOpacity 
                  key={`sel-${i}`} 
                  style={styles.tokenChipSelected}
                  onPress={() => onRemoveWord(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${shuffledTokens[i]} from sentence`}
                >
                  <Text style={styles.tokenText}>{shuffledTokens[i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.wordsBankSection}>
          <View style={[styles.tokensWrap, { justifyContent: isHebrewText(current?.sentence || '') ? 'flex-end' : 'flex-start' }]}>
            {shuffledTokens.map((tok, i) => {
              const used = selectedIndices.includes(i);
              return (
                <TouchableOpacity
                  key={`tok-${i}-${tok}`}
                  style={[styles.tokenChip, used && styles.tokenChipUsed]}
                  onPress={() => onPickIndex(i)}
                  disabled={used}
                  accessibilityRole="button"
                  accessibilityLabel={tok}
                >
                  <Text style={styles.tokenText}>{tok}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        <AnimatedToast
          visible={showWrongToast}
          type="fail"
          message="Not quite, try again"
        />
        <AnimatedToast
          visible={showCorrectToast}
          type="success"
          message="Correct!"
        />
        
        {/* Wrong Answer Dialog for embedded mode */}
        <Modal
          visible={showWrongAnswerDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}} // Prevent closing on back button press
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dialogContainer}>
              <Text style={styles.dialogTitle}>Not quite right</Text>
              <Text style={styles.dialogSubtitle}>The correct answer is:</Text>
              <View style={styles.correctAnswerContainer}>
                <Text style={styles.correctAnswerText}>{current?.sentence}</Text>
              </View>
              <TouchableOpacity 
                style={styles.continueButton} 
                onPress={() => {
                  setShowWrongAnswerDialog(false);
                  setSelectedIndices([]);
                  if (props.onFinished) {
                    props.onFinished(false);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={t('common.continue')}
              >
                <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{t('screens.practice.createSentence')}</Text>
          <TouchableOpacity style={styles.skipButton} onPress={route?.params?.surprise ? navigateToRandomNext : moveToNext} accessibilityRole="button" accessibilityLabel={t('common.skip')}>
            <Text style={styles.skipButtonText}>{t('common.skip')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.wordCard}>
          <Text style={styles.wordText}>{current?.translation || ''}</Text>
        </View>

        <View style={styles.assembledBox}>
          {selectedIndices.length === 0 ? (
            <Text style={styles.placeholder}>Tap words below in order</Text>
          ) : (
            <View style={styles.tokenRow}>
              {selectedIndices.map((i, index) => (
                <TouchableOpacity 
                  key={`sel-${i}`} 
                  style={styles.tokenChipSelected}
                  onPress={() => onRemoveWord(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${shuffledTokens[i]} from sentence`}
                >
                  <Text style={styles.tokenText}>{shuffledTokens[i]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.wordsBankSection}>
          <Text style={styles.wordsBankTitle}>Words Bank</Text>
          <View style={[styles.tokensWrap, { justifyContent: isHebrewText(current?.sentence || '') ? 'flex-end' : 'flex-start' }]}>
            {shuffledTokens.map((tok, i) => {
              const used = selectedIndices.includes(i);
              return (
                <TouchableOpacity
                  key={`tok-${i}-${tok}`}
                  style={[styles.tokenChip, used && styles.tokenChipUsed]}
                  onPress={() => onPickIndex(i)}
                  disabled={used}
                  accessibilityRole="button"
                  accessibilityLabel={tok}
                >
                  <Text style={styles.tokenText}>{tok}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.resetButton} onPress={onReset} accessibilityRole="button" accessibilityLabel={t('common.reset')}>
            <Text style={styles.resetButtonText}>{t('common.reset')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AnimatedToast
        visible={showWrongToast}
        type="fail"
        message="Not quite, try again"
      />
      <AnimatedToast
        visible={showCorrectToast}
        type="success"
        message="Correct!"
      />
      <FinishedWordAnimation
        visible={showFinishedWordAnimation}
        onHide={() => setShowFinishedWordAnimation(false)}
      />
      
      {/* Wrong Answer Dialog */}
      <Modal
        visible={showWrongAnswerDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}} // Prevent closing on back button press
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Not quite right</Text>
            <Text style={styles.dialogSubtitle}>The correct answer is:</Text>
            <View style={styles.correctAnswerContainer}>
              <Text style={styles.correctAnswerText}>{current?.sentence}</Text>
            </View>
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={onContinueFromWrongAnswer}
              accessibilityRole="button"
              accessibilityLabel={t('screens.practice.continueToNextQuestion')}
            >
              <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  container: {
    padding: 20,
    gap: 24,
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    color: '#1e293b',
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: -0.5,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  skipButtonText: {
    fontWeight: '600',
    color: '#3b82f6',
    fontSize: 14,
  },
  wordCard: {
    borderWidth: 0,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 8,
  },
  wordText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 32,
  },
  assembledBox: {
    minHeight: 88,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  placeholder: {
    color: '#94a3b8',
    fontStyle: 'italic',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  tokenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  wordsBankSection: {
    marginTop: 16,
  },
  wordsBankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
    textAlign: 'left',
  },
  tokensWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 12,
    columnGap: 12,
    paddingHorizontal: 4,
  },
  tokenChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  tokenChipUsed: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    opacity: 0.6,
  },
  tokenChipSelected: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    borderWidth: 1.5,
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  resetButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resetButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
  dialogSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  correctAnswerContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  correctAnswerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    textAlign: 'center',
    lineHeight: 26,
  },
  continueButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    minWidth: 140,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

});

export default FormulateSentenseScreen;

