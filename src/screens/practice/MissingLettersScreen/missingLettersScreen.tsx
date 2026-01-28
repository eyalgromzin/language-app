import React from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TTS from 'react-native-tts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as RNFS from 'react-native-fs';
import AnimatedToast from '../../../components/AnimatedToast';
import FinishedWordAnimation from '../../../components/FinishedWordAnimation';
import NotEnoughWordsMessage from '../../../components/NotEnoughWordsMessage';
import { useTranslation } from '../../../hooks/useTranslation';
import { getTtsLangCode, playCorrectFeedback, playWrongFeedback } from '../common';
import CorrectAnswerDialogue from '../common/correctAnswerDialogue';
import { navigateToNextInShuffledOrder } from '../common/surprisePracticeOrder';
import { groupLettersByWords, normalizeForCompare, splitLetters } from './utils/missingLettersUtils';
import { WordRow } from './components/WordRow';
import { useMissingLettersLogic } from './hooks/useMissingLettersLogic';

type Mode = 'word' | 'translation';

type EmbeddedProps = {
  embedded?: boolean;
  mode?: Mode;
  word?: string;
  translation?: string;
  missingIndices?: number[];
  onFinished?: (isCorrect: boolean) => void;
};

function MissingLettersScreen(props: EmbeddedProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode: Mode = (route?.params?.mode as Mode) || props.mode || 'word';
  
  const navigateToRandomNext = React.useCallback(() => {
    navigateToNextInShuffledOrder(navigation);
  }, [navigation]);

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  const {
    loading,
    items,
    inputs,
    wrongHighlightIndex,
    storedMismatchIndex,
    loadData,
    resetForNext,
    attemptWord,
    writeBackIncrement,
    onChangeInput,
    onKeyPressLetter,
    current,
  } = useMissingLettersLogic({
    embedded: props.embedded,
    mode,
    word: props.word,
    translation: props.translation,
    missingIndices: props.missingIndices,
    filePath,
    removeAfterTotalCorrect: 6,
  });

  const [showCorrectToast, setShowCorrectToast] = React.useState<boolean>(false);
  const [showWrongToast, setShowWrongToast] = React.useState<boolean>(false);
  const [showFinishedWordAnimation, setShowFinishedWordAnimation] = React.useState<boolean>(false);
  const [showWrongAnswerDialogue, setShowWrongAnswerDialogue] = React.useState<boolean>(false);
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);
  const animationTriggeredRef = React.useRef<Set<string>>(new Set());
  const inputRefs = React.useRef<Record<number, any>>({});

  React.useEffect(() => {
    try { TTS.setDefaultRate(0.5); } catch {}
  }, []);

  // Load and apply TTS language (use native language for reading translations)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await (await import('@react-native-async-storage/async-storage')).default.multiGet(['language.learning', 'language.native']);
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
        loadData();
      }
    }, [loadData, props.embedded])
  );

  // Focus the first blank input when a new word is shown (and not in corrected state)
  React.useEffect(() => {
    if (!current || wrongHighlightIndex !== null) return;
    const firstBlank = current.missingIndices.find((i) => (inputs[i] ?? '') === '');
    if (typeof firstBlank === 'number') {
      const t = setTimeout(() => inputRefs.current[firstBlank]?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [current, wrongHighlightIndex, inputs]);

  // Check answer when all missing indices are filled
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
      
      // Wait 2 seconds, then show correct answer dialogue
      const wrongTimer = setTimeout(() => {
        setShowWrongToast(false);
        setShowWrongAnswerDialogue(true);
      }, 2000);
      
      return () => clearTimeout(wrongTimer);
    }
  }, [attemptWord, current, inputs, moveToNext, writeBackIncrement, wrongHighlightIndex, props.embedded, props.onFinished, mode]);

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

  const wordGroups = groupLettersByWords(current.letters);

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

        <WordRow
          letters={current.letters}
          missingIndices={current.missingIndices}
          inputs={inputs}
          wrongHighlightIndex={wrongHighlightIndex}
          inputRefs={inputRefs}
          onChangeInput={onChangeInput}
          onKeyPressLetter={onKeyPressLetter}
          wordGroups={wordGroups}
        />

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
            // Use the stored mismatch index for highlighting
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


