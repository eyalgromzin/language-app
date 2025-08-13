import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

type OptionItem = {
  key: string;
  label: string;
  isCorrect: boolean;
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
  const result: T[] = [];
  while (result.length < n && a.length > 0) {
    const idx = Math.floor(Math.random() * a.length);
    result.push(a[idx]);
    a.splice(idx, 1);
  }
  return result;
}

function ChooseWordScreen(): React.JSX.Element {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [allEntries, setAllEntries] = React.useState<WordEntry[]>([]);
  const [allWordsPool, setAllWordsPool] = React.useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [options, setOptions] = React.useState<OptionItem[]>([]);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [wrongKey, setWrongKey] = React.useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = React.useState<number>(0);
  const [showWrongToast, setShowWrongToast] = React.useState<boolean>(false);
  const [showCorrectToast, setShowCorrectToast] = React.useState<boolean>(false);
  const [revealCorrect, setRevealCorrect] = React.useState<boolean>(false);

  const lastWordKeyRef = React.useRef<string | null>(null);

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  const loadBase = React.useCallback(async () => {
    setLoading(true);
    try {
      let threshold = 3;
      try {
        const raw = await AsyncStorage.getItem('words.removeAfterNCorrect');
        const parsed = Number.parseInt(raw ?? '', 10);
        threshold = parsed >= 1 && parsed <= 4 ? parsed : 3;
      } catch {}

      const exists = await RNFS.exists(filePath);
      if (!exists) {
        setAllEntries([]);
        return;
      }
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      const arr = Array.isArray(parsed) ? (parsed as WordEntry[]).map(ensureCounters) : [];
      const filtered = arr
        .filter((w) => w.word && w.translation)
        .filter((w) => (w.numberOfCorrectAnswers?.chooseWord ?? 0) < threshold);
      setAllEntries(filtered);
      const poolUnique = Array.from(new Set(arr.map((e) => e.word).filter((w): w is string => !!w)));
      setAllWordsPool(poolUnique);
    } catch {
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  const pickNextIndex = React.useCallback((items: WordEntry[]) => {
    if (items.length === 0) return 0;
    if (items.length === 1) return 0;
    let pool = items
      .map((_, i) => i)
      .filter((i) => items[i].word !== lastWordKeyRef.current);
    if (pool.length === 0) pool = items.map((_, i) => i);
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const prepareRound = React.useCallback((entries: WordEntry[]) => {
    if (entries.length === 0) {
      setOptions([]);
      return;
    }
    if (allWordsPool.length < 8) {
      // Not enough unique words overall to show 8 distinct options
      setOptions([]);
      return;
    }
    const idx = pickNextIndex(entries);
    setCurrentIndex(idx);
    lastWordKeyRef.current = entries[idx].word;

    const correct = entries[idx];
    const distractorPool = entries
      .filter((e, i) => i !== idx)
      .map((e) => e.word)
      .filter((t) => t && t !== correct.word);
    const uniqueDistractors = Array.from(new Set(distractorPool));
    const needed = 7;
    const picked = sampleN(uniqueDistractors, Math.min(needed, uniqueDistractors.length));
    const combined: OptionItem[] = [
      { key: `c-${correct.translation}`, label: correct.word, isCorrect: true },
      ...picked.map((t, i) => ({ key: `d-${i}-${t}`, label: t, isCorrect: false })),
    ];
    // Ensure 8 unique words by filling from the global pool of unique words
    const already = new Set(combined.map((o) => o.label));
    const remainingUnique = allWordsPool.filter((w) => w !== correct.word && !already.has(w));
    const toFill = Math.max(0, 8 - combined.length);
    const fillers = sampleN(remainingUnique, Math.min(toFill, remainingUnique.length));
    fillers.forEach((w, i) => {
      combined.push({ key: `f-${i}-${w}`, label: w, isCorrect: false });
    });
    // As a final guard, trim in case of any overshoot and shuffle
    const exactlyEight = combined.slice(0, 8);
    setOptions(shuffleArray(exactlyEight));
    setSelectedKey(null);
    setWrongKey(null);
    setWrongAttempts(0);
    setShowWrongToast(false);
    setShowCorrectToast(false);
    setRevealCorrect(false);
  }, [pickNextIndex, allWordsPool]);

  React.useEffect(() => {
    loadBase();
  }, [loadBase]);

  useFocusEffect(
    React.useCallback(() => {
      loadBase();
    }, [loadBase])
  );

  React.useEffect(() => {
    if (!loading) {
      prepareRound(allEntries);
    }
  }, [loading, allEntries, prepareRound]);

  const current = allEntries[currentIndex];

  const moveToNext = React.useCallback(() => {
    setShowCorrectToast(false);
    setShowWrongToast(false);
    prepareRound(allEntries);
  }, [prepareRound, allEntries]);

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
          chooseWord: (it.numberOfCorrectAnswers?.chooseWord || 0) + 1,
        };
        copy[idx] = it;
        try {
          await RNFS.writeFile(filePath, JSON.stringify(copy, null, 2), 'utf8');
        } catch {}
      }
    } catch {}
  }, [filePath]);

  const onPick = (opt: OptionItem) => {
    if (!current) return;
    if (selectedKey || revealCorrect) return;
    if (opt.isCorrect) {
      setSelectedKey(opt.key);
      setShowWrongToast(false);
      setShowCorrectToast(true);
      writeBackIncrement(current.word);
      const t = setTimeout(() => {
        prepareRound(allEntries);
      }, 2000);
      return () => clearTimeout(t as unknown as number);
    }
    if (wrongAttempts >= 1) {
      setWrongKey(opt.key);
      setRevealCorrect(true);
      setShowWrongToast(true);
      const hide = setTimeout(() => setShowWrongToast(false), 3000);
      return () => clearTimeout(hide as unknown as number);
    }
    setWrongKey(opt.key);
    setWrongAttempts(1);
    setShowWrongToast(true);
    const hide = setTimeout(() => setShowWrongToast(false), 2000);
    return () => {
      clearTimeout(hide as unknown as number);
    };
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!current || options.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          {allWordsPool.length < 8
            ? 'Add more words to reach at least 8 unique words.'
            : 'No words to practice yet.'}
        </Text>
      </View>
    );
  }

  const correctKey = options.find((o) => o.isCorrect)?.key;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.title}>pick the correct word</Text>
          <TouchableOpacity style={styles.skipButton} onPress={() => moveToNext()} accessibilityRole="button" accessibilityLabel="Skip">
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.wordCard}>
          <Text style={styles.wordText}>{current.translation}</Text>
        </View>

        <View style={styles.optionsWrap}>
          {options.map((opt) => {
            const isSelectedCorrect = selectedKey === opt.key && opt.isCorrect;
            const isWrong = wrongKey === opt.key;
            const isRevealedCorrect = revealCorrect && opt.key === correctKey;
            const disabled = !!selectedKey || revealCorrect;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.optionButton,
                  isSelectedCorrect && styles.optionButtonCorrect,
                  isWrong && styles.optionButtonWrong,
                  isRevealedCorrect && styles.optionButtonCorrect,
                ]}
                onPress={() => onPick(opt)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={opt.label}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {revealCorrect ? (
          <TouchableOpacity style={styles.nextButton} onPress={() => prepareRound(allEntries)}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {showWrongToast ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastEmoji}>❌</Text>
          <Text style={styles.toastText}>try again</Text>
        </View>
      ) : null}
      {showCorrectToast ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastEmoji}>✅</Text>
          <Text style={styles.toastText}>Correct!</Text>
        </View>
      ) : null}
    </View>
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
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  optionButton: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  optionButtonCorrect: {
    backgroundColor: '#e6f7e9',
    borderColor: '#2e7d32',
  },
  optionButtonWrong: {
    backgroundColor: '#ffebee',
    borderColor: '#e53935',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
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
});

export default ChooseWordScreen;


