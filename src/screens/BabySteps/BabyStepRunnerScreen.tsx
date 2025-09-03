import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, NativeModules } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLangCode } from '../../utils/translation';
import { getBabySteps, getBabyStep } from '../../config/api';
import FormulateSentenseScreen from '../practice/formulateSentense/FormulateSentenseScreen';
import MissingWordsScreen from '../practice/missingWords/MissingWordsScreen';
import Choose1OutOfN from '../practice/choose1OutOfN/Choose1OutOfN';
import HearingPracticeScreen from '../practice/hearing/HearingPracticeScreen';
import WordMissingLettersScreen from '../practice/MissingLettersScreen/missingLettersScreen';
import WriteWordScreen from '../practice/writeWord/WriteWordScreen';

type StepItem = {
  id: string;
  title?: string;
  type?: 'word' | 'sentence';
  text: string;
  practiceType?: 'chooseTranslation' | 'missingWords' | 'formulateSentense' | 'chooseWord' | 'hearing' | 'translationMissingLetters' | 'wordMissingLetters' | 'writeWord';
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

type RunnerTask =
  | {
      kind: 'chooseTranslation';
      sourceWord: string; // in current language
      correctTranslation: string; // from other language file matched by id
      options: string[]; // includes correct + distractors
      itemId: string;
    }
  | {
      kind: 'chooseWord';
      translation: string; // translation shown
      correctWord: string; // correct word in current language
      options: string[]; // includes correct + distractors
      itemId: string;
    }
  | {
      kind: 'hearing';
      sourceWord: string;
      correctTranslation: string;
      options: string[];
      itemId: string;
    }
  | {
      kind: 'translationMissingLetters';
      word: string;
      translation: string;
      inputIndices: number[];
      itemId: string;
    }
  | {
      kind: 'wordMissingLetters';
      word: string;
      translation: string;
      missingIndices: number[];
      itemId: string;
    }
  | {
      kind: 'writeWord';
      word: string;
      translation: string;
      missingIndices: number[];
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
    }
  | {
      kind: 'formulateSentense';
      sentence: string; // in current language to assemble
      translatedSentence: string; // helper translation from other language
      tokens: string[]; // expected order
      shuffledTokens: string[]; // options presented to user
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
  const [resetSeed, setResetSeed] = React.useState<number>(0);
  const [selectedIndices, setSelectedIndices] = React.useState<number[]>([]);


  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Determine current learning and native languages
        const [learningName, nativeName] = await Promise.all([
          AsyncStorage.getItem('language.learning'),
          AsyncStorage.getItem('language.native'),
        ]);
        const currentCode = getLangCode(learningName) || 'en';
        const nativeCode = getLangCode(nativeName) || 'en';
        const otherCode = nativeCode !== currentCode ? nativeCode : (currentCode === 'en' ? 'es' : 'en');

        // First, get the steps list to find the stepId for the given stepIndex
        const stepsFile = await getBabySteps(currentCode);
        if (!mounted) return;
        
        if (!stepsFile || !Array.isArray(stepsFile.steps) || !stepsFile.steps[stepIndex]) {
          setTasks([]);
          return;
        }

        const stepMeta = stepsFile.steps[stepIndex];
        const stepId = stepMeta.id;

        // Now get the specific step data using the new API
        const [currentStep, otherFile] = await Promise.all([
          getBabyStep(currentCode, stepId),
          getBabySteps(otherCode),
        ]);

        if (!mounted) return;

        if (!currentStep || !currentStep.items) {
          setTasks([]);
          return;
        }

        // Helper to find matching item text by id in other language file
        const findOtherTextById = (itemId: string): string | null => {
          for (const s of (otherFile?.steps || [])) {
            const match = s.items.find((it: any) => it.id === itemId);
            if (match) return match.text;
          }
          return null;
        };

        // Gather extras from same step for word bank (tokens from sentences, word texts from current language)
        const extrasFromStep: string[] = [];
        currentStep.items.forEach((it: any) => {
          if (it.type === 'sentence' || it.practiceType === 'missingWords') {
            splitToTokens(it.text).forEach((t: string) => extrasFromStep.push(t));
          } else if (it.type === 'word' || it.practiceType === 'chooseTranslation') {
            if (it.text) extrasFromStep.push(it.text);
          }
        });

        const built: RunnerTask[] = currentStep.items.map((it: any) => {
          const otherText = findOtherTextById(it.id) || it.text;
          if (it.practiceType === 'chooseTranslation' || it.type === 'word') {
            // Build distractors from other word items in same step
            const distractorPool: string[] = [];
            currentStep.items.forEach((o: any) => {
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
          if (it.practiceType === 'chooseWord') {
            // Show translation and ask to pick the correct word
            const distractorPoolWords: string[] = [];
            currentStep.items.forEach((o: any) => {
              if (o.id !== it.id && (o.type === 'word' || o.practiceType === 'chooseTranslation' || o.practiceType === 'chooseWord')) {
                if (o.text && o.text !== it.text) distractorPoolWords.push(o.text);
              }
            });
            const pickedWords = sampleN(Array.from(new Set(distractorPoolWords)), Math.min(7, Math.max(0, distractorPoolWords.length)));
            const allWordOptions = shuffleArray([it.text, ...pickedWords]);
            return {
              kind: 'chooseWord',
              translation: otherText,
              correctWord: it.text,
              options: allWordOptions,
              itemId: it.id,
            } as RunnerTask;
          }
          // Build formulate sentence task (assemble full sentence in current language)
          if (it.practiceType === 'formulateSentense') {
            const tokens = splitToTokens(it.text);
            const shuffledTokens = shuffleArray(tokens);
            return {
              kind: 'formulateSentense',
              sentence: it.text,
              translatedSentence: otherText,
              tokens,
              shuffledTokens,
              itemId: it.id,
            } as RunnerTask;
          }
          if (it.practiceType === 'hearing') {
            // Hearing: pick translation options from other words' translations
            const distractorPool: string[] = [];
            currentStep.items.forEach((o: any) => {
              if (o.id !== it.id && (o.type === 'word' || o.practiceType === 'chooseTranslation' || o.practiceType === 'hearing')) {
                const t = findOtherTextById(o.id);
                if (t && t !== otherText) distractorPool.push(t);
              }
            });
            const picked = sampleN(Array.from(new Set(distractorPool)), Math.min(5, Math.max(0, distractorPool.length)));
            const options = shuffleArray([otherText, ...picked]);
            return {
              kind: 'hearing',
              sourceWord: it.text,
              correctTranslation: otherText,
              options,
              itemId: it.id,
            } as RunnerTask;
          }
          if (it.practiceType === 'translationMissingLetters') {
            // Build indices to input over translation
            const letters = (otherText || '').split('');
            const candidateIdx: number[] = [];
            letters.forEach((ch: string, i: number) => { if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) candidateIdx.push(i); });
            const desired = Math.min(3, Math.max(1, Math.floor(letters.length / 4)));
            const inputIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
            return {
              kind: 'translationMissingLetters',
              word: it.text,
              translation: otherText,
              inputIndices,
              itemId: it.id,
            } as RunnerTask;
          }
          if (it.practiceType === 'wordMissingLetters') {
            const letters = (it.text || '').split('');
            const candidateIdx: number[] = [];
            letters.forEach((ch: string, i: number) => { if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) candidateIdx.push(i); });
            const desired = Math.min(3, Math.max(1, Math.floor(letters.length / 4)));
            const missingIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
            return {
              kind: 'wordMissingLetters',
              word: it.text,
              translation: otherText,
              missingIndices,
              itemId: it.id,
            } as RunnerTask;
          }
          if (it.practiceType === 'writeWord') {
            const letters = (it.text || '').split('');
            const candidateIdx: number[] = [];
            letters.forEach((ch: string, i: number) => { if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]$/.test(ch)) candidateIdx.push(i); });
            const desired = Math.min(3, Math.max(1, Math.floor(letters.length / 4)));
            const missingIndices = sampleN(candidateIdx, desired).sort((a, b) => a - b);
            return {
              kind: 'writeWord',
              word: it.text,
              translation: otherText,
              missingIndices,
              itemId: it.id,
            } as RunnerTask;
          }
          // missingWords for sentences (only when explicitly requested)
          if (it.practiceType === 'missingWords') {
            const tokens = splitToTokens(it.text);
            // Choose 1-2 indices to blank, prefer alphabetic tokens
            const candidateIdx: number[] = [];
            tokens.forEach((t: string, i: number) => { if (/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(t)) candidateIdx.push(i); });
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
          }
          // Fallback: if still sentence type, use formulate sentence
          if (it.type === 'sentence' || it.practiceType === 'formulateSentense') {
            const tokens = splitToTokens(it.text);
            const shuffledTokens = shuffleArray(tokens);
            return {
              kind: 'formulateSentense',
              sentence: it.text,
              translatedSentence: otherText,
              tokens,
              shuffledTokens,
              itemId: it.id,
            } as RunnerTask;
          }
          // Final fallback: treat as chooseTranslation
          {
            const distractorPool: string[] = [];
            currentStep.items.forEach((o: any) => {
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
        setSelectedIndices([]);
      } catch (e) {
        if (!mounted) return;
        console.error('Failed to load step:', e);
        setTasks([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [route, stepIndex, resetSeed]);

  const current = tasks[currentIdx];

  // Reset formulate state when current changes
  React.useEffect(() => {
    setSelectedIndices([]);
  }, [currentIdx]);

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

  const onPickFormulateIndex = (idx: number) => {
    if (current?.kind !== 'formulateSentense') return;
    if (selectedIndices.includes(idx)) return;
    const next = [...selectedIndices, idx];
    setSelectedIndices(next);
  };

  React.useEffect(() => {
    if (!current || current.kind !== 'formulateSentense') return;
    const done = selectedIndices.length === current.tokens.length;
    if (!done) return;
    const isCorrect = current.tokens.every((tok, i) => tok === current.shuffledTokens[selectedIndices[i]]);
    if (isCorrect) {
      setNumCorrect((c) => c + 1);
      const t = setTimeout(() => {
        setSelectedIndices([]);
        setCurrentIdx((i) => i + 1);
      }, 600);
      return () => clearTimeout(t);
    }
    // Wrong: requeue to end and advance
    setNumWrong((c) => c + 1);
    const t = setTimeout(() => {
      setSelectedIndices([]);
      setTasks((prev) => [...prev, prev[currentIdx]]);
      setCurrentIdx((i) => i + 1);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndices, current]);

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

  const onRestart = async () => {
    // Mark as finished so the path stays completed even if restarting immediately
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName) || 'en';
      const stored = await AsyncStorage.getItem(`babySteps.maxCompletedIndex.${currentCode}`);
      const prev = Number.parseInt(stored ?? '0', 10);
      const finishedNodeNumber = stepIndex + 1;
      const next = Number.isNaN(prev) ? finishedNodeNumber : Math.max(prev, finishedNodeNumber);
      await AsyncStorage.setItem(`babySteps.maxCompletedIndex.${currentCode}`, String(next));
    } catch {}
    // Always rebuild tasks within the same screen instance
    setResetSeed((s) => s + 1);
    // Additionally try a full screen refresh; if it's a no-op, the local reset still works
    try {
      (navigation as any).replace('BabyStepRunner', { stepIndex });
    } catch {}
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
        <TouchableOpacity style={[styles.skipButton, { marginTop: 16 }]} onPress={onRestart} accessibilityRole="button" accessibilityLabel="Restart step">
          <Text style={styles.skipText}>Restart</Text>
        </TouchableOpacity>
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
        <Choose1OutOfN
          embedded
          translation={current.sourceWord}
          correctWord={current.correctTranslation}
          options={current.options}
          onFinished={(ok) => {
            if (ok) {
              setNumCorrect((c) => c + 1);
            } else {
              setNumWrong((c) => c + 1);
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'chooseWord' ? (
        <Choose1OutOfN
          embedded
          translation={current.translation}
          correctWord={current.correctWord}
          options={current.options}
          onFinished={(ok) => {
            if (ok) {
              setNumCorrect((c) => c + 1);
            } else {
              setNumWrong((c) => c + 1);
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'hearing' ? (
        <HearingPracticeScreen
          embedded
          sourceWord={current.sourceWord}
          correctTranslation={current.correctTranslation}
          options={current.options}
          onFinished={(ok) => {
            if (ok) setNumCorrect((c) => c + 1);
            else {
              setNumWrong((c) => c + 1);
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'translationMissingLetters' ? (
        <WordMissingLettersScreen
          embedded
          mode="translation"
          word={current.word}
          translation={current.translation}
          missingIndices={current.inputIndices}
          onFinished={(ok) => {
            if (ok) setNumCorrect((c) => c + 1);
            else {
              setNumWrong((c) => c + 1);
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'wordMissingLetters' ? (
        <WordMissingLettersScreen
          embedded
          word={current.word}
          translation={current.translation}
          missingIndices={current.missingIndices}
          onFinished={(ok) => {
            if (ok) setNumCorrect((c) => c + 1);
            else {
              setNumWrong((c) => c + 1);
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'writeWord' ? (
        <WriteWordScreen
          embedded
          word={current.word}
          translation={current.translation}
          missingIndices={current.missingIndices}
          onFinished={(ok) => {
            if (ok) setNumCorrect((c) => c + 1);
            else {
              setNumWrong((c) => c + 1);
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'missingWords' ? (
        <MissingWordsScreen
          embedded
          sentence={current.sentence}
          translatedSentence={current.translatedSentence}
          tokens={current.tokens}
          missingIndices={current.missingIndices}
          wordBank={current.wordBank}
          onFinished={(ok) => {
            if (ok) {
              setNumCorrect((c) => c + 1);
            } else {
              setNumWrong((c) => c + 1);
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
      ) : current.kind === 'formulateSentense' ? (
        <FormulateSentenseScreen
          embedded
          sentence={current.sentence}
          translatedSentence={current.translatedSentence}
          tokens={current.tokens}
          shuffledTokens={current.shuffledTokens}
          itemId={current.itemId}
          onFinished={(ok) => {
            if (ok) {
              setNumCorrect((c) => c + 1);
            } else {
              setNumWrong((c) => c + 1);
              setTasks((prev) => [...prev, prev[currentIdx]]);
            }
            setCurrentIdx((i) => i + 1);
          }}
        />
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
  assembledBox: { minHeight: 72, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10, justifyContent: 'center' },
  placeholder: { color: '#999', fontStyle: 'italic' },
  tokenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tokensWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tokenChip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', marginBottom: 8 },
  tokenChipUsed: { backgroundColor: '#eee', borderColor: '#ddd' },
  tokenChipSelected: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 16, backgroundColor: '#e6f7e9', borderWidth: 1, borderColor: '#2e7d32' },
  finishButton: { marginTop: 8, backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  finishText: { color: '#fff', fontWeight: '800' },
});

export default BabyStepRunnerScreen;


