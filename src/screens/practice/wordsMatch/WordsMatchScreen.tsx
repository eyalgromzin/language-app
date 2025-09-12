import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { playCorrectFeedback, playWrongFeedback } from '../common';
import NotEnoughWordsMessage from '../../../components/NotEnoughWordsMessage';
import { WordEntry } from '../../../types/words';
import { useTranslation } from '../../../hooks/useTranslation';

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

function WordsMatchScreen(): React.JSX.Element {
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
  const [loading, setLoading] = React.useState<boolean>(true);
  const [allEntries, setAllEntries] = React.useState<WordEntry[]>([]);
  const [allWords, setAllWords] = React.useState<WordEntry[]>([]); // Store all words for fallback
  const [pairCount, setPairCount] = React.useState<number>(3);
  const [threshold, setThreshold] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);
  const [showEligible, setShowEligible] = React.useState<boolean>(false);
  const [leftItems, setLeftItems] = React.useState<MatchItem[]>([]);
  const [rightItems, setRightItems] = React.useState<MatchItem[]>([]);
  const [matchedKeys, setMatchedKeys] = React.useState<Set<string>>(new Set());
  const [removedKeys, setRemovedKeys] = React.useState<Set<string>>(new Set());
  const [selectedLeftKey, setSelectedLeftKey] = React.useState<string | null>(null);
  const [selectedRightKey, setSelectedRightKey] = React.useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = React.useState<{ leftKey: string; rightKey: string } | null>(null);

  const hasLoadedPairCountRef = React.useRef<boolean>(false);

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
      // Store all valid words for fallback
      const allValidWords = arr.filter((w) => w.word && w.translation);
      setAllWords(allValidWords);
      
      // Filter: keep entries that have word and translation
      let thr = 3;
      let totalThr = 6;
      try {
        const raw = await AsyncStorage.getItem('words.removeAfterNCorrect');
        const parsedNum = Number.parseInt(raw ?? '', 10);
        thr = parsedNum >= 1 && parsedNum <= 4 ? parsedNum : 3;
        const rawTotal = await AsyncStorage.getItem('words.removeAfterTotalCorrect');
        const parsedTotal = Number.parseInt(rawTotal ?? '', 10);
        totalThr = parsedTotal >= 1 && parsedTotal <= 50 ? parsedTotal : 6;
        setRemoveAfterTotalCorrect(totalThr);
      } catch {}
      setThreshold(thr);
      const filtered = allValidWords
        .filter((w) => (w.numberOfCorrectAnswers?.chooseTranslation ?? 0) < thr)
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
    const desired = Math.max(3, Math.min(9, pairCount));
    
    console.log(`WordsMatch: desired=${desired}, available=${available.length}, allWords=${allWords.length}`);
    
    // If we don't have enough filtered words, use all valid words as fallback
    let chosen = sampleN(available, Math.min(desired, available.length));
    
    if (chosen.length < desired && allWords.length > 0) {
      // Use all valid words if we don't have enough filtered words
      chosen = sampleN(allWords, Math.min(desired, allWords.length));
      console.log(`WordsMatch: Using fallback words, chosen=${chosen.length}`);
    }
    
    const left: MatchItem[] = chosen.map((e) => ({ key: e.word, label: e.word }));
    const right: MatchItem[] = chosen.map((e) => ({ key: e.word, label: e.translation }));
    setLeftItems(shuffleArray(left));
    setRightItems(shuffleArray(right));
    setMatchedKeys(new Set());
    setRemovedKeys(new Set());
    setSelectedLeftKey(null);
    setSelectedRightKey(null);
    setWrongFlash(null);
  }, [allEntries, allWords, pairCount]);

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

  // Persist selected pair count so it's remembered next time
  React.useEffect(() => {
    if (!hasLoadedPairCountRef.current) return;
    AsyncStorage.setItem('wordsMatch.pairCount', String(pairCount)).catch(() => {});
  }, [pairCount]);

  // Load saved pair count on mount so it's applied even if there are no words yet
  React.useEffect(() => {
    (async () => {
      try {
        const rawPC = await AsyncStorage.getItem('wordsMatch.pairCount');
        const parsedPC = Number.parseInt(rawPC ?? '', 10);
        if (parsedPC >= 3 && parsedPC <= 9) {
          setPairCount(parsedPC);
        }
      } catch {}
      hasLoadedPairCountRef.current = true;
    })();
  }, []);

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
          chooseTranslation: (it.numberOfCorrectAnswers?.chooseTranslation || 0) + 1,
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
      try { playCorrectFeedback(); } catch {}
      writeBackIncrement(matchedKey);
      // After 2 seconds, remove the matched pair from the board
      setTimeout(() => {
        setRemovedKeys((prev) => {
          const next = new Set(prev);
          next.add(matchedKey);
          const totalKeys = new Set([...leftItems.map((i) => i.key)]);
          if (next.size >= totalKeys.size && totalKeys.size > 0) {
            // refresh list from storage and start a new round
            loadBase().then(() => prepareRound());
          }
          return next;
        });
      }, 1400);
    } else {
      // Wrong match -> trigger red flash (handled by separate timer effect)
      const pair = { leftKey: selectedLeftKey, rightKey: selectedRightKey };
      setWrongFlash(pair);
      try { playWrongFeedback(); } catch {}
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
    const options = [3, 4, 5, 6, 7, 8, 9];
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
        disabled={isMatched || !!wrongFlash}
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

  // Show not enough words message if we don't have enough words for the minimum game size
  const minRequiredWords = Math.max(3, pairCount);
  const hasEnoughWords = allWords.length >= minRequiredWords;
  
  if (!hasEnoughWords) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.title}>match the words to their translations</Text>
        </View>
        {renderCountSelector()}
        <NotEnoughWordsMessage message={t('notEnoughWords.wordsMatchMessage', { minRequiredWords, currentWords: allWords.length })}
        />
      </ScrollView>
    );
  }

  // Additional safety check in case the game somehow ends up with no items
  if (leftItems.length === 0 || rightItems.length === 0) {
    // Only show NotEnoughWordsMessage if we're not loading and have confirmed there's no data
    if (!loading && allWords.length === 0) {
      return (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.topRow}>
            <Text style={styles.title}>match the words to their translations</Text>
          </View>
          {renderCountSelector()}
          <NotEnoughWordsMessage />
        </ScrollView>
      );
    }
    // Show loading spinner while preparing data
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{t('screens.practice.matchWordsToTranslations')}</Text>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={route?.params?.surprise ? navigateToRandomNext : prepareRound}
          accessibilityRole="button"
          accessibilityLabel={t('common.skip')}
        >
          <Text style={styles.skipButtonText}>{t('common.skip')}</Text>
        </TouchableOpacity>
      </View>
      {renderCountSelector()}

      <View style={styles.eligibleHeaderRow}>
        {/* <TouchableOpacity
          style={[styles.countButton, showEligible && styles.countButtonActive]}
          onPress={() => setShowEligible((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={showEligible ? t('screens.practice.hideEligibleWords') : t('screens.practice.showEligibleWords')}
        >
          <Text style={[styles.countButtonText, showEligible && styles.countButtonTextActive]}>
            {showEligible ? t('common.hide') : t('common.show')} {t('screens.practice.eligibleWords')} ({allEntries.length})
          </Text>
        </TouchableOpacity> */}
        {/* <Text style={styles.eligibleMetaText}>below {threshold} correct answers</Text> */}
      </View>

      {showEligible ? (
        <View style={styles.eligibleList}>
          {allEntries.map((e) => (
            <View key={`elig-${e.word}`} style={styles.eligibleItem}>
              <Text style={styles.eligibleWord} numberOfLines={1}>{e.word}</Text>
              <Text style={styles.eligibleCount}>
                {(e.numberOfCorrectAnswers?.chooseTranslation ?? 0)} / {threshold}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.board}>
        <View style={styles.column}>
          {leftItems
            .filter((it) => !removedKeys.has(it.key))
            .map((it) => renderItemButton(it, 'left'))}
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.column}>
          {rightItems
            .filter((it) => !removedKeys.has(it.key))
            .map((it) => renderItemButton(it, 'right'))}
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
    backgroundColor: '#f8f9fa',
  },
  emptyText: {
    color: '#6c757d',
    fontSize: 16,
  },
  container: {
    padding: 20,
    gap: 10,
    backgroundColor: '#f8f9fa',
    minHeight: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    color: '#2c3e50',
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  skipButtonText: {
    fontWeight: '600',
    color: '#6c757d',
    fontSize: 14,
  },
  countRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  countButton: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  countButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  countButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  countButtonTextActive: {
    color: '#ffffff',
  },
  eligibleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eligibleMetaText: {
    color: '#6c757d',
    fontSize: 14,
  },
  board: {
    flexDirection: 'row',
    gap: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8,
  },
  verticalDivider: {
    width: 3,
    backgroundColor: '#e9ecef',
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  eligibleList: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eligibleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  eligibleWord: {
    fontWeight: '600',
    color: '#2c3e50',
    flexShrink: 1,
    marginRight: 8,
    fontSize: 15,
  },
  eligibleCount: {
    color: '#6c757d',
    fontSize: 14,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  itemButton: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  itemButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
    shadowColor: '#007AFF',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  itemButtonCorrect: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    shadowColor: '#28a745',
    shadowOpacity: 0.2,
  },
  itemButtonWrong: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    shadowColor: '#dc3545',
    shadowOpacity: 0.2,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
});

export default WordsMatchScreen;


