import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import RNFS from 'react-native-fs';

type WordEntry = {
  word: string;
  translation: string;
  sentence?: string;
  addedAt?: string;
  numberOfCorrectAnswers?: {
    missingLetters: number;
    missingWords: number;
    wordsAndTranslations: number;
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
      wordsAndTranslations: 0,
      writeTranslation: 0,
      writeWord: 0,
    },
  };
}

function pickMissingIndices(letters: string[]): number[] {
  const candidateIndices: number[] = [];
  for (let i = 0; i < letters.length; i += 1) {
    const ch = letters[i];
    if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) {
      candidateIndices.push(i);
    }
  }
  if (candidateIndices.length === 0) return [];
  const desired = Math.max(1, Math.min(3, Math.ceil(candidateIndices.length / 3)));
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
  // Split into simple code units for now
  return Array.from(word);
}

// Compare user input to the target word allowing plain vowels for accented vowels (á, é, í, ó, ú)
function normalizeForCompare(input: string): string {
  return input
    .replace(/[áÁ]/g, 'a')
    .replace(/[éÉ]/g, 'e')
    .replace(/[íÍ]/g, 'i')
    .replace(/[óÓ]/g, 'o')
    .replace(/[úÚ]/g, 'u');
}

function MissingLettersScreen(): React.JSX.Element {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [items, setItems] = React.useState<PreparedItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [inputs, setInputs] = React.useState<Record<number, string>>({});
  const [wrongHighlightIndex, setWrongHighlightIndex] = React.useState<number | null>(null);
  const [showCorrectToast, setShowCorrectToast] = React.useState<boolean>(false);
  const [showWrongToast, setShowWrongToast] = React.useState<boolean>(false);
  const inputRefs = React.useRef<Record<number, TextInput | null>>({});

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  const prepare = React.useCallback((arr: WordEntry[]): PreparedItem[] => {
    return arr.map(ensureCounters).map((entry) => {
      const letters = splitLetters(entry.word);
      const missingIndices = pickMissingIndices(letters);
      return { entry, letters, missingIndices };
    });
  }, []);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        setItems([]);
        return;
      }
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      const arr = Array.isArray(parsed) ? (parsed as WordEntry[]) : [];
      const prepared = prepare(arr.filter((w) => w.word && w.translation));
      setItems(prepared);
      setCurrentIndex(0);
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

  const current = items[currentIndex];

  const resetForNext = React.useCallback(() => {
    setInputs({});
    setWrongHighlightIndex(null);
  }, []);

  const moveToNext = React.useCallback(() => {
    setShowCorrectToast(false);
    setShowWrongToast(false);
    setWrongHighlightIndex(null);
    setInputs({});
    setCurrentIndex((prev) => {
      if (items.length === 0) return 0;
      return (prev + 1) % items.length;
    });
  }, [items.length]);

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
          missingLetters: (it.numberOfCorrectAnswers?.missingLetters || 0) + 1,
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

  React.useEffect(() => {
    if (!current) return;
    // If we are in a corrected state after a wrong answer, skip success checks
    if (wrongHighlightIndex !== null) return;
    // When all missing indices are filled, check
    const allFilled = current.missingIndices.every((idx) => (inputs[idx] ?? '') !== '');
    if (!allFilled) return;
    const attempt = attemptWord();
    const target = current.entry.word;
    if (normalizeForCompare(attempt) === normalizeForCompare(target)) {
      // Ensure only one toast shows at a time
      setShowWrongToast(false);
      setShowCorrectToast(true);
      writeBackIncrement(target);
      const timer = setTimeout(() => {
        moveToNext();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      // Ensure only one toast shows at a time
      setShowCorrectToast(false);
      setShowWrongToast(true);
      const wrongTimer = setTimeout(() => setShowWrongToast(false), 2000);
      // Find first mismatch
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
      // Fill correct values into inputs for missing indices
      const corrected: Record<number, string> = {};
      current.missingIndices.forEach((idx) => {
        corrected[idx] = current.letters[idx];
      });
      setInputs(corrected);
      setWrongHighlightIndex(mismatchAt);
      return () => clearTimeout(wrongTimer);
    }
  }, [attemptWord, current, inputs, moveToNext, writeBackIncrement, wrongHighlightIndex]);

  // Focus the first blank input when a new word is shown (and not in corrected state)
  React.useEffect(() => {
    if (!current || wrongHighlightIndex !== null) return;
    const firstBlank = current.missingIndices.find((i) => (inputs[i] ?? '') === '');
    if (typeof firstBlank === 'number') {
      const t = setTimeout(() => inputRefs.current[firstBlank]?.focus(), 50);
      return () => clearTimeout(t);
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
    const isMissing = current.missingIndices.includes(idx);
    const isWrongSpot = wrongHighlightIndex === idx;
    if (!isMissing) {
      return (
        <View key={idx} style={[styles.cell, styles.cellFixed, isWrongSpot && styles.cellWrong]}>
          <Text style={styles.cellText}>{ch}</Text>
        </View>
      );
    }
    const value = inputs[idx] ?? '';
    const showAsCorrected = wrongHighlightIndex !== null;
    return (
      <View key={idx} style={[styles.cell, showAsCorrected && styles.cellFixed, isWrongSpot && styles.cellWrong]}>
        {showAsCorrected ? (
          <Text style={styles.cellText}>{current.letters[idx]}</Text>
        ) : (
          <TextInput
            style={styles.input}
            ref={(r) => { inputRefs.current[idx] = r; }}
            value={value}
            onChangeText={(t) => onChangeInput(idx, t)}
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
        <Text style={styles.translation}>{current.entry.translation}</Text>
        {current.entry.sentence ? (
          <Text style={styles.sentence} numberOfLines={3}>{current.entry.sentence}</Text>
        ) : null}

        <View style={styles.wordRow}>
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
  translation: {
    fontSize: 20,
    fontWeight: '700',
  },
  sentence: {
    color: '#666',
  },
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    left: 0,
    right: 0,
    bottom: 24,
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

export default MissingLettersScreen;


