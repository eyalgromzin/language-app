import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import TTS from 'react-native-tts';
import { getTtsLangCode, playCorrectFeedback, playWrongFeedback } from '../common';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AnimatedToast from '../../../components/AnimatedToast';
import FinishedWordAnimation from '../../../components/FinishedWordAnimation';

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

type EmbeddedProps = {
  embedded?: boolean;
  translation?: string;
  correctWord?: string;
  options?: string[];
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

function Choose1OutOfN(props: EmbeddedProps = {}): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isChooseTranslationMode = ((route as any)?.name as string) === 'ChooseTranslation';
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
  const [allEntries, setAllEntries] = React.useState<WordEntry[]>([]);
  const [allWordsPool, setAllWordsPool] = React.useState<string[]>([]);
  const [allTranslationsPool, setAllTranslationsPool] = React.useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [options, setOptions] = React.useState<OptionItem[]>([]);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [wrongKey, setWrongKey] = React.useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = React.useState<number>(0);
  const [showWrongToast, setShowWrongToast] = React.useState<boolean>(false);
  const [showCorrectToast, setShowCorrectToast] = React.useState<boolean>(false);
  const [showFinishedWordAnimation, setShowFinishedWordAnimation] = React.useState<boolean>(false);
  const [revealCorrect, setRevealCorrect] = React.useState<boolean>(false);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [isShowingSuccessToast, setIsShowingSuccessToast] = React.useState<boolean>(false);
  const successToastTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const lastWordKeyRef = React.useRef<string | null>(null);
  const animationTriggeredRef = React.useRef<Set<string>>(new Set());

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  React.useEffect(() => {
    try {
      TTS.setDefaultRate(0.5);
    } catch {}
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const val = await AsyncStorage.getItem('language.learning');
        if (!mounted) return;
        setLearningLanguage(val ?? null);
      } catch {
        if (!mounted) return;
        setLearningLanguage(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const code = getTtsLangCode(learningLanguage) || 'en-US';
    try { TTS.setDefaultLanguage(code); } catch {}
  }, [learningLanguage]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        try { TTS.stop(); } catch {}
        // Clear success toast timeout when leaving the screen
        if (successToastTimeoutRef.current) {
          clearTimeout(successToastTimeoutRef.current);
          successToastTimeoutRef.current = null;
        }
      };
    }, [])
  );

  const speakCurrent = React.useCallback((text?: string) => {
    if (!text) return;
    try { TTS.stop(); } catch {}
    try { TTS.speak(text); } catch {}
  }, []);

  const loadBase = React.useCallback(async () => {
    if (props.embedded) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
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
        setAllEntries([]);
        return;
      }
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      const arr = Array.isArray(parsed) ? (parsed as WordEntry[]).map(ensureCounters) : [];
      const filtered = arr
        .filter((w) => w.word && w.translation)
        .filter((w) => ((isChooseTranslationMode ? w.numberOfCorrectAnswers?.chooseTranslation : w.numberOfCorrectAnswers?.chooseWord) ?? 0) < threshold)
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
      setAllEntries(filtered);
      const poolUniqueWords = Array.from(new Set(arr.map((e) => e.word).filter((w): w is string => !!w)));
      const poolUniqueTranslations = Array.from(new Set(arr.map((e) => e.translation).filter((t): t is string => !!t)));
      setAllWordsPool(poolUniqueWords);
      setAllTranslationsPool(poolUniqueTranslations);
    } catch {
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filePath, props.embedded, isChooseTranslationMode]);

  const pickNextIndex = React.useCallback((items: WordEntry[]) => {
    if (items.length === 0) return 0;
    if (items.length === 1) return 0;
    let pool = items
      .map((_, i) => i)
      .filter((i) => items[i].word !== lastWordKeyRef.current);
    if (pool.length === 0) pool = items.map((_, i) => i);
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  const prepareRound = React.useCallback((entries: WordEntry[], preserveSuccessToast: boolean = false) => {
    if (entries.length === 0) {
      setOptions([]);
      return;
    }
    if (entries.length < 2) {
      // Need at least 2 words to create options (1 correct + 1 distractor)
      setOptions([]);
      return;
    }
    const globalPool = isChooseTranslationMode ? allTranslationsPool : allWordsPool;
    if (globalPool.length < 8) {
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
      .map((e) => (isChooseTranslationMode ? e.translation : e.word))
      .filter((t) => t && t !== (isChooseTranslationMode ? correct.translation : correct.word));
    const uniqueDistractors = Array.from(new Set(distractorPool));
    const needed = 7;
    const picked = sampleN(uniqueDistractors, Math.min(needed, uniqueDistractors.length));
    const correctLabel = isChooseTranslationMode ? correct.translation : correct.word;
    const combined: OptionItem[] = [
      { key: `c-${correctLabel}`, label: correctLabel, isCorrect: true },
      ...picked.map((t, i) => ({ key: `d-${i}-${t}`, label: t, isCorrect: false })),
    ];
    // Ensure 8 unique words by filling from the global pool of unique words
    const already = new Set(combined.map((o) => o.label));
    const remainingUnique = globalPool.filter((w) => w !== correctLabel && !already.has(w));
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
    if (!preserveSuccessToast) {
      setShowCorrectToast(false);
    }
    setRevealCorrect(false);
    // Auto play the translation on load
    const toSpeak = isChooseTranslationMode ? entries[idx]?.word : entries[idx]?.translation;
    if (toSpeak) {
      setTimeout(() => speakCurrent(toSpeak), 300);
    }
  }, [pickNextIndex, allWordsPool, allTranslationsPool, speakCurrent, isChooseTranslationMode]);

  React.useEffect(() => {
    loadBase();
    
    // Cleanup function to clear timeout when component unmounts
    return () => {
      if (successToastTimeoutRef.current) {
        clearTimeout(successToastTimeoutRef.current);
        successToastTimeoutRef.current = null;
      }
    };
  }, [loadBase]);

  useFocusEffect(
    React.useCallback(() => {
      loadBase();
    }, [loadBase])
  );

  React.useEffect(() => {
    if (props.embedded) return;
    if (!loading && !isShowingSuccessToast) {
      // Check if there are enough words to continue the game
      if (allEntries.length === 0) {
        // No words available, show empty state
        setOptions([]);
        setCurrentIndex(0);
      } else if (allEntries.length < 2) {
        // Not enough words for the game (need at least 2 for options)
        setOptions([]);
        setCurrentIndex(0);
      } else {
        prepareRound(allEntries, false);
      }
    }
  }, [loading, allEntries, prepareRound, props.embedded, isShowingSuccessToast]);

  const current = props.embedded
    ? ({ translation: props.translation || '' } as WordEntry)
    : allEntries[currentIndex];

  // Build options in embedded mode
  React.useEffect(() => {
    if (!props.embedded) return;
    const normalize = (s: string) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const baseOptions = Array.isArray(props.options) ? props.options : [];
    const correctLabel = (props.correctWord || '').trim().replace(/\s+/g, ' ');
    const correctNorm = normalize(correctLabel);
    const uniqueMap = new Map<string, string>();
    if (correctLabel.length > 0) uniqueMap.set(correctNorm, correctLabel);
    for (const o of baseOptions) {
      const norm = normalize(o);
      if (!uniqueMap.has(norm)) uniqueMap.set(norm, (o || '').trim().replace(/\s+/g, ' '));
    }
    const combined = Array.from(uniqueMap.values());
    const items: OptionItem[] = combined.map((label, i) => ({
      key: `${normalize(label)}-${i}`,
      label,
      isCorrect: normalize(label) === correctNorm,
    }));
    setOptions(shuffleArray(items));
    setSelectedKey(null);
    setWrongKey(null);
    setWrongAttempts(0);
    setShowWrongToast(false);
    setShowCorrectToast(false);
    setRevealCorrect(false);
    // Autoplay in embedded mode as well
    const toSpeak = props.translation || '';
    if (toSpeak) {
      setTimeout(() => speakCurrent(toSpeak), 300);
    }
  }, [props.embedded, props.options, props.correctWord, props.translation, speakCurrent]);

  const moveToNext = React.useCallback(() => {
    setShowCorrectToast(false);
    setShowWrongToast(false);
    setIsShowingSuccessToast(false);
    // Clear success toast timeout
    if (successToastTimeoutRef.current) {
      clearTimeout(successToastTimeoutRef.current);
      successToastTimeoutRef.current = null;
    }
    prepareRound(allEntries, false);
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
          ...(isChooseTranslationMode
            ? { chooseTranslation: (it.numberOfCorrectAnswers?.chooseTranslation || 0) + 1 }
            : { chooseWord: (it.numberOfCorrectAnswers?.chooseWord || 0) + 1 }),
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
        const wordWasRemoved = total >= totalThreshold;
        if (wordWasRemoved) {
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
        
        // Don't reload base data immediately to avoid interfering with toast display
        // The loadBase will be called when the success toast is finished
      }
    } catch {}
  }, [filePath, removeAfterTotalCorrect, isChooseTranslationMode, loadBase]);

  const onPick = (opt: OptionItem) => {
    if (!current) return;
    if (selectedKey || revealCorrect) return;
    if (props.embedded) {
      if (opt.isCorrect) {
        setSelectedKey(opt.key);
        setShowWrongToast(false);
        setShowCorrectToast(true);
        try { playCorrectFeedback(); } catch {}
        const t = setTimeout(() => props.onFinished?.(true), 600);
        return () => clearTimeout(t as unknown as number);
      }
      setWrongKey(opt.key);
      setShowWrongToast(true);
      try { playWrongFeedback(); } catch {}
      const t = setTimeout(() => props.onFinished?.(false), 1200);
      return () => clearTimeout(t as unknown as number);
    }
    if (opt.isCorrect) {
      setSelectedKey(opt.key);
      setShowWrongToast(false);
      setShowCorrectToast(true);
      setIsShowingSuccessToast(true);
      try { playCorrectFeedback(); } catch {}
      
      // Clear any existing timeout
      if (successToastTimeoutRef.current) {
        clearTimeout(successToastTimeoutRef.current);
      }
      
      // Delay the writeBackIncrement to avoid interfering with toast display
      setTimeout(() => {
        writeBackIncrement(current.word);
      }, 1000);
      
      // Keep success toast visible for 4 seconds before moving to next round
      successToastTimeoutRef.current = setTimeout(() => {
        setShowCorrectToast(false);
        setIsShowingSuccessToast(false);
        // Reload base data after toast is hidden
        loadBase();
        setTimeout(() => {
          prepareRound(allEntries, false); // Now safe to prepare next round
        }, 200); // Small delay to ensure toast is hidden before preparing next round
      }, 4000);
    }
    if (wrongAttempts >= 1) {
      setWrongKey(opt.key);
      setRevealCorrect(true);
      setShowWrongToast(true);
      try { playWrongFeedback(); } catch {}
      const hide = setTimeout(() => setShowWrongToast(false), 3000);
      return () => clearTimeout(hide as unknown as number);
    }
    setWrongKey(opt.key);
    setWrongAttempts(1);
    setShowWrongToast(true);
    try { playWrongFeedback(); } catch {}
    const hide = setTimeout(() => setShowWrongToast(false), 2000);
    return () => {
      clearTimeout(hide as unknown as number);
    };
  };

  if (!props.embedded && loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!current || options.length === 0) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>📚</Text>
          <Text style={styles.emptyStateTitle}>
            {allWordsPool.length < 8
              ? 'Need More Words'
              : allEntries.length === 0
              ? 'No Words Available'
              : allEntries.length < 2
              ? 'Not Enough Words'
              : 'No Words Available'}
          </Text>
          <Text style={styles.emptyStateMessage}>
            {allWordsPool.length < 8
              ? 'Add more words to reach at least 8 unique words for this practice.'
              : allEntries.length === 0
              ? 'You haven\'t added any words to practice yet. Add some words to get started!'
              : allEntries.length < 2
              ? 'You need at least 2 words available for this practice type. Add more words or try a different practice.'
              : 'No words are currently available for practice.'}
          </Text>
          <TouchableOpacity 
            style={styles.backToPracticeButton} 
            onPress={() => navigation.navigate('PracticeHome' as never)}
            accessibilityRole="button"
            accessibilityLabel="Back to Practice"
          >
            <Text style={styles.backToPracticeButtonText}>Back to Practice</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const correctKey = options.find((o) => o.isCorrect)?.key;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {!props.embedded ? (
          <View style={styles.topRow}>
            <Text style={styles.title}>{isChooseTranslationMode ? 'pick the correct translation' : 'pick the correct word'}</Text>
            <TouchableOpacity style={styles.skipButton} onPress={route?.params?.surprise ? navigateToRandomNext : moveToNext} accessibilityRole="button" accessibilityLabel="Skip">
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.wordCard}>
          <View style={styles.wordRow}>
            <Text style={styles.wordText}>{isChooseTranslationMode ? current.word : current.translation}</Text>
            <TouchableOpacity onPress={() => speakCurrent(isChooseTranslationMode ? current.word : current.translation)} accessibilityRole="button" accessibilityLabel="Play">
              <Text style={styles.speakerIcon}>🔊</Text>
            </TouchableOpacity>
          </View>
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

        {!props.embedded && revealCorrect ? (
          <TouchableOpacity style={styles.nextButton} onPress={() => prepareRound(allEntries, false)}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <AnimatedToast
        visible={showWrongToast}
        type="fail"
        message="Try again!"
      />
      <AnimatedToast
        visible={showCorrectToast}
        type="success"
        message="Correct!"
      />
      <FinishedWordAnimation
        visible={showFinishedWordAnimation}
        onHide={() => {
          setShowFinishedWordAnimation(false);
          // Clear the animation trigger set when animation is hidden
          animationTriggeredRef.current.clear();
        }}
      />
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
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    maxWidth: 300,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  backToPracticeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backToPracticeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerIcon: {
    marginLeft: 8,
    fontSize: 22,
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

});

export default Choose1OutOfN;


