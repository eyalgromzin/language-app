import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { playCorrectFeedback, } from '../common';
import NotEnoughWordsMessage from '../../../components/NotEnoughWordsMessage';
import { WordEntry } from '../../../types/words';
import { navigateToNextInShuffledOrder } from '../common/surprisePracticeOrder';

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
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const navigateToRandomNext = React.useCallback(() => {
    navigateToNextInShuffledOrder(navigation);
  }, [navigation]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [allEntries, setAllEntries] = React.useState<WordEntry[]>([]);
  const [cards, setCards] = React.useState<Card[]>([]);
  const [matchedKeys, setMatchedKeys] = React.useState<Set<string>>(new Set());
  const [revealedIds, setRevealedIds] = React.useState<string[]>([]); // max length 2
  const [isEvaluating, setIsEvaluating] = React.useState<boolean>(false);
  const [threshold, setThreshold] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);
  const [score, setScore] = React.useState<number>(0);
  const [moves, setMoves] = React.useState<number>(0);
  const [numberOfPairs, setNumberOfPairs] = React.useState<number>(6);
  const [showDropdown, setShowDropdown] = React.useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = React.useState<boolean>(false);
  const [showCongratulations, setShowCongratulations] = React.useState<boolean>(false);

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
    const desiredPairs = Math.min(numberOfPairs, Math.max(1, available.length));
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
    setScore(0);
    setMoves(0);
  }, [allEntries, numberOfPairs]);

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
      setMoves(prev => prev + 1);
      const [aId, bId] = nextRevealed;
      const a = cards.find((c) => c.id === aId);
      const b = cards.find((c) => c.id === bId);
      if (!a || !b) return;
      const isMatch = a.key === b.key && a.kind !== b.kind;
      if (isMatch) {
        setIsEvaluating(true);
        setScore(prev => prev + 1);
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
        }, 2000);
      }
    }
  };

  React.useEffect(() => {
    if (cards.length === 0) return;
    const uniqueKeys = new Set(cards.map((c) => c.key));
    if (matchedKeys.size > 0 && matchedKeys.size >= uniqueKeys.size) {
      setTimeout(() => {
        setShowCongratulations(true);
      }, 600);
    }
  }, [matchedKeys, cards]);

  const handleContinue = React.useCallback(() => {
    setShowCongratulations(false);
    if (route?.params?.surprise) {
      navigateToRandomNext();
      return;
    }
    loadBase().then(() => prepareRound());
  }, [loadBase, prepareRound, route?.params?.surprise, navigateToRandomNext]);

  const renderCard = (card: Card) => {
    const isMatched = matchedKeys.has(card.key);
    const isRevealed = isMatched || revealedIds.includes(card.id);
    const isWrong = revealedIds.length === 2 && revealedIds.includes(card.id) && !isMatched;
    
    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.card, 
          isRevealed && styles.cardRevealed,
          isMatched && styles.cardMatched,
          isWrong && styles.cardWrong
        ]}
        onPress={() => onPickCard(card)}
        disabled={isEvaluating || isMatched}
        accessibilityRole="button"
        accessibilityLabel={isRevealed ? card.label : t('screens.practice.memoryGameScreen.hiddenCard')}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {isRevealed ? (
            <Text style={[styles.cardText, isMatched && styles.cardTextMatched]}>
              {card.label}
            </Text>
          ) : (
            <View style={styles.cardBack}>
              <Text style={styles.cardBackText}>?</Text>
            </View>
          )}
        </View>
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
    return <NotEnoughWordsMessage />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('screens.practice.memoryGameScreen.title')}</Text>
            {!isFullScreen && (
              <Text style={styles.subtitle}>{t('screens.practice.memoryGameScreen.subtitle')}</Text>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.fullScreenButton}
              onPress={() => setIsFullScreen(!isFullScreen)}
              accessibilityRole="button"
              accessibilityLabel={isFullScreen ? t('screens.practice.memoryGameScreen.exitFullScreen') : t('screens.practice.memoryGameScreen.enterFullScreen')}
            >
              <Text style={styles.fullScreenButtonText}>
                {isFullScreen ? '⛶' : '⛶'}
              </Text>
            </TouchableOpacity>
            {route?.params?.surprise ? (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={navigateToRandomNext}
                accessibilityRole="button"
                accessibilityLabel={t('screens.practice.memoryGameScreen.skipToNextGame')}
              >
                <Text style={styles.skipButtonText}>{t('screens.practice.memoryGameScreen.skip')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        
        {/* Stats Row - Hidden in full screen mode */}
        {!isFullScreen && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>{t('screens.practice.memoryGameScreen.found')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{moves}</Text>
                <Text style={styles.statLabel}>{t('screens.practice.memoryGameScreen.moves')}</Text>
              </View>
              <View style={styles.statItem}>
                <TouchableOpacity 
                  style={styles.totalContainer}
                  onPress={() => setShowDropdown(!showDropdown)}
                  accessibilityRole="button"
                  accessibilityLabel={t('screens.practice.memoryGameScreen.selectNumberOfPairs')}
                >
                  <Text style={styles.statValue}>{Math.min(numberOfPairs, allEntries.length)}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                <Text style={styles.statLabel}>{t('screens.practice.memoryGameScreen.total')}</Text>
              </View>
            </View>
            
            {/* Dropdown positioned outside stats container */}
            {showDropdown && (
              <View style={styles.dropdown}>
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.dropdownItem,
                      numberOfPairs === num && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setNumberOfPairs(num);
                      setShowDropdown(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t('screens.practice.memoryGameScreen.selectPairs', { count: num })}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      numberOfPairs === num && styles.dropdownItemTextSelected
                    ]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* Game Grid */}
      <View style={styles.gameContainer}>
        <View style={styles.grid}>
          {cards.map((c) => renderCard(c))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={() => prepareRound()} 
          accessibilityRole="button" 
          accessibilityLabel={t('screens.practice.memoryGameScreen.restartGame')}
        >
           <Text style={styles.resetButtonText}>{t('screens.practice.memoryGameScreen.newGame')}</Text>
        </TouchableOpacity>
      </View>

      {/* Congratulations Modal */}
      <Modal
        visible={showCongratulations}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCongratulations(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.congratulationsContainer}>
            <View style={styles.congratulationsContent}>
              <Text style={styles.congratulationsEmoji}>🎉</Text>
              <Text style={styles.congratulationsTitle}>
                {t('screens.practice.memoryGameScreen.congratulations')}
              </Text>
              <Text style={styles.congratulationsMessage}>
                {t('screens.practice.memoryGameScreen.gameCompleted', { 
                  score: score, 
                  moves: moves 
                })}
              </Text>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                accessibilityRole="button"
                accessibilityLabel={t('screens.practice.memoryGameScreen.continue')}
              >
                <Text style={styles.continueButtonText}>
                  {t('screens.practice.memoryGameScreen.continue')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  // Header Styles
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullScreenButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenButtonText: {
    fontSize: 30,
    fontWeight: '600',
    color: '#3b82f6',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  skipButtonText: {
    fontWeight: '600',
    color: '#3b82f6',
    fontSize: 14,
  },
  
  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 1000,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    zIndex: 1001,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 200,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 9999,
    minWidth: 60,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemSelected: {
    backgroundColor: '#3b82f6',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  dropdownItemTextSelected: {
    color: '#ffffff',
  },
  
  // Game Container
  gameContainer: {
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  
  // Card Styles
  card: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  cardRevealed: {
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.2,
    transform: [{ scale: 1.02 }],
  },
  cardMatched: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    shadowColor: '#10b981',
    shadowOpacity: 0.2,
  },
  cardWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    shadowColor: '#ef4444',
    shadowOpacity: 0.2,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1e293b',
    lineHeight: 18,
  },
  cardTextMatched: {
    color: '#10b981',
    opacity: 0.8,
  },
  cardBack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    width: '100%',
  },
  cardBackText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#94a3b8',
  },
  
  // Actions
  actionsContainer: {
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 160,
  },
  resetButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Congratulations Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  congratulationsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 320,
    width: '100%',
  },
  congratulationsContent: {
    alignItems: 'center',
    padding: 32,
  },
  congratulationsEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  congratulationsTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  congratulationsMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 160,
  },
  continueButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MemoryGameScreen;


