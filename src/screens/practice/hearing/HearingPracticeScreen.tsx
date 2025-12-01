import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import TTS from 'react-native-tts';
import { useTranslation } from 'react-i18next';
import { getTtsLangCode, playCorrectFeedback, playWrongFeedback } from '../common';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AnimatedToast from '../../../components/AnimatedToast';
import FinishedWordAnimation from '../../../components/FinishedWordAnimation';
import NotEnoughWordsMessage from '../../../components/NotEnoughWordsMessage';
import { WordEntry } from '../../../types/words';

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
  const { t } = useTranslation();
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
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);

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

  // Load selected learning and native languages and set TTS voice accordingly
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
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    // For hearing practice, use learning language accent for the word being spoken
    // since the user is hearing the word they're learning
    const code = getTtsLangCode(learningLanguage) || 'en-US';
    try { TTS.setDefaultLanguage(code); } catch {}
  }, [learningLanguage]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);
          if (cancelled) return;
          const map = Object.fromEntries(entries);
          setLearningLanguage(map['language.learning'] ?? null);
          setNativeLanguage(map['language.native'] ?? null);
          const code = getTtsLangCode(map['language.learning']) || 'en-US';
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
      
      // Additional check: ensure we have enough words for the hearing practice
      // We need to check if we have enough words for the word with the highest hearing correct answers
      const maxHearingCorrectAnswers = Math.max(...filtered.map(w => w.numberOfCorrectAnswers?.hearing || 0), 0);
      const maxRequiredOptions = (2 + maxHearingCorrectAnswers) * 2;
      const maxRequiredDistractors = maxRequiredOptions - 1;
      
      if (allTranslations.length < maxRequiredDistractors) {
        setAllEntries([]);
        return;
      }
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
    const hearingCorrectAnswers = correct.numberOfCorrectAnswers?.hearing || 0;
    const requiredOptions = (2 + hearingCorrectAnswers) * 2;
    const requiredDistractors = requiredOptions - 1; // -1 for the correct answer
    
    const basePool = allTranslationsPool.filter((t) => t && t !== correct.translation);
    
    // Check if we have enough words for the required number of options
    if (basePool.length < requiredDistractors) {
      setOptions([]);
      return;
    }
    
    const picked = sampleN(basePool, Math.min(requiredDistractors, basePool.length));
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
      }
      return () => {
        if (!props.embedded) {
          try { TTS.stop(); } catch {}
        }
      };
    }, [loadBase, props.embedded])
  );

  React.useEffect(() => {
    if (!props.embedded && !loading) {
      prepareRound(allEntries);
    }
  }, [loading, allEntries, prepareRound, props.embedded]);

  const current = props.embedded
    ? ({ word: props.sourceWord || '', translation: props.correctTranslation || '' } as WordEntry)
    : allEntries[currentIndex];

  // Build options in embedded mode from props and auto-speak
  React.useEffect(() => {
    if (props.embedded) {
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
    }
  }, [props.embedded, props.options, props.correctTranslation, props.sourceWord, speakCurrent]);

  const moveToNext = React.useCallback(() => {
    if (props.embedded) return;
    setShowCorrectToast(false);
    setShowWrongToast(false);
    if (route?.params?.surprise) {
      navigateToRandomNext();
      return;
    }
    prepareRound(allEntries);
  }, [prepareRound, allEntries, props.embedded, route?.params?.surprise, navigateToRandomNext]);

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
        setTimeout(() => props.onFinished?.(true), 600);
        return;
      }
      setWrongKey(opt.key);
      setShowWrongToast(true);
      try { playWrongFeedback(); } catch {}
      setTimeout(() => props.onFinished?.(false), 1200);
      return;
    }
    
    if (opt.isCorrect) {
      setSelectedKey(opt.key);
      setShowWrongToast(false);
      setShowCorrectToast(true);
      try { playCorrectFeedback(); } catch {}
      writeBackIncrement(current.word);
      setTimeout(() => {
        prepareRound(allEntries);
      }, 2000);
      return;
    }
    
    if (wrongAttempts >= 1) {
      setWrongKey(opt.key);
      setRevealCorrect(true);
      setShowWrongToast(true);
      try { playWrongFeedback(); } catch {}
      setTimeout(() => setShowWrongToast(false), 3000);
      return;
    }
    
    setWrongKey(opt.key);
    setWrongAttempts(1);
    setShowWrongToast(true);
    try { playWrongFeedback(); } catch {}
    setTimeout(() => setShowWrongToast(false), 2000);
  };

  // Check if we have enough words for the current round
  const hasEnoughWords = React.useMemo(() => {
    if (!current || props.embedded) return true;
    
    const hearingCorrectAnswers = current.numberOfCorrectAnswers?.hearing || 0;
    const requiredOptions = (2 + hearingCorrectAnswers) * 2;
    const requiredDistractors = requiredOptions - 1;
    
    return allTranslationsPool.length >= requiredDistractors;
  }, [current, allTranslationsPool, props.embedded]);

  const correctKey = options.find((o) => o.isCorrect)?.key;

  if (!props.embedded && loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>{t('screens.practice.hearingPracticeScreen.loadingPractice')}</Text>
      </View>
    );
  }

  if (!current || options.length === 0 || !hasEnoughWords) {
    // In embedded mode, show loading spinner while props are being set
    if (props.embedded) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>{t('screens.practice.hearingPracticeScreen.preparing')}</Text>
        </View>
      );
    }
    return <NotEnoughWordsMessage />;
  }

  return (
    <View style={styles.screenContainer}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {!props.embedded ? (
          <View style={styles.topRow}>
            <Text style={styles.title}>{t('screens.practice.hearingPracticeScreen.title')}</Text>
            <TouchableOpacity style={styles.skipButton} onPress={route?.params?.surprise ? navigateToRandomNext : moveToNext} accessibilityRole="button" accessibilityLabel={t('screens.practice.hearingPracticeScreen.skip')}>
              <Text style={styles.skipButtonText}>{t('screens.practice.hearingPracticeScreen.skip')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity style={styles.speakerCard} onPress={() => speakCurrent(current.word)} accessibilityRole="button" accessibilityLabel={t('screens.practice.hearingPracticeScreen.playWord')}>
          <View style={styles.speakerIcon}>
            <View style={styles.speakerWaves}>
              <View style={[styles.wave, styles.wave1]} />
              <View style={[styles.wave, styles.wave2]} />
              <View style={[styles.wave, styles.wave3]} />
            </View>
          </View>
          <Text style={styles.speakerText}>{t('screens.practice.hearingPracticeScreen.tapToHear')}</Text>
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
            <Text style={styles.nextButtonText}>{t('screens.practice.hearingPracticeScreen.next')}</Text>
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
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
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
  loadingText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
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
  title: {
    fontSize: 24,
    color: '#1e293b',
    fontWeight: '700',
    textTransform: 'capitalize',
    letterSpacing: -0.5,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  skipButtonText: {
    fontWeight: '600',
    color: '#3b82f6',
    fontSize: 14,
  },
  speakerCard: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginVertical: 8,
  },
  speakerIcon: {
    width: 60,
    height: 60,
    marginBottom: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerBase: {
    width: 24,
    height: 18,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    position: 'absolute',
    zIndex: 2,
  },
  speakerWaves: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 50,
  },
  wave1: {
    width: 30,
    height: 30,
    opacity: 0.8,
  },
  wave2: {
    width: 40,
    height: 40,
    opacity: 0.6,
  },
  wave3: {
    width: 50,
    height: 50,
    opacity: 0.4,
  },
  speakerText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
    marginTop: 8,
  },
  optionButton: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  optionButtonCorrect: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  optionButtonWrong: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 22,
  },
  nextButton: {
    marginTop: 20,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});

export default HearingPracticeScreen;


