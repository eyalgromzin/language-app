import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
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
    wordsAndTranslations: number;
    writeTranslation: number;
    writeWord: number;
  };
};

type MatchItem = {
  key: string; // stable key, use entry.word
  label: string; // word or translation
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

function WordsMatchScreen(): React.JSX.Element {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [allEntries, setAllEntries] = React.useState<WordEntry[]>([]);
  const [pairCount, setPairCount] = React.useState<number>(3);
  const [leftItems, setLeftItems] = React.useState<MatchItem[]>([]);
  const [rightItems, setRightItems] = React.useState<MatchItem[]>([]);
  const [matchedKeys, setMatchedKeys] = React.useState<Set<string>>(new Set());
  const [selectedLeftKey, setSelectedLeftKey] = React.useState<string | null>(null);
  const [selectedRightKey, setSelectedRightKey] = React.useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = React.useState<{ leftKey: string; rightKey: string } | null>(null);

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  const loadBase = React.useCallback(async () => {
    setLoading(true);
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        setAllEntries([]);
        return;
      }
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      const arr = Array.isArray(parsed) ? (parsed as WordEntry[]).map(ensureCounters) : [];
      // Filter: keep entries that have word and translation
      let threshold = 3;
      try {
        const raw = await AsyncStorage.getItem('words.removeAfterNCorrect');
        const parsedNum = Number.parseInt(raw ?? '', 10);
        threshold = parsedNum >= 1 && parsedNum <= 4 ? parsedNum : 3;
      } catch {}
      const filtered = arr.filter((w) => w.word && w.translation)
        .filter((w) => (w.numberOfCorrectAnswers?.wordsAndTranslations ?? 0) < threshold);
      setAllEntries(filtered);
    } catch {
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  const prepareRound = React.useCallback(() => {
    const available = allEntries;
    const desired = Math.max(1, Math.min(6, Math.max(3, pairCount)));
    const chosen = sampleN(available, Math.min(desired, Math.max(1, available.length)));
    const left: MatchItem[] = chosen.map((e) => ({ key: e.word, label: e.word }));
    const right: MatchItem[] = chosen.map((e) => ({ key: e.word, label: e.translation }));
    setLeftItems(shuffleArray(left));
    setRightItems(shuffleArray(right));
    setMatchedKeys(new Set());
    setSelectedLeftKey(null);
    setSelectedRightKey(null);
    setWrongFlash(null);
  }, [allEntries, pairCount]);

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
      prepareRound();
    }
  }, [loading, prepareRound, pairCount, allEntries.length]);

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
          wordsAndTranslations: (it.numberOfCorrectAnswers?.wordsAndTranslations || 0) + 1,
        };
        copy[idx] = it;
        try {
          await RNFS.writeFile(filePath, JSON.stringify(copy, null, 2), 'utf8');
        } catch {}
      }
    } catch {}
  }, [filePath]);

  const onPickLeft = (item: MatchItem) => {
    if (matchedKeys.has(item.key)) return;
    if (wrongFlash) return;
    setSelectedLeftKey((prev) => (prev === item.key ? null : item.key));
  };

  const onPickRight = (item: MatchItem) => {
    if (matchedKeys.has(item.key)) return;
    if (wrongFlash) return;
    setSelectedRightKey((prev) => (prev === item.key ? null : item.key));
  };

  React.useEffect(() => {
    if (!selectedLeftKey || !selectedRightKey) return;
    if (wrongFlash) return;
    if (selectedLeftKey === selectedRightKey) {
      // Correct match
      setMatchedKeys((prev) => new Set(prev).add(selectedLeftKey));
      const matchedKey = selectedLeftKey;
      setSelectedLeftKey(null);
      setSelectedRightKey(null);
      writeBackIncrement(matchedKey);
      // If all matched, start a new round after a short delay
      setTimeout(() => {
        const totalKeys = new Set([...leftItems.map((i) => i.key)]);
        const matchedNow = new Set(matchedKeys);
        matchedNow.add(matchedKey);
        if (matchedNow.size >= totalKeys.size && totalKeys.size > 0) {
          // refresh list from storage too
          loadBase().then(() => prepareRound());
        }
      }, 300);
    } else {
      // Wrong match -> trigger red flash (handled by separate timer effect)
      const pair = { leftKey: selectedLeftKey, rightKey: selectedRightKey };
      setWrongFlash(pair);
    }
  }, [selectedLeftKey, selectedRightKey, wrongFlash, leftItems, matchedKeys, prepareRound, loadBase, writeBackIncrement]);

  // When wrongFlash is set, flash the two items red for 2 seconds, then clear and re-enable selection
  React.useEffect(() => {
    if (!wrongFlash) return;
    const t = setTimeout(() => {
      setWrongFlash(null);
      setSelectedLeftKey(null);
      setSelectedRightKey(null);
    }, 2000);
    return () => clearTimeout(t);
  }, [wrongFlash]);

  const renderCountSelector = () => {
    const options = [3, 4, 5, 6];
    return (
      <View style={styles.countRow}>
        {options.map((n) => (
          <TouchableOpacity key={n} style={[styles.countButton, pairCount === n && styles.countButtonActive]} onPress={() => setPairCount(n)}>
            <Text style={[styles.countButtonText, pairCount === n && styles.countButtonTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderItemButton = (item: MatchItem, side: 'left' | 'right') => {
    const isMatched = matchedKeys.has(item.key);
    const isSelected = side === 'left' ? selectedLeftKey === item.key : selectedRightKey === item.key;
    const isWrong = wrongFlash && ((side === 'left' && wrongFlash.leftKey === item.key) || (side === 'right' && wrongFlash.rightKey === item.key));
    return (
      <TouchableOpacity
        key={`${side}-${item.key}-${item.label}`}
        style={[styles.itemButton, isMatched && styles.itemButtonCorrect, isWrong && styles.itemButtonWrong, isSelected && styles.itemButtonSelected]}
        onPress={() => (side === 'left' ? onPickLeft(item) : onPickRight(item))}
        disabled={isMatched}
        accessibilityRole="button"
        accessibilityLabel={item.label}
      >
        <Text style={styles.itemText}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (leftItems.length === 0 || rightItems.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No words to practice yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>match the words to their translations</Text>
      {renderCountSelector()}

      <View style={styles.board}>
        <View style={styles.column}>
          {leftItems.map((it) => renderItemButton(it, 'left'))}
        </View>
        <View style={styles.column}>
          {rightItems.map((it) => renderItemButton(it, 'right'))}
        </View>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  countRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  countButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  countButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  countButtonTextActive: {
    color: '#fff',
  },
  board: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  itemButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  itemButtonSelected: {
    borderColor: '#007AFF',
  },
  itemButtonCorrect: {
    backgroundColor: '#e6f7e9',
    borderColor: '#2e7d32',
  },
  itemButtonWrong: {
    backgroundColor: '#ffebee',
    borderColor: '#e53935',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WordsMatchScreen;


