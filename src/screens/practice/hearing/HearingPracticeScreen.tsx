import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import TTS from 'react-native-tts';
import { getTtsLangCode, playCorrectFeedback, playWrongFeedback } from '../common';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AnimatedToast from '../../../components/AnimatedToast';
import FinishedWordAnimation from '../../../components/FinishedWordAnimation';
import NotEnoughWordsMessage from '../../../components/NotEnoughWordsMessage';

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
    hearing?: number;
  };
};

type OptionItem = {
  key: string;
  label: string;
  isCorrect: boolean;
};

type EmbeddedProps = {
  embedded?: boolean;
  sourceWord?: string;
  correctTranslation?: string;
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
      hearing: 0,
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

function HearingPracticeScreen(props: EmbeddedProps = {}): React.JSX.Element {
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
    'HearingPractice',
  ];
  const navigateToRandomNext = React.useCallback(() => {
    const currentName = (route as any)?.name as string | undefined;
    const choices = RANDOM_GAME_ROUTES.filter((n) => n !== currentName);
    const target = choices[Math.floor(Math.random() * choices.length)] as string;
    navigation.navigate(target as never, { surprise: true } as never);
  }, [navigation, route]);
  const [loading, setLoading] = React.useState<boolean>(props.embedded ? false : true);
  const [allEntries, setAllEntries] = React.useState<WordEntry[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [options, setOptions] = React.useState<OptionItem[]>([]);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [wrongKey, setWrongKey] = React.useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = React.useState<number>(0);
  const [showWrongToast, setShowWrongToast] = React.useState<boolean>(false);
  const [showCorrectToast, setShowCorrectToast] = React.useState<boolean>(false);
  const [showFinishedWordAnimation, setShowFinishedWordAnimation] = React.useState<boolean>(false);
  const [revealCorrect, setRevealCorrect] = React.useState<boolean>(false);
  const [allTranslationsPool, setAllTranslationsPool] = React.useState<string[]>([]);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);

  const lastWordKeyRef = React.useRef<string | null>(null);
  const animationTriggeredRef = React.useRef<Set<string>>(new Set());

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  const autoplay = React.useRef<boolean>(true);

  React.useEffect(() => {
    // Configure TTS with safe defaults
    try {
      TTS.setDefaultRate(0.5);
    } catch {}
  }, []);

  // Load selected learning language and set TTS voice accordingly
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
      let cancelled = false;
      (async () => {
        try {
          const val = await AsyncStorage.getItem('language.learning');
          if (cancelled) return;
          setLearningLanguage(val ?? null);
          const code = getTtsLangCode(val) || 'en-US';
          try { TTS.setDefaultLanguage(code); } catch {}
        } catch {}
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const speakCurrent = React.useCallback((text?: string) => {
    if (!text) return;
    try {
      TTS.stop();
    } catch {}
    try {
      TTS.speak(text);
    } catch {}
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
      const allTranslations = Array.from(
        new Set(
          arr
            .map((w) => w.translation)
            .filter((t): t is string => !!t)
        )
      );
      setAllTranslationsPool(allTranslations);
      const filtered = arr
        .filter((w) => w.word && w.translation)
        .filter((w) => (w.numberOfCorrectAnswers?.hearing ?? 0) < threshold)
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
            (noa.hearing || 0);
          return total < totalThreshold;
        });
      setAllEntries(filtered);
    } catch {
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [filePath, props.embedded]);

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
    const idx = pickNextIndex(entries);
    setCurrentIndex(idx);
    lastWordKeyRef.current = entries[idx].word;

    const correct = entries[idx];
    const basePool = allTranslationsPool.filter((t) => t && t !== correct.translation);
    const picked = sampleN(basePool, Math.min(5, basePool.length)); // 5 distractors + 1 correct = 6
    const combined: OptionItem[] = [
      { key: `c-${correct.word}`, label: correct.translation, isCorrect: true },
      ...picked.map((t, i) => ({ key: `d-${i}-${t}`, label: t, isCorrect: false })),
    ];
    setOptions(shuffleArray(combined));
    setSelectedKey(null);
    setWrongKey(null);
    setWrongAttempts(0);
    setShowWrongToast(false);
    setShowCorrectToast(false);
    setRevealCorrect(false);
    setShowFinishedWordAnimation(false);

    // Auto play the word for hearing
    if (autoplay.current) {
      setTimeout(() => speakCurrent(correct.word), 300);
    }
  }, [pickNextIndex, allTranslationsPool, speakCurrent]);

  React.useEffect(() => {
    loadBase();
  }, [loadBase]);

  useFocusEffect(
    React.useCallback(() => {
      if (!props.embedded) {
        autoplay.current = true;
        loadBase();
        return () => {
          try { TTS.stop(); } catch {}
        };
      }
      return () => {};
    }, [loadBase, props.embedded])
  );

  React.useEffect(() => {
    if (props.embedded) return;
    if (!loading) {
      prepareRound(allEntries);
    }
  }, [loading, allEntries, prepareRound, props.embedded]);

  const current = props.embedded
    ? ({ word: props.sourceWord || '', translation: props.correctTranslation || '' } as WordEntry)
    : allEntries[currentIndex];

  // Build options in embedded mode from props and auto-speak
  React.useEffect(() => {
    if (!props.embedded) return;
    const normalize = (s: string) => (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
    const baseOptions = Array.isArray(props.options) ? props.options : [];
    const correctLabel = (props.correctTranslation || '').trim().replace(/\s+/g, ' ');
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
    // shuffle
    const a = [...items];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    setOptions(a);
    setSelectedKey(null);
    setWrongKey(null);
    setWrongAttempts(0);
    setShowWrongToast(false);
    setShowCorrectToast(false);
    setRevealCorrect(false);
    setShowFinishedWordAnimation(false);
    // autoplay
    const toSpeak = props.sourceWord || '';
    if (toSpeak) {
      setTimeout(() => speakCurrent(toSpeak), 300);
    }
  }, [props.embedded, props.options, props.correctTranslation, props.sourceWord, speakCurrent]);

  const moveToNext = React.useCallback(() => {
    if (props.embedded) return;
    setShowCorrectToast(false);
    setShowWrongToast(false);
    prepareRound(allEntries);
  }, [prepareRound, allEntries, props.embedded]);

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
          hearing: (it.numberOfCorrectAnswers?.hearing || 0) + 1,
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
          (noa.hearing || 0);
        const totalThreshold = removeAfterTotalCorrect || 6;
        if (total >= totalThreshold) {
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
      }
    } catch {}
  }, [filePath, removeAfterTotalCorrect]);

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
      try { playCorrectFeedback(); } catch {}
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
    return <NotEnoughWordsMessage />;
  }

  const correctKey = options.find((o) => o.isCorrect)?.key;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {!props.embedded ? (
          <View style={styles.topRow}>
            <Text style={styles.title}>hearing practice</Text>
            <TouchableOpacity style={styles.skipButton} onPress={route?.params?.surprise ? navigateToRandomNext : moveToNext} accessibilityRole="button" accessibilityLabel="Skip">
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity style={styles.speakerCard} onPress={() => speakCurrent(current.word)} accessibilityRole="button" accessibilityLabel="Play word">
          <Text style={styles.speakerEmoji}>🔊</Text>
          <Text style={styles.speakerText}>Tap to hear</Text>
        </TouchableOpacity>

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
          <TouchableOpacity style={styles.nextButton} onPress={() => prepareRound(allEntries)}>
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
        onHide={() => setShowFinishedWordAnimation(false)}
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
  speakerCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  speakerEmoji: {
    fontSize: 42,
  },
  speakerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
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

export default HearingPracticeScreen;


