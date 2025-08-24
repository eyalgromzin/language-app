import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import { useFocusEffect } from '@react-navigation/native';
import { playCorrectFeedback, playWrongFeedback } from '../common';

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

type Card = {
  id: string; // unique for each card instance
  key: string; // word key to match
  label: string; // word or translation
  kind: 'word' | 'translation';
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

function MemoryGameScreen(): React.JSX.Element {
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
  const [allEntries, setAllEntries] = React.useState<WordEntry[]>([]);
  const [cards, setCards] = React.useState<Card[]>([]);
  const [matchedKeys, setMatchedKeys] = React.useState<Set<string>>(new Set());
  const [revealedIds, setRevealedIds] = React.useState<string[]>([]); // max length 2
  const [isEvaluating, setIsEvaluating] = React.useState<boolean>(false);
  const [threshold, setThreshold] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  const loadBase = React.useCallback(async () => {
    setLoading(true);
    try {
      let thr = 3;
      let totalThr = 6;
      try {
        const raw = await AsyncStorage.getItem('words.removeAfterNCorrect');
        const parsed = Number.parseInt(raw ?? '', 10);
        thr = parsed >= 1 && parsed <= 4 ? parsed : 3;
        const rawTotal = await AsyncStorage.getItem('words.removeAfterTotalCorrect');
        const parsedTotal = Number.parseInt(rawTotal ?? '', 10);
        totalThr = parsedTotal >= 1 && parsedTotal <= 50 ? parsedTotal : 6;
        setRemoveAfterTotalCorrect(totalThr);
      } catch {}
      setThreshold(thr);

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
        .filter((w) => (w.numberOfCorrectAnswers?.memoryGame ?? 0) < thr)
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
          return total < totalThr;
        });
      setAllEntries(filtered);
    } catch {
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  const prepareRound = React.useCallback(() => {
    const available = allEntries;
    const desiredPairs = Math.min(9, Math.max(1, available.length));
    const chosen = sampleN(available, desiredPairs);
    const allCards: Card[] = shuffleArray(
      chosen.flatMap((e, idx) => [
        { id: `${e.word}-w-${idx}`, key: e.word, label: e.word, kind: 'word' as const },
        { id: `${e.word}-t-${idx}`, key: e.word, label: e.translation, kind: 'translation' as const },
      ])
    );
    setCards(allCards);
    setMatchedKeys(new Set());
    setRevealedIds([]);
    setIsEvaluating(false);
  }, [allEntries]);

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
  }, [loading, prepareRound, allEntries.length]);

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
          memoryGame: (it.numberOfCorrectAnswers?.memoryGame || 0) + 1,
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
        } else {
          copy[idx] = it;
        }
        try {
          await RNFS.writeFile(filePath, JSON.stringify(copy, null, 2), 'utf8');
        } catch {}
      }
    } catch {}
  }, [filePath, removeAfterTotalCorrect]);

  const onPickCard = (card: Card) => {
    if (isEvaluating) return;
    if (matchedKeys.has(card.key)) return;
    if (revealedIds.includes(card.id)) return;
    if (revealedIds.length === 2) return;

    const nextRevealed = [...revealedIds, card.id];
    setRevealedIds(nextRevealed);

    if (nextRevealed.length === 2) {
      const [aId, bId] = nextRevealed;
      const a = cards.find((c) => c.id === aId);
      const b = cards.find((c) => c.id === bId);
      if (!a || !b) return;
      const isMatch = a.key === b.key && a.kind !== b.kind;
      if (isMatch) {
        setIsEvaluating(true);
        setTimeout(() => {
          setMatchedKeys((prev) => {
            const next = new Set(prev);
            next.add(a.key);
            return next;
          });
          setRevealedIds([]);
          setIsEvaluating(false);
          try { playCorrectFeedback(); } catch {}
          writeBackIncrement(a.key);
        }, 800);
      } else {
        setIsEvaluating(true);
        setTimeout(() => {
          setRevealedIds([]);
          setIsEvaluating(false);
        }, 1000);
      }
    }
  };

  React.useEffect(() => {
    if (cards.length === 0) return;
    const uniqueKeys = new Set(cards.map((c) => c.key));
    if (matchedKeys.size > 0 && matchedKeys.size >= uniqueKeys.size) {
      setTimeout(() => {
        loadBase().then(() => prepareRound());
      }, 600);
    }
  }, [matchedKeys, cards, prepareRound, loadBase]);

  const renderCard = (card: Card) => {
    const isMatched = matchedKeys.has(card.key);
    const isRevealed = isMatched || revealedIds.includes(card.id);
    return (
      <TouchableOpacity
        key={card.id}
        style={[styles.card, isRevealed && styles.cardRevealed]}
        onPress={() => onPickCard(card)}
        disabled={isEvaluating || isMatched}
        accessibilityRole="button"
        accessibilityLabel={isRevealed ? card.label : 'hidden card'}
      >
        <Text style={[styles.cardText, isMatched && styles.cardTextMatched]}>{isRevealed ? card.label : '❓'}</Text>
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

  if (allEntries.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No words to practice yet.</Text>
      </View>
    );
  }

  return (
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>find all matching pairs</Text>
        {route?.params?.surprise ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={navigateToRandomNext}
            accessibilityRole="button"
            accessibilityLabel="Skip"
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.grid}>
        {cards.map((c) => renderCard(c))}
      </View>
      <TouchableOpacity style={styles.resetButton} onPress={() => prepareRound()} accessibilityRole="button" accessibilityLabel="Restart round">
        <Text style={styles.resetButtonText}>Restart</Text>
      </TouchableOpacity>
      <Text style={styles.metaText}>matched {matchedKeys.size} words</Text>
      
      {/* <Text style={styles.metaText}>pairs: {Math.min(9, allEntries.length)} • below {threshold} correct answers</Text> */}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  card: {
    width: '31%',
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRevealed: {
    borderColor: '#007AFF',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardTextMatched: {
    opacity: 0.2,
  },
  resetButton: {
    marginTop: 6,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  metaText: {
    color: '#666',
    textAlign: 'center',
  },
});

export default MemoryGameScreen;


