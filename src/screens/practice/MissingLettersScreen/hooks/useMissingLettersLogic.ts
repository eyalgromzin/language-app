import React from 'react';
import * as RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WordEntry } from '../../../types/words';
import { ensureCounters, pickMissingIndices, splitLetters, pickRandomIndex, normalizeForCompare } from '../utils/missingLettersUtils';

type Mode = 'word' | 'translation';

export type PreparedItem = {
  entry: WordEntry;
  letters: string[];
  missingIndices: number[];
};

type UseMissingLettersLogicProps = {
  embedded?: boolean;
  mode?: Mode;
  word?: string;
  translation?: string;
  missingIndices?: number[];
  filePath: string;
  removeAfterTotalCorrect: number;
};

type UseMissingLettersLogicReturn = {
  loading: boolean;
  items: PreparedItem[];
  currentIndex: number;
  inputs: Record<number, string>;
  wrongHighlightIndex: number | null;
  storedMismatchIndex: number | null;
  removeAfterCorrect: number;
  removeAfterTotalCorrect: number;
  setInputs: (value: Record<number, string> | ((prev: Record<number, string>) => Record<number, string>)) => void;
  setWrongHighlightIndex: (value: number | null) => void;
  setStoredMismatchIndex: (value: number | null) => void;
  setRemoveAfterCorrect: (value: number) => void;
  setRemoveAfterTotalCorrect: (value: number) => void;
  loadData: () => Promise<void>;
  resetForNext: () => void;
  attemptWord: () => string;
  writeBackIncrement: (word: string) => Promise<void>;
  onChangeInput: (index: number, value: string) => void;
  onKeyPressLetter: (index: number, e: any) => void;
  current: PreparedItem | undefined;
};

export function useMissingLettersLogic(props: UseMissingLettersLogicProps): UseMissingLettersLogicReturn {
  const mode: Mode = props.mode || 'word';
  const filePath = props.filePath;

  const [loading, setLoading] = React.useState<boolean>(props.embedded ? false : true);
  const [items, setItems] = React.useState<PreparedItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [inputs, setInputs] = React.useState<Record<number, string>>({});
  const [wrongHighlightIndex, setWrongHighlightIndex] = React.useState<number | null>(null);
  const [storedMismatchIndex, setStoredMismatchIndex] = React.useState<number | null>(null);
  const [removeAfterCorrect, setRemoveAfterCorrect] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);

  const inputRefs = React.useRef<Record<number, any>>({});

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
      setStoredMismatchIndex(null);
      return;
    }
    setLoading(true);
    try {
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
      const validWords = arr.filter((w) => w.word && w.translation);
      
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
      
      let filtered = strictlyFiltered;
      if (strictlyFiltered.length < 1) {
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
          filtered = validWords;
        }
      }
      const prepared = prepare(filtered, threshold);
      setItems(prepared);
      setCurrentIndex(pickRandomIndex(prepared.length));
      setInputs({});
      setWrongHighlightIndex(null);
      setStoredMismatchIndex(null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filePath, prepare, props.embedded, mode]);

  const current = props.embedded
    ? ({
        entry: { word: props.word || '', translation: props.translation || '' },
        letters: splitLetters((props.mode === 'translation' ? props.translation : props.word) || ''),
        missingIndices: props.missingIndices && props.missingIndices.length > 0
          ? props.missingIndices
          : pickMissingIndices(splitLetters((props.mode === 'translation' ? props.translation : props.word) || ''), 2),
      } as PreparedItem)
    : items[currentIndex];

  const resetForNext = React.useCallback(() => {
    setInputs({});
    setWrongHighlightIndex(null);
    setStoredMismatchIndex(null);
  }, []);

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

  const onKeyPressLetter = (index: number, e: any) => {
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

  return {
    loading,
    items,
    currentIndex,
    inputs,
    wrongHighlightIndex,
    storedMismatchIndex,
    removeAfterCorrect,
    removeAfterTotalCorrect,
    setInputs,
    setWrongHighlightIndex,
    setStoredMismatchIndex,
    setRemoveAfterCorrect,
    setRemoveAfterTotalCorrect,
    loadData,
    resetForNext,
    attemptWord,
    writeBackIncrement,
    onChangeInput,
    onKeyPressLetter,
    current,
  };
}
