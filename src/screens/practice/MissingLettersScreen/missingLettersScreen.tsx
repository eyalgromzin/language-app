import React from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import TTS from 'react-native-tts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AnimatedToast from '../../../components/AnimatedToast';
import FinishedWordAnimation from '../../../components/FinishedWordAnimation';
import NotEnoughWordsMessage from '../../../components/NotEnoughWordsMessage';
import { useTranslation } from '../../../hooks/useTranslation';
import { getTtsLangCode, playCorrectFeedback, playWrongFeedback } from '../common';
import { WordEntry } from '../../../types/words';
import CorrectAnswerDialogue from '../common/correctAnswerDialogue';

type PreparedItem = {
  entry: WordEntry;
  letters: string[];
  missingIndices: number[];
};

type Mode = 'word' | 'translation';

type EmbeddedProps = {
  embedded?: boolean;
  mode?: Mode;
  word?: string;
  translation?: string;
  missingIndices?: number[];
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
  // Split into simple code units for now
  return Array.from(word);
}

type WordGroup = {
  startIdx: number;
  endIdx: number;
  letters: string[];
};

function groupLettersByWords(letters: string[]): WordGroup[] {
  const groups: WordGroup[] = [];
  let currentStart = 0;
  
  for (let i = 0; i < letters.length; i++) {
    if (letters[i] === ' ') {
      if (currentStart < i) {
        groups.push({
          startIdx: currentStart,
          endIdx: i - 1,
          letters: letters.slice(currentStart, i),
        });
      }
      currentStart = i + 1;
    }
  }
  
  // Add the last word if there's any remaining
  if (currentStart < letters.length) {
    groups.push({
      startIdx: currentStart,
      endIdx: letters.length - 1,
      letters: letters.slice(currentStart),
    });
  }
  
  // If no spaces found, return single group with all letters
  if (groups.length === 0) {
    groups.push({
      startIdx: 0,
      endIdx: letters.length - 1,
      letters: letters,
    });
  }
  
  return groups;
}

// Compare user input to the target word allowing plain vowels for accented vowels (á, é, í, ó, ú) and ignoring case
function normalizeForCompare(input: string): string {
  return input
    .toLowerCase()
    .replace(/[áÁ]/g, 'a')
    .replace(/[éÉ]/g, 'e')
    .replace(/[íÍ]/g, 'i')
    .replace(/[óÓ]/g, 'o')
    .replace(/[úÚ]/g, 'u');
}

