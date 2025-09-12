import React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { playCorrectFeedback, playWrongFeedback } from '../common';
import AnimatedToast from '../../../components/AnimatedToast';
import FinishedWordAnimation from '../../../components/FinishedWordAnimation';
import NotEnoughWordsMessage from '../../../components/NotEnoughWordsMessage';
import { useTranslation } from '../../../hooks/useTranslation';
import { WordEntry } from '../../../types/words';

type PreparedItem = {
  entry: WordEntry;
  tokens: string[];
  missingIndices: number[];
};

type EmbeddedProps = {
  embedded?: boolean;
  sentence?: string;
  translatedSentence?: string;
  tokens?: string[];
  missingIndices?: number[];
  wordBank?: string[];
  onFinished?: (isCorrect: boolean) => void;
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
    },
  };
}

function normalizeForCompare(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[áÁ]/g, 'a')
    .replace(/[éÉ]/g, 'e')
    .replace(/[íÍ]/g, 'i')
    .replace(/[óÓ]/g, 'o')
    .replace(/[úÚ]/g, 'u')
    .toLowerCase()
    .trim();
}

function splitSentenceIntoTokens(sentence: string): string[] {
  // Split by spaces but keep punctuation attached; we will only blank alphabetic tokens
  // This keeps layout simple while allowing wrap.
  return sentence.split(/\s+/).filter((t) => t.length > 0);
}

function pickRandomIndex(length: number, previous?: number): number {
  if (length <= 0) return 0;
  if (length === 1) return 0;
  let next = Math.floor(Math.random() * length);
  if (typeof previous === 'number' && next === previous) {
    next = (next + 1) % length;
  }
  return next;
}

function pickMissingWordIndices(tokens: string[], desiredCount: number): number[] {
  const candidateIndices: number[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    // Consider as candidate if it has at least one letter from common latin/spanish set
    if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(t)) {
      candidateIndices.push(i);
    }
  }
  if (candidateIndices.length === 0) return [];
  const desired = Math.max(1, Math.min(candidateIndices.length, Math.floor(desiredCount)));
  const result: number[] = [];
  const pool = [...candidateIndices];
  while (result.length < desired && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result.sort((a, b) => a - b);
}

