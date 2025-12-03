import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from '../../../hooks/useTranslation';
import { WordEntry } from '../../../types/words';
import NotEnoughWordsMessage from '../../../components/NotEnoughWordsMessage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;

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
      flipCards: 0,
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

function FlipCardsScreen(): React.JSX.Element {
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
    'HearingPractice',
    'FlipCards',
  ];
  
  const navigateToRandomNext = React.useCallback(() => {
    const currentName = (route as any)?.name as string | undefined;
    const choices = RANDOM_GAME_ROUTES.filter((n) => n !== currentName);
    const target = choices[Math.floor(Math.random() * choices.length)] as string;
    navigation.navigate(target as never, { surprise: true } as never);
  }, [navigation, route]);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [allEntries, setAllEntries] = React.useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [isFlipped, setIsFlipped] = React.useState<boolean>(false);
  
  const flipAnimation = React.useRef(new Animated.Value(0)).current;
  const pan = React.useRef(new Animated.ValueXY()).current;
  const cardOpacity = React.useRef(new Animated.Value(1)).current;
  const rotateCard = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-15deg', '0deg', '15deg'],
  });
  const CARD_DISAPPEAR_TIME = 500

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  const loadBase = React.useCallback(async () => {
    setLoading(true);
    try {
      // Load user setting for number of correct answers to remove a word
      let threshold = 3;
      let totalThreshold = 6;
      try {
        const raw = await AsyncStorage.getItem('words.removeAfterNCorrect');
        const parsed = Number.parseInt(raw ?? '', 10);
        const valid = parsed >= 1 && parsed <= 4 ? parsed : 3;
        threshold = valid;
        const rawTotal = await AsyncStorage.getItem('words.removeAfterTotalCorrect');
        const parsedTotal = Number.parseInt(rawTotal ?? '', 10);
        const validTotal = parsedTotal >= 1 && parsedTotal <= 50 ? parsedTotal : 6;
        totalThreshold = validTotal;
      } catch {}
      
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        setAllEntries([]);
        return;
      }
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      const arr = Array.isArray(parsed) ? (parsed as WordEntry[]).map(ensureCounters) : [];
      
      // Filter words that haven't passed the practice threshold
      const filtered = arr
        .filter((w) => w.word && w.translation)
        .filter((w) => (w.numberOfCorrectAnswers?.flipCards ?? 0) < threshold)
        .filter((w) => {
          const noa = w.numberOfCorrectAnswers || ({} as any);
          const total =
            (noa.missingLetters || 0) +
            (noa.missingWords || 0) +
            (noa.chooseTranslation || 0) +
            (noa.chooseWord || 0) +
            (noa.memoryGame || 0) +
            (noa.writeTranslation || 0) +
            (noa.writeWord || 0) +
            (noa.flipCards || 0);
          return total < totalThreshold;
        });
      
      const shuffled = shuffleArray(filtered);
      setAllEntries(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
      flipAnimation.setValue(0);
      cardOpacity.setValue(1);
    } catch {
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filePath, flipAnimation]);

  useFocusEffect(
    React.useCallback(() => {
      loadBase();
      return () => {};
    }, [loadBase])
  );

  // Note: Card fade-in is now handled in goToNextCard after fade-out completes

  const writeBackIncrement = React.useCallback(async (wordKey: string): Promise<boolean> => {
    try {
      let threshold = 3;
      let totalThreshold = 6;
      try {
        const raw = await AsyncStorage.getItem('words.removeAfterNCorrect');
        const parsed = Number.parseInt(raw ?? '', 10);
        const valid = parsed >= 1 && parsed <= 4 ? parsed : 3;
        threshold = valid;
        const rawTotal = await AsyncStorage.getItem('words.removeAfterTotalCorrect');
        const parsedTotal = Number.parseInt(rawTotal ?? '', 10);
        const validTotal = parsedTotal >= 1 && parsedTotal <= 50 ? parsedTotal : 6;
        totalThreshold = validTotal;
      } catch {}
      
      const exists = await RNFS.exists(filePath);
      if (!exists) return false;
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      if (!Array.isArray(parsed)) return false;
      const arr = (parsed as WordEntry[]).map(ensureCounters);
      const idx = arr.findIndex((it) => it.word === wordKey);
      if (idx >= 0) {
        const copy = [...arr];
        const it = { ...copy[idx] };
        it.numberOfCorrectAnswers = {
          ...it.numberOfCorrectAnswers!,
          flipCards: (it.numberOfCorrectAnswers?.flipCards || 0) + 1,
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
          (noa.flipCards || 0);
        
        // Check if word should be removed (meets either threshold)
        const shouldRemove =  total >= totalThreshold;
        
        if (shouldRemove) {
          copy.splice(idx, 1);
        } else {
          copy[idx] = it;
        }
        try {
          await RNFS.writeFile(filePath, JSON.stringify(copy, null, 2), 'utf8');
        } catch {}
        
        return shouldRemove;
      }
      return false;
    } catch {
      return false;
    }
  }, [filePath]);

  const handleFlip = () => {
    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 10,
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        useNativeDriver: true,
        friction: 8,
        tension: 10,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const goToNextCard = React.useCallback((incrementPractice: boolean = false) => {
    setCurrentIndex((prevIndex) => {
      const currentWordEntry = allEntries[prevIndex];
      
      // Check if word should be removed (optimistically using default thresholds)
      // The async writeBackIncrement will use actual thresholds and handle file update
      let shouldRemoveFromList = false;
      if (incrementPractice && currentWordEntry) {
        // Calculate if word will meet threshold after increment
        const noa = currentWordEntry.numberOfCorrectAnswers || {
          missingLetters: 0,
          missingWords: 0,
          chooseTranslation: 0,
          chooseWord: 0,
          memoryGame: 0,
          writeTranslation: 0,
          writeWord: 0,
          flipCards: 0,
        };
        const newFlipCardsCount = (noa.flipCards || 0) + 1;
        const newTotal =
          (noa.missingLetters || 0) +
          (noa.missingWords || 0) +
          (noa.chooseTranslation || 0) +
          (noa.chooseWord || 0) +
          (noa.memoryGame || 0) +
          (noa.writeTranslation || 0) +
          (noa.writeWord || 0) +
          newFlipCardsCount;
        
        // Use default thresholds for optimistic check (3 for flipCards, 6 for total)
        // The actual thresholds will be checked in writeBackIncrement
        shouldRemoveFromList = newFlipCardsCount >= 3 || newTotal >= 6;
        
        // Perform async increment and removal check
        writeBackIncrement(currentWordEntry.word).then((actuallyRemoved) => {
          // If async check differs from optimistic check, update state
          if (actuallyRemoved && !shouldRemoveFromList) {
            // Word should be removed but wasn't removed optimistically
            setAllEntries((prevEntries) => {
              return prevEntries.filter((entry) => entry.word !== currentWordEntry.word);
            });
          }
        });
      }

      // Remove word from list immediately if it should be removed
      if (shouldRemoveFromList && currentWordEntry) {
        setAllEntries((prevEntries) => {
          return prevEntries.filter((entry) => entry.word !== currentWordEntry.word);
        });
      }

      // Reset card state
      setIsFlipped(false);
      flipAnimation.setValue(0);
      pan.setValue({ x: 0, y: 0 });
      cardOpacity.setValue(0);
      
      // Calculate adjusted entries length (accounting for removal)
      const adjustedLength = shouldRemoveFromList && currentWordEntry
        ? allEntries.length - 1
        : allEntries.length;
      
      // Move to next card
      // If we removed the current card and we're at or past the last index, we've reached the end
      if (shouldRemoveFromList && currentWordEntry && prevIndex >= adjustedLength) {
        // Reached the end after removal, reload
        if (route?.params?.surprise) {
          navigateToRandomNext();
        } else {
          loadBase();
        }
        return prevIndex; // Keep current index until reload completes
      } else if (prevIndex >= adjustedLength - 1) {
        // Reached the end, reload
        if (route?.params?.surprise) {
          navigateToRandomNext();
        } else {
          loadBase();
        }
        return prevIndex; // Keep current index until reload completes
      } else {
        // If we removed the current card, stay at the same index (which now points to the next card)
        // Otherwise, move to the next index
        const nextIndex = shouldRemoveFromList && currentWordEntry ? prevIndex : prevIndex + 1;
        
        // Fade in the new card after a brief delay
        setTimeout(() => {
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: CARD_DISAPPEAR_TIME,
            useNativeDriver: true,
          }).start();
        }, 50);
        
        return nextIndex;
      }
    });
  }, [allEntries, writeBackIncrement, route?.params?.surprise, navigateToRandomNext, loadBase, flipAnimation, pan, cardOpacity]);

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx, dy } = gestureState;
          const swipeDistance = Math.abs(dx);
          
          if (swipeDistance > SWIPE_THRESHOLD) {
            // Large swipe - fade out card over 0.5 seconds, then load next card
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: CARD_DISAPPEAR_TIME,
              useNativeDriver: true,
            }).start(() => {
              // After fade out completes, move to next card
              if (dx > 0) {
                // Swipe right - increment practice and next card
                goToNextCard(true);
              } else {
                // Swipe left - just next card
                goToNextCard(false);
              }
            });
            
            // Also animate the card off screen - use very fast animation
            Animated.timing(pan, {
              toValue: { x: dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, y: 0 },
              duration: 50,
              useNativeDriver: true,
            }).start();
          } else {
            // Small swipe - return card to original position
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
              friction: 7,
              tension: 40,
            }).start();
          }
        },
      }),
    [goToNextCard, cardOpacity, pan]
  );

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (allEntries.length === 0) {
    return <NotEnoughWordsMessage />;
  }

  const currentWord = allEntries[currentIndex];
  if (!currentWord) {
    return (
      <View style={styles.centered}>
        <Text>No more words</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {allEntries.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: cardOpacity,
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
                { rotate: rotateCard },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleFlip}
            style={styles.cardTouchable}
          >
            <Animated.View
              style={[styles.card, styles.cardFront, frontAnimatedStyle]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>{t('screens.practice.word')}</Text>
                <Text style={styles.cardText}>{currentWord.word}</Text>
                {currentWord.sentence && (
                  <Text style={styles.cardSentence}>{currentWord.sentence}</Text>
                )}
                <Text style={styles.flipHint}>{t('screens.practice.tapToFlip')}</Text>
              </View>
            </Animated.View>

            <Animated.View
              style={[styles.card, styles.cardBack, backAnimatedStyle]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardLabel}>{t('screens.practice.translation')}</Text>
                <Text style={styles.cardText}>{currentWord.translation}</Text>
                {currentWord.sentence && (
                  <Text style={styles.cardSentence}>{currentWord.sentence}</Text>
                )}
                <Text style={styles.flipHint}>{t('screens.practice.tapToFlip')}</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          {t('screens.practice.swipeLeftNext')} | {t('screens.practice.swipeRightPractice')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: 400,
  },
  cardTouchable: {
    width: '100%',
    height: '100%',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardFront: {
    backgroundColor: '#3B82F6',
  },
  cardBack: {
    backgroundColor: '#10B981',
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  cardSentence: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  flipHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 30,
    textAlign: 'center',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  hintText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default FlipCardsScreen;