function isAlphabeticChar(ch: string): boolean {
  return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(ch);
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

function MissingLettersScreen(props: EmbeddedProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode: Mode = (route?.params?.mode as Mode) || props.mode || 'word';
  const RANDOM_GAME_ROUTES: string[] = [
    'MissingLetters',
    'MissingWords',
    'WordsMatch',
    'Translate',
    'ChooseWord',
    'ChooseTranslation',
    'MemoryGame',
    'HearingPractice',
    'FormulateSentense',
  ];
  const navigateToRandomNext = React.useCallback(() => {
    const currentName = (route as any)?.name as string | undefined;
    const choices = RANDOM_GAME_ROUTES.filter((n) => n !== currentName);
    const target = choices[Math.floor(Math.random() * choices.length)] as string;
    const params: any = { surprise: true };
    if (target === 'Translate') params.mode = 'translation';
    if (target === 'MissingLetters') params.mode = 'word';
    navigation.navigate(target as never, params as never);
  }, [navigation, route]);
  const [loading, setLoading] = React.useState<boolean>(props.embedded ? false : true);
  const [items, setItems] = React.useState<PreparedItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [inputs, setInputs] = React.useState<Record<number, string>>({});
  const [wrongHighlightIndex, setWrongHighlightIndex] = React.useState<number | null>(null);
  const [showCorrectToast, setShowCorrectToast] = React.useState<boolean>(false);
  const [showWrongToast, setShowWrongToast] = React.useState<boolean>(false);
  const [showFinishedWordAnimation, setShowFinishedWordAnimation] = React.useState<boolean>(false);
  const [showWrongAnswerDialogue, setShowWrongAnswerDialogue] = React.useState<boolean>(false);
  const [storedMismatchIndex, setStoredMismatchIndex] = React.useState<number | null>(null);
  const [rowWidth, setRowWidth] = React.useState<number | null>(null);
  const inputRefs = React.useRef<Record<number, TextInput | null>>({});
  const [removeAfterCorrect, setRemoveAfterCorrect] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);
  const animationTriggeredRef = React.useRef<Set<string>>(new Set());

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  

  React.useEffect(() => {
    try { TTS.setDefaultRate(0.5); } catch {}
  }, []);

  // Load and apply TTS language (use native language for reading translations)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);
        if (!mounted) return;
        const map = Object.fromEntries(entries);
        setLearningLanguage(map['language.learning'] ?? null);
        setNativeLanguage(map['language.native'] ?? null);
      } catch {
        if (!mounted) return;
        setLearningLanguage(null);
        setNativeLanguage(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    const desired = mode === 'translation' ? learningLanguage : nativeLanguage;
    const code = getTtsLangCode(desired) || 'en-US';
    try { TTS.setDefaultLanguage(code); } catch {}
  }, [learningLanguage, nativeLanguage, mode]);

  const prepare = React.useCallback((arr: WordEntry[], removeAfter: number): PreparedItem[] => {
    return arr.map(ensureCounters).map((entry) => {
      const letters = splitLetters(mode === 'translation' ? entry.translation : entry.word);
      const correctSoFar = mode === 'translation'
        ? (entry.numberOfCorrectAnswers?.writeTranslation ?? 0)
        : (entry.numberOfCorrectAnswers?.missingLetters ?? 0);
      const base = 4 - removeAfter;
      const desiredMissing = base + correctSoFar;
      const missingIndices = pickMissingIndices(letters, desiredMissing);
      return { entry, letters, missingIndices };
    });
  }, [mode]);

  const loadData = React.useCallback(async () => {
    if (props.embedded) {
      setLoading(false);
      setInputs({});
      setWrongHighlightIndex(null);
      setShowCorrectToast(false);
      setShowWrongToast(false);
      setShowFinishedWordAnimation(false);
      setShowWrongAnswerDialogue(false);
      setStoredMismatchIndex(null);
      return;
    }
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
        setRemoveAfterCorrect(valid);
        const rawTotal = await AsyncStorage.getItem('words.removeAfterTotalCorrect');
        const parsedTotal = Number.parseInt(rawTotal ?? '', 10);
        const validTotal = parsedTotal >= 1 && parsedTotal <= 50 ? parsedTotal : 6;
        totalThreshold = validTotal;
        setRemoveAfterTotalCorrect(validTotal);
      } catch {}
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        setItems([]);
        return;
      }
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      const arr = Array.isArray(parsed) ? (parsed as WordEntry[]) : [];
      // First, get all valid words
      const validWords = arr.filter((w) => w.word && w.translation);
      
      // Apply strict filtering first
      const strictlyFiltered = validWords
        .filter((w) => (mode === 'translation'
          ? (w.numberOfCorrectAnswers?.writeTranslation ?? 0)
          : (w.numberOfCorrectAnswers?.missingLetters ?? 0)) < threshold)
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
      
      // If we have enough words with strict filtering, use those
      // Otherwise, include more words to ensure we have at least 1 word available
      let filtered = strictlyFiltered;
      if (strictlyFiltered.length < 1) {
        // If no words pass strict filtering, include words that haven't reached total threshold
        const totalFiltered = validWords.filter((w) => {
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
        
        if (totalFiltered.length > 0) {
          filtered = totalFiltered;
        } else {
          // If still no words, include all valid words
          filtered = validWords;
        }
      }
      const prepared = prepare(filtered, threshold);
      setItems(prepared);
      setCurrentIndex(pickRandomIndex(prepared.length));
      setInputs({});
      setWrongHighlightIndex(null);
      setShowFinishedWordAnimation(false);
      setShowWrongAnswerDialogue(false);
      setStoredMismatchIndex(null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filePath, prepare, props.embedded, mode]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // When the screen gains focus, reload words from storage
  useFocusEffect(
    React.useCallback(() => {
      if (!props.embedded) {
      setShowCorrectToast(false);
      setShowWrongToast(false);
      setShowFinishedWordAnimation(false);
      setShowWrongAnswerDialogue(false);
      setStoredMismatchIndex(null);
      loadData();
      }
    }, [loadData, props.embedded])
  );

  const current = props.embedded
    ? ({
        entry: { word: props.word || '', translation: props.translation || '' },
        letters: splitLetters((props.mode === 'translation' ? props.translation : props.word) || ''),
        missingIndices: props.missingIndices && props.missingIndices.length > 0
          ? props.missingIndices
          : pickMissingIndices(splitLetters((props.mode === 'translation' ? props.translation : props.word) || ''), 2),
      } as PreparedItem)
    : items[currentIndex];

  const topText = (mode === 'translation' ? current?.entry.word : current?.entry.translation) || '';
  const topTextTrimmed = topText.trim();

  const speakCurrent = React.useCallback((text?: string) => {
    const toSpeak = (text || '').trim();
    if (!toSpeak) return;
    try { TTS.stop(); } catch {}
    try { TTS.speak(toSpeak); } catch {}
  }, []);

  // Auto-speak the top text (word for translation mode, translation for word mode)
  React.useEffect(() => {
    if (!topTextTrimmed) return;
    const t = setTimeout(() => speakCurrent(topTextTrimmed), 250);
    return () => clearTimeout(t);
  }, [topTextTrimmed, speakCurrent]);

  const resetForNext = React.useCallback(() => {
    setInputs({});
    setWrongHighlightIndex(null);
    setStoredMismatchIndex(null);
  }, []);

  const moveToNext = React.useCallback(() => {
    if (props.embedded) return;
    setShowCorrectToast(false);
    setShowWrongToast(false);
    if (route?.params?.surprise) {
      navigateToRandomNext();
      return;
    }
    loadData();
  }, [loadData, props.embedded, route?.params?.surprise, navigateToRandomNext]);

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
          ...(mode === 'translation'
            ? { writeTranslation: (it.numberOfCorrectAnswers?.writeTranslation || 0) + 1 }
            : { missingLetters: (it.numberOfCorrectAnswers?.missingLetters || 0) + 1 }),
        } as any;
        // If total correct across all practices reaches threshold, remove the word
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
          // Show finished word animation when word is removed (only once per word)
          if (!animationTriggeredRef.current.has(word)) {
            animationTriggeredRef.current.add(word);
            setShowFinishedWordAnimation(true);
          }
        } else {
          copy[idx] = it;
        }
        try {
          await RNFS.writeFile(filePath, JSON.stringify(copy, null, 2), 'utf8');
        } catch {}
      }
    } catch {}
  }, [filePath, removeAfterTotalCorrect, mode]);

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
    // If we are in a corrected state after a wrong answer, skip success checks
    if (wrongHighlightIndex !== null) return;
    // When all missing indices are filled, check
    const allFilled = current.missingIndices.every((idx) => (inputs[idx] ?? '') !== '');
    if (!allFilled) return;
    // Hide keyboard once all letters are entered
    Keyboard.dismiss();
    const attempt = attemptWord();
    const target = mode === 'translation' ? current.entry.translation : current.entry.word;
    if (normalizeForCompare(attempt) === normalizeForCompare(target)) {
      // Ensure only one toast shows at a time
      setShowWrongToast(false);
      setShowCorrectToast(true);
      try { playCorrectFeedback(); } catch {}
      if (props.embedded) {
        const t = setTimeout(() => props.onFinished?.(true), 600);
        return () => clearTimeout(t as unknown as number);
      }
      writeBackIncrement(current.entry.word);
      const timer = setTimeout(() => {
        moveToNext();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Ensure only one toast shows at a time
      setShowCorrectToast(false);
      setShowWrongToast(true);
      try { playWrongFeedback(); } catch {}
      
      // Find first mismatch for highlighting later
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
      setStoredMismatchIndex(mismatchAt);
      
      // Wait 2 seconds, then show correct answer dialogue
      const wrongTimer = setTimeout(() => {
        setShowWrongToast(false);
        setShowWrongAnswerDialogue(true);
      }, 2000);
      
      return () => clearTimeout(wrongTimer);
    }
  }, [attemptWord, current, inputs, moveToNext, writeBackIncrement, wrongHighlightIndex, props.embedded, props.onFinished, mode]);

  // Focus the first blank input when a new word is shown (and not in corrected state)
  React.useEffect(() => {
    if (!current || wrongHighlightIndex !== null) return;
    const firstBlank = current.missingIndices.find((i) => (inputs[i] ?? '') === '');
    if (typeof firstBlank === 'number') {
      const t = setTimeout(() => inputRefs.current[firstBlank]?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [currentIndex, current, wrongHighlightIndex]);

  if (!props.embedded && loading) {
    return (
      <View style={styles.centered}> 
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading words...</Text>
        </View>
      </View>
    );
  }

  if (!current) {
    // In embedded mode, show loading spinner while props are being set
    if (props.embedded) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator />
        </View>
      );
    }
    return <NotEnoughWordsMessage />;
  }

  const renderLetterCell = (ch: string, idx: number) => {
    const defaultCellWidth = 48;
    const defaultMissingWidth = 32;
    const cellWidth = defaultCellWidth;
    const dynamicFontSize = Math.min(20, Math.max(14, Math.floor(cellWidth * 0.5)));

    const isMissing = current.missingIndices.includes(idx);
    const isWrongSpot = wrongHighlightIndex === idx;
    if (!isMissing) {
      return (
        <Text key={idx} style={[styles.cellText, { fontSize: dynamicFontSize }, isWrongSpot && styles.cellTextWrong]}>
          {ch}
        </Text>
      );
    }
    const value = inputs[idx] ?? '';
    const showAsCorrected = wrongHighlightIndex !== null;
    const missingCellWidth = defaultMissingWidth;
    return (
      <View key={idx} style={[styles.cell, { width: missingCellWidth }, showAsCorrected && styles.cellFixed, isWrongSpot && styles.cellWrong]}>
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

  const renderWordGroup = (group: WordGroup, groupIndex: number) => {
    const defaultCellWidth = 48;
    const dynamicFontSize = Math.min(20, Math.max(14, Math.floor(defaultCellWidth * 0.5)));
    
    return (
      <View key={`word-${groupIndex}`} style={styles.wordGroup}>
        {group.letters.map((ch, localIdx) => {
          const globalIdx = group.startIdx + localIdx;
          return renderLetterCell(ch, globalIdx);
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {!props.embedded ? (
          <>
            <View style={styles.topRow}>
              <View style={styles.translationRow}>
                <Text style={styles.translation} numberOfLines={1}>{topTextTrimmed}</Text>
                <TouchableOpacity
                  style={styles.micInlineButton}
                  onPress={() => speakCurrent(topTextTrimmed)}
                  accessibilityRole="button"
                  accessibilityLabel={mode === 'translation' ? 'Speak word' : 'Speak translation'}
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <Ionicons name="volume-high" size={20} color="#3b82f6" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.skipButton} onPress={route?.params?.surprise ? navigateToRandomNext : moveToNext} accessibilityRole="button" accessibilityLabel={t('common.skip')}>
                <Text style={styles.skipButtonText}>{t('common.skip')}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
        {props.embedded ? (
          <View style={styles.topRow}>
            <View style={styles.translationRow}>
              <Text style={styles.translation} numberOfLines={1}>{topTextTrimmed}</Text>
              <TouchableOpacity
                style={styles.micInlineButton}
                onPress={() => speakCurrent(topTextTrimmed)}
                accessibilityRole="button"
                accessibilityLabel={mode === 'translation' ? 'Speak word' : 'Speak translation'}
                hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
              >
                <Ionicons name="volume-high" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View
          style={styles.wordRow}
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
        >
          {(() => {
            const wordGroups = groupLettersByWords(current.letters);
            const result: React.ReactNode[] = [];
            
            // Render word groups and insert spaces between them
            wordGroups.forEach((group, groupIndex) => {
              if (groupIndex > 0) {
                // Find the space before this word group
                const spaceIdx = group.startIdx - 1;
                if (spaceIdx >= 0 && current.letters[spaceIdx] === ' ') {
                  result.push(
                    <Text key={`space-${spaceIdx}`} style={styles.spaceText}> </Text>
                  );
                }
              }
              result.push(renderWordGroup(group, groupIndex));
            });
            
            return result;
          })()}
        </View>

        {!props.embedded && wrongHighlightIndex !== null ? (
          <TouchableOpacity style={styles.nextButton} onPress={() => { resetForNext(); moveToNext(); }}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <AnimatedToast
        visible={showCorrectToast}
        type="success"
        message={t('common.correct')}
      />
      <AnimatedToast
        visible={showWrongToast}
        type="fail"
        message={t('common.incorrect')}
      />
      <FinishedWordAnimation
        visible={showFinishedWordAnimation}
        onHide={() => setShowFinishedWordAnimation(false)}
      />
      <CorrectAnswerDialogue
        visible={showWrongAnswerDialogue}
        onClose={() => {
          setShowWrongAnswerDialogue(false);
          // Fill correct values into inputs for missing indices after dialogue closes
          if (current) {
            const corrected: Record<number, string> = {};
            current.missingIndices.forEach((idx) => {
              corrected[idx] = current.letters[idx];
            });
            setInputs(corrected);
            // Use the stored mismatch index for highlighting
            setWrongHighlightIndex(storedMismatchIndex);
          }
        }}
        embedded={props.embedded}
        correctWord={current ? (mode === 'translation' ? current.entry.translation : current.entry.word) : undefined}
        translation={current ? (mode === 'translation' ? current.entry.word : current.entry.translation) : undefined}
        current={current?.entry}
        isChooseTranslationMode={mode === 'translation'}
        onFinished={props.onFinished}
        onMoveToNext={moveToNext}
        onHideFinishedAnimation={() => setShowFinishedWordAnimation(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  container: {
    padding: 24,
    gap: 24,
    backgroundColor: '#f8fafc',
    minHeight: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
    marginRight: 12,
  },
  translation: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
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
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skipButtonText: {
    fontWeight: '600',
    color: '#64748b',
    fontSize: 14,
  },
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordGroup: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 12,
    alignItems: 'center',
  },
  spaceText: {
    fontSize: 20,
    width: 12,
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cellFixed: {
    backgroundColor: '#f1f5f9',
    borderWidth: 0,
  },
  cellWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    shadowColor: '#ef4444',
    shadowOpacity: 0.2,
  },
  cellText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  cellTextWrong: {
    color: '#ef4444',
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    padding: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  nextButton: {
    marginTop: 20,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  micInlineButton: {
    backgroundColor: '#f1f5f9',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
});

export default MissingLettersScreen;


