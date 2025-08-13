import React from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

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
  letters: string[];
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

function pickMissingIndices(letters: string[], desiredCount: number): number[] {
  const candidateIndices: number[] = [];
  for (let i = 0; i < letters.length; i += 1) {
    const ch = letters[i];
    if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) {
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

function splitLetters(word: string): string[] {
  return Array.from(word);
}

function normalizeForCompare(input: string): string {
  return input
    .replace(/[áÁ]/g, 'a')
    .replace(/[éÉ]/g, 'e')
    .replace(/[íÍ]/g, 'i')
    .replace(/[óÓ]/g, 'o')
    .replace(/[úÚ]/g, 'u');
}

function isAlphabeticChar(ch: string): boolean {
  return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(ch);
}

function splitSentenceByWord(sentence: string, targetWord: string): { text: string; highlight: boolean }[] {
  if (!sentence || !targetWord) return [{ text: sentence, highlight: false }];
  const lowerSentence = sentence.toLowerCase();
  const lowerTarget = targetWord.toLowerCase();
  const parts: { text: string; highlight: boolean }[] = [];
  let cursor = 0;
  while (cursor < sentence.length) {
    const idx = lowerSentence.indexOf(lowerTarget, cursor);
    if (idx === -1) {
      parts.push({ text: sentence.slice(cursor), highlight: false });
      break;
    }
    const beforeChar = idx > 0 ? sentence[idx - 1] : '';
    const afterChar = idx + targetWord.length < sentence.length ? sentence[idx + targetWord.length] : '';
    const touchesLetters = isAlphabeticChar(beforeChar) || isAlphabeticChar(afterChar);
    if (touchesLetters) {
      cursor = idx + 1;
      continue;
    }
    if (idx > cursor) parts.push({ text: sentence.slice(cursor, idx), highlight: false });
    parts.push({ text: sentence.slice(idx, idx + targetWord.length), highlight: true });
    cursor = idx + targetWord.length;
  }
  return parts.length > 0 ? parts : [{ text: sentence, highlight: false }];
}

function pickRandomIndex(length: number, previous?: number): number {
  if (length <= 0) return 0;
  if (length === 1) return 0;
  let nextIndex = Math.floor(Math.random() * length);
  if (typeof previous === 'number' && nextIndex === previous) {
    nextIndex = (nextIndex + 1) % length;
  }
  return nextIndex;
}

function WriteWordScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
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
  const [loading, setLoading] = React.useState<boolean>(true);
  const [items, setItems] = React.useState<PreparedItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [inputs, setInputs] = React.useState<Record<number, string>>({});
  const [wrongHighlightIndex, setWrongHighlightIndex] = React.useState<number | null>(null);
  const [showCorrectToast, setShowCorrectToast] = React.useState<boolean>(false);
  const [showWrongToast, setShowWrongToast] = React.useState<boolean>(false);
  const [rowWidth, setRowWidth] = React.useState<number | null>(null);
  const inputRefs = React.useRef<Record<number, TextInput | null>>({});
  const [removeAfterCorrect, setRemoveAfterCorrect] = React.useState<number>(3);

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  const prepare = React.useCallback((arr: WordEntry[], removeAfter: number): PreparedItem[] => {
    return arr.map(ensureCounters).map((entry) => {
      const letters = splitLetters(entry.word);
      const correctSoFar = entry.numberOfCorrectAnswers?.writeWord ?? 0;
      const base = 4 - removeAfter;
      const desiredMissing = base + correctSoFar;
      const missingIndices = pickMissingIndices(letters, desiredMissing);
      return { entry, letters, missingIndices };
    });
  }, []);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      let threshold = 3;
      try {
        const raw = await AsyncStorage.getItem('words.removeAfterNCorrect');
        const parsed = Number.parseInt(raw ?? '', 10);
        const valid = parsed >= 1 && parsed <= 4 ? parsed : 3;
        threshold = valid;
        setRemoveAfterCorrect(valid);
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
        .filter((w) => w.word && w.translation)
        .filter((w) => (w.numberOfCorrectAnswers?.writeWord ?? 0) < threshold);
      const prepared = prepare(filtered, threshold);
      setItems(prepared);
      setCurrentIndex(pickRandomIndex(prepared.length));
      setInputs({});
      setWrongHighlightIndex(null);
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
      setShowCorrectToast(false);
      setShowWrongToast(false);
      loadData();
    }, [loadData])
  );

  const current = items[currentIndex];

  const resetForNext = React.useCallback(() => {
    setInputs({});
    setWrongHighlightIndex(null);
  }, []);

  const moveToNext = React.useCallback(() => {
    setShowCorrectToast(false);
    setShowWrongToast(false);
    loadData();
  }, [loadData]);

  const attemptWord = React.useCallback(() => {
    if (!current) return '';
    const built = current.letters.map((ch, idx) => {
      if (current.missingIndices.includes(idx)) {
        const v = inputs[idx] ?? '';
        return v;
      }
      return ch;
    });
    return built.join('');
  }, [current, inputs]);

  const writeBackIncrement = React.useCallback(async (word: string) => {
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) return;
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      if (!Array.isArray(parsed)) return;
      const arr = (parsed as WordEntry[]).map(ensureCounters);
      const idx = arr.findIndex((it) => it.word === word);
      if (idx >= 0) {
        const copy = [...arr];
        const it = { ...copy[idx] };
        it.numberOfCorrectAnswers = {
          ...it.numberOfCorrectAnswers!,
          writeWord: (it.numberOfCorrectAnswers?.writeWord || 0) + 1,
        };
        copy[idx] = it;
        try {
          await RNFS.writeFile(filePath, JSON.stringify(copy, null, 2), 'utf8');
        } catch {}
      }
    } catch {}
  }, [filePath]);

  const onChangeInput = (index: number, value: string) => {
    const char = Array.from(value).slice(-1)[0] || '';
    setInputs((prev) => {
      const nextInputs = { ...prev, [index]: char };
      if (char !== '' && current) {
        const nextBlank = current.missingIndices.find((i) => i > index && (nextInputs[i] ?? '') === '');
        if (typeof nextBlank === 'number') {
          setTimeout(() => {
            inputRefs.current[nextBlank]?.focus();
          }, 0);
        }
      }
      return nextInputs;
    });
  };

  const onKeyPressLetter = (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key !== 'Backspace') return;
    if (!current) return;
    setInputs((prev) => {
      const lastFilled = [...current.missingIndices]
        .reverse()
        .find((i) => (prev[i] ?? '') !== '');
      if (typeof lastFilled !== 'number') {
        return prev;
      }
      const next = { ...prev, [lastFilled]: '' };
      setTimeout(() => {
        inputRefs.current[lastFilled]?.focus();
      }, 0);
      return next;
    });
  };

  React.useEffect(() => {
    if (!current) return;
    if (wrongHighlightIndex !== null) return;
    const allFilled = current.missingIndices.every((idx) => (inputs[idx] ?? '') !== '');
    if (!allFilled) return;
    Keyboard.dismiss();
    const attempt = attemptWord();
    const target = current.entry.word;
    if (normalizeForCompare(attempt) === normalizeForCompare(target)) {
      setShowWrongToast(false);
      setShowCorrectToast(true);
      writeBackIncrement(target);
      const timer = setTimeout(() => {
        moveToNext();
      }, 3000);
      return () => clearTimeout(timer as unknown as number);
    } else {
      setShowCorrectToast(false);
      setShowWrongToast(true);
      const wrongTimer = setTimeout(() => setShowWrongToast(false), 2000);
      let mismatchAt: number | null = null;
      const letters = current.letters;
      for (let i = 0; i < letters.length; i += 1) {
        const expected = letters[i];
        const got = attempt[i] ?? '';
        if (expected !== got) {
          mismatchAt = i;
          break;
        }
      }
      const corrected: Record<number, string> = {};
      current.missingIndices.forEach((idx) => {
        corrected[idx] = current.letters[idx];
      });
      setInputs(corrected);
      setWrongHighlightIndex(mismatchAt);
      return () => clearTimeout(wrongTimer as unknown as number);
    }
  }, [attemptWord, current, inputs, moveToNext, writeBackIncrement, wrongHighlightIndex]);

  React.useEffect(() => {
    if (!current || wrongHighlightIndex !== null) return;
    const firstBlank = current.missingIndices.find((i) => (inputs[i] ?? '') === '');
    if (typeof firstBlank === 'number') {
      const t = setTimeout(() => inputRefs.current[firstBlank]?.focus(), 50);
      return () => clearTimeout(t as unknown as number);
    }
  }, [currentIndex, current, wrongHighlightIndex]);

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
        <Text style={styles.emptyText}>No words to practice yet.</Text>
      </View>
    );
  }

  const renderLetterCell = (ch: string, idx: number) => {
    const lettersCount = current.letters.length;
    const defaultCellWidth = 40;
    const gap = 8;
    const available = rowWidth ?? 0;
    const maxWidthPerCell = lettersCount > 0 && available > 0
      ? Math.floor((available - gap * Math.max(0, lettersCount - 1)) / lettersCount)
      : defaultCellWidth;
    const cellWidth = Math.max(12, Math.min(defaultCellWidth, maxWidthPerCell));
    const dynamicFontSize = Math.min(18, Math.max(12, Math.floor(cellWidth * 0.6)));

    const isMissing = current.missingIndices.includes(idx);
    const isWrongSpot = wrongHighlightIndex === idx;
    if (!isMissing) {
      return (
        <View key={idx} style={[styles.cell, { width: cellWidth }, styles.cellFixed, isWrongSpot && styles.cellWrong]}>
          <Text style={[styles.cellText, { fontSize: dynamicFontSize }]}>{ch}</Text>
        </View>
      );
    }
    const value = inputs[idx] ?? '';
    const showAsCorrected = wrongHighlightIndex !== null;
    return (
      <View key={idx} style={[styles.cell, { width: cellWidth }, showAsCorrected && styles.cellFixed, isWrongSpot && styles.cellWrong]}>
        {showAsCorrected ? (
          <Text style={[styles.cellText, { fontSize: dynamicFontSize }]}>{current.letters[idx]}</Text>
        ) : (
          <TextInput
            style={[styles.input, { fontSize: dynamicFontSize }]}
            ref={(r) => { inputRefs.current[idx] = r; }}
            value={value}
            onChangeText={(t) => onChangeInput(idx, t)}
            onKeyPress={(e) => onKeyPressLetter(idx, e)}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={1}
          />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Text style={styles.title}>write the word</Text>
          {route?.params?.surprise ? (
            <TouchableOpacity style={styles.skipButton} onPress={navigateToRandomNext} accessibilityRole="button" accessibilityLabel="Skip">
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.wordCard}>
          <Text style={styles.wordText}>{current.entry.translation}</Text>
        </View>

        <View
          style={styles.wordRow}
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
        >
          {current.letters.map((ch, idx) => renderLetterCell(ch, idx))}
        </View>

        {wrongHighlightIndex !== null ? (
          <TouchableOpacity style={styles.nextButton} onPress={() => { resetForNext(); moveToNext(); }}>
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
  title: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    textTransform: 'lowercase',
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
  wordCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  wordText: {
    fontSize: 22,
    fontWeight: '700',
  },
  sentence: {
    color: '#666',
  },
  sentenceHighlight: {
    fontWeight: '700',
    backgroundColor: '#fff3cd',
  },
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    paddingVertical: 12,
  },
  cell: {
    width: 40,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  cellFixed: {
    backgroundColor: '#f8f8f8',
  },
  cellWrong: {
    borderColor: '#e53935',
    backgroundColor: '#ffebee',
  },
  cellText: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 18,
    padding: 0,
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
    bottom: 200,
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
});

export default WriteWordScreen;



