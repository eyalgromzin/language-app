import React from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import TTS from 'react-native-tts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AnimatedToast from '../../../components/AnimatedToast';
import FinishedWordAnimation from '../../../components/FinishedWordAnimation';
import { getTtsLangCode, playCorrectFeedback, playWrongFeedback } from '../common';

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
      // Not a standalone match; skip this position
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

function MissingLettersScreen(props: EmbeddedProps = {}): React.JSX.Element {
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
  const [rowWidth, setRowWidth] = React.useState<number | null>(null);
  const inputRefs = React.useRef<Record<number, TextInput | null>>({});
  const [removeAfterCorrect, setRemoveAfterCorrect] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);

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
      const filtered = arr
        .filter((w) => w.word && w.translation)
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
  }, []);

  const moveToNext = React.useCallback(() => {
    if (props.embedded) return;
    setShowCorrectToast(false);
    setShowWrongToast(false);
    loadData();
  }, [loadData, props.embedded]);

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
          // Show finished word animation when word is removed
          setShowFinishedWordAnimation(true);
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
      if (props.embedded) {
        const t = setTimeout(() => props.onFinished?.(false), 1200);
        return () => clearTimeout(t as unknown as number);
      }
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
    const gap = 8; // matches styles.wordRow gap
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
        {!props.embedded ? (
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
                <Ionicons name="volume-high" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.skipButton} onPress={route?.params?.surprise ? navigateToRandomNext : moveToNext} accessibilityRole="button" accessibilityLabel="Skip">
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
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
                <Ionicons name="volume-high" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {current.entry.sentence ? (
          <Text style={styles.sentence} numberOfLines={3}>
            {splitSentenceByWord(current.entry.sentence, current.entry.word).map((p, i) =>
              p.highlight ? (
                <Text key={i} style={styles.sentenceHighlight}>{p.text}</Text>
              ) : (
                <React.Fragment key={i}>{p.text}</React.Fragment>
              )
            )}
          </Text>
        ) : null}

        <View
          style={styles.wordRow}
          onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}
        >
          {current.letters.map((ch, idx) => renderLetterCell(ch, idx))}
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
        message="Correct!"
      />
      <AnimatedToast
        visible={showWrongToast}
        type="fail"
        message="Incorrect"
      />
      <FinishedWordAnimation
        visible={showFinishedWordAnimation}
        onHide={() => setShowFinishedWordAnimation(false)}
      />
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
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: 8,
  },
  translation: {
    fontSize: 20,
    fontWeight: '700',
    maxWidth: '80%',
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
  sentence: {
    color: '#666',
  },
  sentenceHighlight: {
    fontWeight: '700',
    backgroundColor: '#fff3cd',
  },
  wordRow: {
    flex: 1,
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
  micInlineButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

});

export default MissingLettersScreen;


