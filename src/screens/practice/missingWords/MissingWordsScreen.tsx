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
import RNFS from 'react-native-fs';
import { useFocusEffect } from '@react-navigation/native';

type WordEntry = {
  word: string;
  translation: string;
  sentence?: string;
  addedAt?: string;
  numberOfCorrectAnswers?: {
    missingLetters: number;
    missingWords: number;
    chooseTranslation: number;
    chooseWord: number;
    memoryGame: number;
    writeTranslation: number;
    writeWord: number;
  };
};

type PreparedItem = {
  entry: WordEntry;
  tokens: string[];
  missingIndices: number[];
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

function MissingWordsScreen(): React.JSX.Element {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [items, setItems] = React.useState<PreparedItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [inputs, setInputs] = React.useState<Record<number, string>>({});
  const [wrongHighlightIndex, setWrongHighlightIndex] = React.useState<number | null>(null);
  const [showCorrectToast, setShowCorrectToast] = React.useState<boolean>(false);
  const [showWrongToast, setShowWrongToast] = React.useState<boolean>(false);
  const [wordChoices, setWordChoices] = React.useState<string[]>([]);
  const lastWordKeyRef = React.useRef<string | null>(null);

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
    setLoading(true);
    try {
      // Load removeAfter threshold
      let threshold = 3;
      try {
        const raw = await AsyncStorage.getItem('words.removeAfterNCorrect');
        const parsed = Number.parseInt(raw ?? '', 10);
        threshold = parsed >= 1 && parsed <= 4 ? parsed : 3;
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
        .filter((w) => (w.numberOfCorrectAnswers?.missingWords ?? 0) < threshold);
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
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filePath, prepare]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData])
  );

  const current = items[currentIndex];

  const moveToNext = React.useCallback(() => {
    setShowCorrectToast(false);
    setShowWrongToast(false);
    loadData();
  }, [loadData]);

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
        copy[idx] = it;
        try {
          await RNFS.writeFile(filePath, JSON.stringify(copy, null, 2), 'utf8');
        } catch {}
      }
    } catch {}
  }, [filePath]);

  // Build a 10-word bank containing all correct missing words plus random distractors
  React.useEffect(() => {
    if (!current) {
      setWordChoices([]);
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
  }, [current, items]);

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
      writeBackIncrement(current.entry.word);
      const t = setTimeout(() => moveToNext(), 3000);
      return () => clearTimeout(t);
    }
    // Incorrect: show correction and highlight first wrong
    setShowCorrectToast(false);
    setShowWrongToast(true);
    const corrected: Record<number, string> = {};
    current.missingIndices.forEach((i) => {
      corrected[i] = current.tokens[i];
    });
    setInputs(corrected);
    setWrongHighlightIndex(firstWrong);
    const wrongTimer = setTimeout(() => setShowWrongToast(false), 2000);
    return () => clearTimeout(wrongTimer);
  }, [attemptSentence, current, inputs, moveToNext, writeBackIncrement, wrongHighlightIndex]);

  const onChangeInput = (index: number, value: string) => {
    setInputs((prev) => ({ ...prev, [index]: value }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No sentences to practice yet.</Text>
      </View>
    );
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
          <Text style={[styles.tokenInput, { width: approxWidth, color: value ? '#000' : '#bbb' }]}>
            {value}
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

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Text style={styles.instructionTitle}>complete the sentense from the words below: </Text>
          <TouchableOpacity style={styles.skipButton} onPress={() => moveToNext()} accessibilityRole="button" accessibilityLabel="Skip">
            <Text style={styles.skipButtonText}>Skip</Text>
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

        <View style={styles.sectionDivider} />

        {/* Word bank */}
        <View style={styles.choicesWrap}>
          {wordChoices.map((w, i) => (
            <TouchableOpacity key={`${w}-${i}`} style={styles.choiceButton} onPress={() => fillNextBlankWith(w)}>
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

      {showCorrectToast ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastEmoji}>✅</Text>
          <Text style={styles.toastText}>Correct!</Text>
        </View>
      ) : null}
      {showWrongToast ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastEmoji}>❌</Text>
          <Text style={styles.toastText}>Incorrect</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructionTitle: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  translation: {
    fontSize: 20,
    fontWeight: '700',
  },
  sentenceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 0,
    paddingVertical: 8,
  },
  tokenFixed: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8f8f8',
  },
  tokenText: {
    fontSize: 16,
  },
  tokenInputWrapper: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  tokenInput: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  choicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  skipButtonText: {
    fontWeight: '700',
    color: '#007AFF',
  },
  choiceButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  choiceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tokenCorrected: {
    backgroundColor: '#fffbf0',
  },
  tokenWrong: {
    borderColor: '#e53935',
    backgroundColor: '#ffebee',
  },
  nextButton: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  toastText: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 2,
    backgroundColor: '#c4c2c2',
    width: '100%',
    marginVertical: 8,
  },
});

export default MissingWordsScreen;