function MissingWordsScreen(props: EmbeddedProps = {}): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { t } = useTranslation();
  
  const RANDOM_GAME_ROUTES: string[] = [
    'MissingLetters',
    'MissingWords',
    'WordsMatch',
    'Translate',
    'ChooseWord',
    'ChooseTranslation',
    'MemoryGame',
  ];
  const navigateToRandomNext = React.useCallback(() => {
    const currentName = (route as any)?.name as string | undefined;
    const choices = RANDOM_GAME_ROUTES.filter((n) => n !== currentName);
    const target = choices[Math.floor(Math.random() * choices.length)] as string;
    navigation.navigate(target as never, { surprise: true } as never);
  }, [navigation, route]);
  const [loading, setLoading] = React.useState<boolean>(props.embedded ? false : true);
  const [items, setItems] = React.useState<PreparedItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [inputs, setInputs] = React.useState<Record<number, string>>({});
  const [wrongHighlightIndex, setWrongHighlightIndex] = React.useState<number | null>(null);
  const [showCorrectToast, setShowCorrectToast] = React.useState<boolean>(false);
  const [showWrongToast, setShowWrongToast] = React.useState<boolean>(false);
  const [showFinishedWordAnimation, setShowFinishedWordAnimation] = React.useState<boolean>(false);
  const [wordChoices, setWordChoices] = React.useState<string[]>([]);
  const lastWordKeyRef = React.useRef<string | null>(null);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);
  const animationTriggeredRef = React.useRef<Set<string>>(new Set());

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  const prepare = React.useCallback((arr: WordEntry[]): PreparedItem[] => {
    return arr
      .map(ensureCounters)
      .filter((entry) => typeof entry.sentence === 'string' && entry.sentence.trim().length > 0)
      .map((entry) => {
        const tokens = splitSentenceIntoTokens(entry.sentence!.trim());
        const correctSoFar = entry.numberOfCorrectAnswers?.missingWords ?? 0;
        // Requirement: use numberOfCorrectAnswers.missingWords missing tokens; ensure at least 1
        const desiredMissing = Math.max(1, correctSoFar);
        const missingIndices = pickMissingWordIndices(tokens, desiredMissing);
        return { entry, tokens, missingIndices };
      });
  }, []);

  const loadData = React.useCallback(async () => {
    if (props.embedded) {
      // In embedded mode, all data is provided via props; no file access.
      setLoading(false);
      setInputs({});
      setWrongHighlightIndex(null);
      setShowCorrectToast(false);
      setShowWrongToast(false);
      setShowFinishedWordAnimation(false);
      return;
    }
    setLoading(true);
    try {
      // Load removeAfter threshold
      let threshold = 3;
      let totalThreshold = 6;
      try {
        const raw = await AsyncStorage.getItem('words.removeAfterNCorrect');
        const parsed = Number.parseInt(raw ?? '', 10);
        threshold = parsed >= 1 && parsed <= 4 ? parsed : 3;
        const rawTotal = await AsyncStorage.getItem('words.removeAfterTotalCorrect');
        const parsedTotal = Number.parseInt(rawTotal ?? '', 10);
        totalThreshold = parsedTotal >= 1 && parsedTotal <= 50 ? parsedTotal : 6;
        setRemoveAfterTotalCorrect(totalThreshold);
      } catch {}

      const exists = await RNFS.exists(filePath);
      if (!exists) {
        setItems([]);
        return;
      }
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      const arr = Array.isArray(parsed) ? (parsed as WordEntry[]) : [];
      const filtered = arr
        .filter((w) => w.word && w.translation && w.sentence)
        .filter((w) => (w.numberOfCorrectAnswers?.missingWords ?? 0) < threshold)
        .filter((w) => {
          const noa = w.numberOfCorrectAnswers || ({} as any);
          const total =
            (noa.missingLetters || 0) +
            (noa.missingWords || 0) +
            (noa.chooseTranslation || 0) +
            (noa.chooseWord || 0) +
            (noa.memoryGame || 0) +
            (noa.writeTranslation || 0) +
            (noa.writeWord || 0);
          return total < totalThreshold;
        });
      const prepared = prepare(filtered);
      setItems(prepared);
      // Choose a random index different from the last shown word when possible
      let nextIdx = 0;
      if (prepared.length > 0) {
        if (prepared.length === 1) {
          nextIdx = 0;
        } else {
          let pool = prepared
            .map((_, i) => i)
            .filter((i) => prepared[i].entry.word !== lastWordKeyRef.current);
          if (pool.length === 0) {
            pool = prepared.map((_, i) => i);
          }
          nextIdx = pool[Math.floor(Math.random() * pool.length)];
        }
      }
      setCurrentIndex(nextIdx);
      lastWordKeyRef.current = prepared[nextIdx]?.entry.word ?? null;
      setInputs({});
      setWrongHighlightIndex(null);
      setShowCorrectToast(false);
      setShowWrongToast(false);
      setShowFinishedWordAnimation(false);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filePath, prepare, props.embedded]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      if (!props.embedded) {
        loadData();
      }
    }, [loadData, props.embedded])
  );

  // Memoize current item in embedded mode to avoid new object identity on every render
  const embeddedCurrent = React.useMemo(() => {
    if (!props.embedded) return null as unknown as PreparedItem | null;
    return {
      entry: { word: '', translation: '', sentence: props.sentence || '' },
      tokens: (props.tokens && props.tokens.length > 0 ? props.tokens : splitSentenceIntoTokens(props.sentence || '')),
      missingIndices: props.missingIndices || [],
    } as unknown as PreparedItem;
  }, [props.embedded, props.sentence, props.tokens, props.missingIndices]);

  const current = props.embedded ? (embeddedCurrent as PreparedItem) : items[currentIndex];

  const moveToNext = React.useCallback(() => {
    if (props.embedded) return;
    setShowCorrectToast(false);
    setShowWrongToast(false);
    loadData();
  }, [loadData, props.embedded]);

  const attemptSentence = React.useCallback(() => {
    if (!current) return [] as string[];
    return current.tokens.map((tok, idx) => (current.missingIndices.includes(idx) ? (inputs[idx] ?? '') : tok));
  }, [current, inputs]);

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
          ...it.numberOfCorrectAnswers!,
          missingWords: (it.numberOfCorrectAnswers?.missingWords || 0) + 1,
        };
        const noa = it.numberOfCorrectAnswers!;
        const total =
          (noa.missingLetters || 0) +
          (noa.missingWords || 0) +
          (noa.chooseTranslation || 0) +
          (noa.chooseWord || 0) +
          (noa.memoryGame || 0) +
          (noa.writeTranslation || 0) +
          (noa.writeWord || 0);
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

  // Build a 10-word bank containing all correct missing words plus random distractors
  React.useEffect(() => {
    if (!current) {
      setWordChoices([]);
      return;
    }
    // Embedded mode: use provided word bank if available
    if (props.embedded) {
      const provided = props.wordBank && props.wordBank.length > 0 ? props.wordBank : current.missingIndices.map((i) => current.tokens[i]);
      // Simple shuffle
      const a = [...provided];
      for (let i = a.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      setWordChoices(a);
      return;
    }
    const missingWords = current.missingIndices.map((i) => current.tokens[i]);
    const required = Array.from(new Set(missingWords));
    // Build a pool of candidate distractors from all available items' tokens
    const pool: string[] = [];
    items.forEach((it) => {
      it.tokens.forEach((t) => {
        if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(t)) pool.push(t);
      });
    });
    // Filter pool to avoid the required words first (we'll add them explicitly)
    const distractors = pool.filter((t) => !required.includes(t));
    // Shuffle helper
    const shuffle = (arr: string[]) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const pickedDistractors = shuffle(distractors).slice(0, Math.max(0, 10 - required.length));
    const combined = [...required, ...pickedDistractors];
    // If still < 10, top-up with any pool values (including duplicates if needed)
    while (combined.length < 10 && pool.length > 0) {
      combined.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    // If pool was too small, duplicate required as last resort
    while (combined.length < 10 && required.length > 0) {
      combined.push(required[Math.floor(Math.random() * required.length)]);
    }
    setWordChoices(shuffle(combined));
  }, [current, items, props.embedded, props.wordBank]);

  React.useEffect(() => {
    if (!current) return;
    if (wrongHighlightIndex !== null) return;
    const allFilled = current.missingIndices.every((i) => (inputs[i] ?? '').trim() !== '');
    if (!allFilled) return;
    Keyboard.dismiss();
    const attempt = attemptSentence();
    // Compare token by token (normalize accents, case-insensitive)
    let allGood = true;
    let firstWrong: number | null = null;
    for (let i = 0; i < current.tokens.length; i += 1) {
      const expected = current.tokens[i];
      const got = attempt[i];
      if (current.missingIndices.includes(i)) {
        if (normalizeForCompare(expected) !== normalizeForCompare(got)) {
          allGood = false;
          if (firstWrong === null) firstWrong = i;
        }
      }
    }
    if (allGood) {
      setShowWrongToast(false);
      setShowCorrectToast(true);
      try { playCorrectFeedback(); } catch {}
      if (props.embedded) {
        const t = setTimeout(() => props.onFinished?.(true), 600);
        return () => clearTimeout(t as unknown as number);
      }
      writeBackIncrement(current.entry.word);
      const t = setTimeout(() => moveToNext(), 3000);
      return () => clearTimeout(t);
    }
    // Incorrect: show correction and highlight first wrong
    setShowCorrectToast(false);
    setShowWrongToast(true);
    try { playWrongFeedback(); } catch {}
    if (props.embedded) {
      const t = setTimeout(() => props.onFinished?.(false), 1200);
      return () => clearTimeout(t as unknown as number);
    }
    const corrected: Record<number, string> = {};
    current.missingIndices.forEach((i) => {
      corrected[i] = current.tokens[i];
    });
    setInputs(corrected);
    setWrongHighlightIndex(firstWrong);
    const wrongTimer = setTimeout(() => setShowWrongToast(false), 2000);
    return () => clearTimeout(wrongTimer);
  }, [attemptSentence, current, inputs, moveToNext, writeBackIncrement, wrongHighlightIndex, props.embedded, props.onFinished]);

  const onChangeInput = (index: number, value: string) => {
    setInputs((prev) => ({ ...prev, [index]: value }));
  };

  if (!props.embedded && loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!props.embedded && !current) {
    return <NotEnoughWordsMessage message={t('notEnoughWords.noSentencesMessage')} />;
  }

  const renderToken = (tok: string, idx: number) => {
    const isMissing = current.missingIndices.includes(idx);
    const value = inputs[idx] ?? '';
    const showAsCorrected = wrongHighlightIndex !== null;
    const approxWidth = Math.max(40, Math.min(200, Math.floor((tok.length || 1) * 10)));
    if (!isMissing) {
      return (
        <View key={idx} style={styles.tokenFixed}>
          <Text style={styles.tokenText}>{tok}</Text>
        </View>
      );
    }
    // Missing token: render as a blank slot (filled by tapping from the word bank)
    return (
      <View key={idx} style={[styles.tokenInputWrapper, showAsCorrected && styles.tokenCorrected, idx === wrongHighlightIndex && styles.tokenWrong]}>
        {showAsCorrected ? (
          <Text style={styles.tokenText}>{tok}</Text>
        ) : (
          <Text style={[styles.tokenInput, { width: approxWidth, color: value ? '#334155' : '#94a3b8' }]}>
            {value || '___'}
          </Text>
        )}
      </View>
    );
  };

  const fillNextBlankWith = (chosen: string) => {
    if (!current) return;
    const nextBlank = current.missingIndices.find((i) => (inputs[i] ?? '').trim() === '');
    if (typeof nextBlank !== 'number') return;
    setInputs((prev) => ({ ...prev, [nextBlank]: chosen }));
  };

  // Embedded minimal UI (no header/skip)
  if (props.embedded) {
    if (!current) return <View /> as unknown as React.JSX.Element;
    return (
      <View>
        <View style={styles.sentenceWrap}>
          {current.tokens.map((tok, idx) => (
            <React.Fragment key={idx}>
              {renderToken(tok, idx)}
              {idx < current.tokens.length - 1 ? <View style={{ width: 6 }} /> : null}
            </React.Fragment>
          ))}
        </View>
        <View style={styles.choicesWrap}>
          {wordChoices.map((w, i) => (
            <TouchableOpacity 
              key={`${w}-${i}`} 
              style={styles.choiceButton} 
              onPress={() => fillNextBlankWith(w)}
              activeOpacity={0.7}
            >
              <Text style={styles.choiceText}>{w}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Text style={styles.instructionTitle}>{t('screens.practice.tapWordsToComplete')}</Text>
          <TouchableOpacity style={styles.skipButton} onPress={route?.params?.surprise ? navigateToRandomNext : moveToNext} accessibilityRole="button" accessibilityLabel={t('common.skip')}>
            <Text style={styles.skipButtonText}>{t('common.skip')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sentenceWrap}>
          {current.tokens.map((tok, idx) => (
            <React.Fragment key={idx}>
              {renderToken(tok, idx)}
              {idx < current.tokens.length - 1 ? <View style={{ width: 6 }} /> : null}
            </React.Fragment>
          ))}
        </View>


        {/* Word bank */}
        <View style={styles.choicesWrap}>
          {wordChoices.map((w, i) => (
            <TouchableOpacity 
              key={`${w}-${i}`} 
              style={styles.choiceButton} 
              onPress={() => fillNextBlankWith(w)}
              activeOpacity={0.7}
            >
              <Text style={styles.choiceText}>{w}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {wrongHighlightIndex !== null ? (
          <TouchableOpacity style={styles.nextButton} onPress={() => { setInputs({}); setWrongHighlightIndex(null); moveToNext(); }}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <AnimatedToast
        visible={showCorrectToast}
        type="success"
        message={t('common.correct')}
      />
      <AnimatedToast
        visible={showWrongToast}
        type="fail"
        message={t('common.incorrect')}
      />
      <FinishedWordAnimation
        visible={showFinishedWordAnimation}
        onHide={() => setShowFinishedWordAnimation(false)}
      />
    </KeyboardAvoidingView>
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
    fontWeight: '500',
  },
  container: {
    padding: 24,
    gap: 24,
    backgroundColor: '#f8fafc',
    minHeight: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  instructionTitle: {
    fontSize: 20,
    color: '#1e293b',
    fontWeight: '700',
    maxWidth: '75%',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  translation: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  sentenceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tokenFixed: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tokenText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#334155',
    letterSpacing: -0.2,
  },
  tokenInputWrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  tokenInput: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    minHeight: 24,
  },
  choicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 4,
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
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  skipButtonText: {
    fontWeight: '700',
    color: '#6366f1',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  choiceButton: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  choiceText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: -0.2,
  },
  tokenCorrected: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  tokenWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButton: {
    marginTop: 20,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    width: '100%',
    marginVertical: 16,
    borderRadius: 1,
  },
});

export default MissingWordsScreen;


