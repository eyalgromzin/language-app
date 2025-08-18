import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLangCode } from '../../utils/translation';

type StepItem = {
  id: string;
  title?: string;
  type?: 'word' | 'sentence';
  text: string;
  practiceType?: 'chooseTranslation' | 'missingWords';
};

type StepsFile = {
  language: string;
  overview?: string;
  steps: Array<{
    id: string;
    title: string;
    items: StepItem[];
  }>;
};

const STEPS_BY_CODE: Record<string, StepsFile> = {
  en: require('./steps_en.json'),
  es: require('./steps_es.json'),
};

type RunnerTask =
  | {
      kind: 'chooseTranslation';
      sourceWord: string; // in current language
      correctTranslation: string; // from other language file matched by id
      options: string[]; // includes correct + distractors
      itemId: string;
    }
  | {
      kind: 'missingWords';
      sentence: string; // in current language
      translatedSentence: string; // from other language file
      tokens: string[];
      missingIndices: number[];
      wordBank: string[]; // include correct missing words + extras from same step
      itemId: string;
    };

function splitToTokens(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .filter(Boolean);
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
  const out: T[] = [];
  while (out.length < n && a.length > 0) {
    const idx = Math.floor(Math.random() * a.length);
    out.push(a[idx]);
    a.splice(idx, 1);
  }
  return out;
}

function BabyStepRunnerScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const stepIndex: number = Math.max(0, Number.parseInt(String(route?.params?.stepIndex ?? '0'), 10) || 0);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [tasks, setTasks] = React.useState<RunnerTask[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState<number>(0);
  const [inputs, setInputs] = React.useState<Record<number, string>>({});
  const [wrongKey, setWrongKey] = React.useState<string | null>(null);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [numCorrect, setNumCorrect] = React.useState<number>(0);
  const [numWrong, setNumWrong] = React.useState<number>(0);
  const [currentHadMistake, setCurrentHadMistake] = React.useState<boolean>(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Determine current learning language
        const learningName = await AsyncStorage.getItem('language.learning');
        const currentCode = getLangCode(learningName) || 'en';
        const currentFile = STEPS_BY_CODE[currentCode] || STEPS_BY_CODE['en'];
        const otherCodes = Object.keys(STEPS_BY_CODE).filter((c) => c !== currentCode);
        const otherFiles = otherCodes.map((c) => STEPS_BY_CODE[c]);

        const step = currentFile.steps[stepIndex];
        if (!step) {
          setTasks([]);
          return;
        }

        // Helper to find matching item text by id in other languages
        const findOtherTextById = (itemId: string): string | null => {
          for (const f of otherFiles) {
            for (const s of f.steps) {
              const match = s.items.find((it) => it.id === itemId);
              if (match) return match.text;
            }
          }
          return null;
        };

        // Gather extras from same step for word bank (tokens from sentences, word texts from current language)
        const extrasFromStep: string[] = [];
        step.items.forEach((it) => {
          if (it.type === 'sentence' || it.practiceType === 'missingWords') {
            splitToTokens(it.text).forEach((t) => extrasFromStep.push(t));
          } else if (it.type === 'word' || it.practiceType === 'chooseTranslation') {
            if (it.text) extrasFromStep.push(it.text);
          }
        });

        const built: RunnerTask[] = step.items.map((it) => {
          const otherText = findOtherTextById(it.id) || it.text;
          if (it.practiceType === 'chooseTranslation' || it.type === 'word') {
            // Build distractors from other word items in same step
            const distractorPool: string[] = [];
            step.items.forEach((o) => {
              if (o.id !== it.id && (o.type === 'word' || o.practiceType === 'chooseTranslation')) {
                const t = findOtherTextById(o.id);
                if (t && t !== otherText) distractorPool.push(t);
              }
            });
            const picked = sampleN(Array.from(new Set(distractorPool)), Math.min(7, Math.max(0, distractorPool.length)));
            const allOptions = shuffleArray([otherText, ...picked]);
            return {
              kind: 'chooseTranslation',
              sourceWord: it.text,
              correctTranslation: otherText,
              options: allOptions,
              itemId: it.id,
            } as RunnerTask;
          }
          // missingWords for sentences
          const tokens = splitToTokens(it.text);
          // Choose 1-2 indices to blank, prefer alphabetic tokens
          const candidateIdx: number[] = [];
          tokens.forEach((t, i) => { if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(t)) candidateIdx.push(i); });
          const desired = Math.min(2, Math.max(1, Math.floor(tokens.length / 6)));
          const missingIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
          const required = Array.from(new Set(missingIndices.map((i) => tokens[i])));
          const pool = extrasFromStep.filter((w) => !required.includes(w));
          const picked = sampleN(pool, Math.max(0, 12 - required.length));
          const wordBank = shuffleArray([...required, ...picked]).slice(0, Math.max(6, required.length));
          return {
            kind: 'missingWords',
            sentence: it.text,
            translatedSentence: otherText,
            tokens,
            missingIndices,
            wordBank,
            itemId: it.id,
          } as RunnerTask;
        });

        if (!mounted) return;
        setTasks(shuffleArray(built));
        setCurrentIdx(0);
        setInputs({});
        setWrongKey(null);
        setSelectedKey(null);
        setNumCorrect(0);
        setNumWrong(0);
        setCurrentHadMistake(false);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [route, stepIndex]);

  const current = tasks[currentIdx];

  const onPickTranslation = (opt: string) => {
    if (current?.kind !== 'chooseTranslation') return;
    if (selectedKey) return;
    if (opt === current.correctTranslation) {
      // If there was any mistake on this item before getting it right, requeue it to the end
      setTasks((prev) => (currentHadMistake ? [...prev, prev[currentIdx]] : prev));
      setCurrentHadMistake(false);
      setSelectedKey(opt);
      setNumCorrect((c) => c + 1);
      setTimeout(() => setCurrentIdx((i) => i + 1), 800);
      return;
    }
    setWrongKey(opt);
    setNumWrong((c) => c + 1);
    setCurrentHadMistake(true);
    setTimeout(() => setWrongKey(null), 1200);
  };

  const fillNextBlank = (chosen: string) => {
    if (current?.kind !== 'missingWords') return;
    const nextBlank = current.missingIndices.find((i) => (inputs[i] ?? '').trim() === '');
    if (typeof nextBlank !== 'number') return;
    setInputs((prev) => ({ ...prev, [nextBlank]: chosen }));
  };

  React.useEffect(() => {
    if (!current || current.kind !== 'missingWords') return;
    // when all filled, check
    const allFilled = current.missingIndices.every((i) => (inputs[i] ?? '').trim() !== '');
    if (!allFilled) return;
    const ok = current.missingIndices.every((i) => (inputs[i] ?? '') === current.tokens[i]);
    if (ok) {
      setNumCorrect((c) => c + 1);
    } else {
      // Requeue failed item to the end of the queue
      setNumWrong((c) => c + 1);
      setTasks((prev) => [...prev, prev[currentIdx]]);
    }
    const t = setTimeout(() => {
      setInputs({});
      setCurrentIdx((i) => i + 1);
    }, ok ? 600 : 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, current]);

  const onSkip = () => {
    setInputs({});
    setWrongKey(null);
    setSelectedKey(null);
    setNumWrong((c) => c + 1);
    // Requeue skipped item to the end and advance
    setTasks((prev) => [...prev, prev[currentIdx]]);
    setCurrentIdx((i) => i + 1);
  };

  // When moving to a new item, clear transient UI state
  React.useEffect(() => {
    setSelectedKey(null);
    setWrongKey(null);
    setInputs({});
    setCurrentHadMistake(false);
  }, [currentIdx]);

  const onFinish = async () => {
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName) || 'en';
      const stored = await AsyncStorage.getItem(`babySteps.maxCompletedIndex.${currentCode}`);
      const prev = Number.parseInt(stored ?? '0', 10);
      // We store the highest finished node number (1-based). 0 means none.
      const finishedNodeNumber = stepIndex + 1;
      const next = Number.isNaN(prev) ? finishedNodeNumber : Math.max(prev, finishedNodeNumber);
      await AsyncStorage.setItem(`babySteps.maxCompletedIndex.${currentCode}`, String(next));
    } catch {}
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading…</Text>
      </View>
    );
  }

  // When we've advanced past the end, the user has completed all queued tasks correctly
  if (currentIdx >= tasks.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Step {stepIndex + 1} complete!</Text>
        <TouchableOpacity style={[styles.finishButton, { marginTop: 16 }]} onPress={onFinish} accessibilityRole="button" accessibilityLabel="Finish step">
          <Text style={styles.finishText}>Finish step</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Step {stepIndex + 1} • {currentIdx + 1}/{tasks.length} • {numCorrect} correct • {numWrong} wrong</Text>
        {currentIdx + 1 < tasks.length ? (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip">
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {current.kind === 'chooseTranslation' ? (
        <View>
          <View style={styles.wordCard}>
            <Text style={styles.wordText}>{current.sourceWord}</Text>
          </View>
          <View style={styles.optionsWrap}>
            {current.options.map((opt) => {
              const isCorrect = opt === current.correctTranslation;
              const isSelected = selectedKey === opt;
              const isWrong = wrongKey === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionButton, isSelected && isCorrect && styles.optionCorrect, isWrong && styles.optionWrong]}
                  onPress={() => onPickTranslation(opt)}
                  accessibilityRole="button"
                  accessibilityLabel={opt}
                >
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.wordCard}>
            <Text style={styles.translationText}>{current.translatedSentence}</Text>
          </View>
          <View style={styles.sentenceWrap}>
            {current.tokens.map((tok, i) => {
              const isMissing = current.missingIndices.includes(i);
              const value = inputs[i] ?? '';
              if (!isMissing) {
                return (
                  <View key={`f-${i}`} style={styles.tokenFixed}><Text style={styles.tokenText}>{tok}</Text></View>
                );
              }
              const approx = Math.max(40, Math.min(200, Math.floor((tok.length || 1) * 10)));
              return (
                <View key={`m-${i}`} style={styles.tokenBlank}>
                  <Text style={[styles.blankText, { width: approx, color: value ? '#000' : '#bbb' }]}>{value || '____'}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.choicesWrap}>
            {current.wordBank.map((w, i) => (
              <TouchableOpacity key={`${w}-${i}`} style={styles.choiceButton} onPress={() => fillNextBlank(w)}>
                <Text style={styles.choiceText}>{w}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {currentIdx + 1 >= tasks.length && !currentHadMistake ? (
        <TouchableOpacity style={styles.finishButton} onPress={onFinish} accessibilityRole="button" accessibilityLabel="Finish step">
          <Text style={styles.finishText}>Finish step</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, gap: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700' },
  skipButton: { borderWidth: 1, borderColor: '#ddd', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fff' },
  skipText: { color: '#007AFF', fontWeight: '700' },
  wordCard: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center' },
  wordText: { fontSize: 24, fontWeight: '800' },
  translationText: { fontSize: 18, fontWeight: '700' },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  optionButton: { width: '48%', borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10 },
  optionText: { fontSize: 16, fontWeight: '600' },
  optionCorrect: { backgroundColor: '#e6f7e9', borderColor: '#2e7d32' },
  optionWrong: { backgroundColor: '#ffebee', borderColor: '#e53935' },
  sentenceWrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  tokenFixed: { paddingHorizontal: 6, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f8f8f8' },
  tokenText: { fontSize: 16 },
  tokenBlank: { paddingHorizontal: 4, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  blankText: { fontSize: 16, paddingHorizontal: 6, paddingVertical: 4 },
  choicesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8 },
  choiceButton: { borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8 },
  choiceText: { fontSize: 14, fontWeight: '600' },
  finishButton: { marginTop: 8, backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  finishText: { color: '#fff', fontWeight: '800' },
});

export default BabyStepRunnerScreen;


