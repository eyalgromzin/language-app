import React from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLangCode } from '../../utils/translation';
import { getBabySteps, getBabyStep } from '../../config/api';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import StreakAnimation from '../../components/StreakAnimation';
import { RunnerTask } from './types';
import { shuffleArray } from './utils';
import { buildTasks } from './taskBuilder';
import LoadingScreen from './components/LoadingScreen';
import CompletionScreen from './components/CompletionScreen';
import ProgressHeader from './components/ProgressHeader';
import TaskRenderer from './components/TaskRenderer';


function BabyStepRunnerScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const stepIndex: number = Math.max(0, Number.parseInt(String(route?.params?.stepIndex ?? '0'), 10) || 0);

  const [loading, setLoading] = React.useState<boolean>(true);
  const [tasks, setTasks] = React.useState<RunnerTask[]>([]);
  const [originalTaskCount, setOriginalTaskCount] = React.useState<number>(0);
  const [currentIdx, setCurrentIdx] = React.useState<number>(0);
  const [inputs, setInputs] = React.useState<Record<number, string>>({});
  const [wrongKey, setWrongKey] = React.useState<string | null>(null);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const [numCorrect, setNumCorrect] = React.useState<number>(0);
  const [numWrong, setNumWrong] = React.useState<number>(0);
  const [currentHadMistake, setCurrentHadMistake] = React.useState<boolean>(false);
  const [resetSeed, setResetSeed] = React.useState<number>(0);
  const [selectedIndices, setSelectedIndices] = React.useState<number[]>([]);
  const [streak, setStreak] = React.useState<number>(0);
  const [persistedStreak, setPersistedStreak] = React.useState<number>(0);
  const [showStreakAnimation, setShowStreakAnimation] = React.useState<boolean>(false);
  const { languageMappings } = useLanguageMappings();

  // Animation values for completion screen
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const confettiAnim = React.useRef(new Animated.Value(0)).current;

  // Trigger completion animations when step is completed
  React.useEffect(() => {
    if (originalTaskCount > 0 && numCorrect >= originalTaskCount) {
      // Reset animation values
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
      confettiAnim.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [originalTaskCount, numCorrect, fadeAnim, scaleAnim, slideAnim, confettiAnim]);

  // Helper function to load persisted streak
  const loadPersistedStreak = async () => {
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      const stored = await AsyncStorage.getItem(`babySteps.winningStreak.${currentCode}`);
      const streakValue = Number.parseInt(stored ?? '0', 10);
      setPersistedStreak(streakValue);
      return streakValue;
    } catch (e) {
      console.error('Failed to load persisted streak:', e);
      return 0;
    }
  };

  // Helper function to save streak to AsyncStorage
  const saveStreak = async (streakValue: number) => {
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      await AsyncStorage.setItem(`babySteps.winningStreak.${currentCode}`, String(streakValue));
      setPersistedStreak(streakValue);
    } catch (e) {
      console.error('Failed to save streak:', e);
    }
  };

  // Helper function to reset streak in AsyncStorage
  const resetStreak = async () => {
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      await AsyncStorage.setItem(`babySteps.winningStreak.${currentCode}`, '0');
      setPersistedStreak(0);
    } catch (e) {
      console.error('Failed to reset streak:', e);
    }
  };

  // Helper function to handle streak milestones
  const handleStreakMilestone = (newStreak: number) => {
    console.log('Checking streak milestone:', newStreak);
    if (newStreak % 4 == 0) {
      console.log('Triggering streak animation for streak:', newStreak);
      setShowStreakAnimation(true);
    }
  };

  // Helper function to handle correct answer
  const handleCorrectAnswer = () => {
    const newStreak = streak + 1;
    console.log('Correct answer! Current streak:', streak, 'New streak:', newStreak);
    setStreak(newStreak);
    setNumCorrect((c) => c + 1);
    handleStreakMilestone(newStreak);
  };

  // Helper function to handle wrong answer
  const handleWrongAnswer = () => {
    setStreak(0); // Reset streak on wrong answer
    setNumWrong((c) => c + 1);
  };

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
        const currentCode = getLangCode(learningName, languageMappings) || 'en';
        const nativeCode = getLangCode(nativeName, languageMappings) || 'en';

        // Load persisted streak
        const loadedStreak = await loadPersistedStreak();
        if (mounted) {
          setStreak(loadedStreak);
        }

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
        const [currentStepLearningLanguage, currentStepNativeLanguage] = await Promise.all([
          getBabyStep(currentCode, stepId),
          getBabyStep(nativeCode, stepId),
        ]);

        if (!mounted) return;

        if (!currentStepLearningLanguage || !currentStepLearningLanguage) {
          setTasks([]);
          return;
        }

        const built = buildTasks(currentStepLearningLanguage, currentStepNativeLanguage);

        if (!mounted) return;
        const shuffledTasks = shuffleArray(built);
        setTasks(shuffledTasks);
        setOriginalTaskCount(shuffledTasks.length);
        setCurrentIdx(0);
        setInputs({});
        setWrongKey(null);
        setSelectedKey(null);
        setNumCorrect(0);
        setNumWrong(0);
        setCurrentHadMistake(false);
        setSelectedIndices([]);
        setStreak(loadedStreak); // Keep persisted streak when restarting
        setShowStreakAnimation(false);
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

  // Reset streak when user quits mid-step (component unmounts without completion)
  React.useEffect(() => {
    return () => {
      // Only reset if the step wasn't completed (numCorrect < originalTaskCount)
      // and we're not in the middle of a restart
      if (originalTaskCount > 0 && numCorrect < originalTaskCount) {
        resetStreak();
      }
    };
  }, [originalTaskCount, numCorrect]);

  const current = tasks[currentIdx];

  // Reset formulate state when current changes
  React.useEffect(() => {
    setSelectedIndices([]);
  }, [currentIdx]);





  React.useEffect(() => {
    if (!current || current.kind !== 'missingWords') return;
    // when all filled, check
    const allFilled = current.missingIndices.every((i) => (inputs[i] ?? '').trim() !== '');
    if (!allFilled) return;
    const ok = current.missingIndices.every((i) => (inputs[i] ?? '') === current.tokens[i]);
    if (ok) {
      handleCorrectAnswer();
    } else {
      // Requeue failed item to the end of the queue
      handleWrongAnswer();
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



  React.useEffect(() => {
    if (!current || current.kind !== 'formulateSentense') return;
    const done = selectedIndices.length === current.tokens.length;
    if (!done) return;
    const isCorrect = current.tokens.every((tok, i) => tok === current.shuffledTokens[selectedIndices[i]]);
    if (isCorrect) {
      handleCorrectAnswer();
      const t = setTimeout(() => {
        setSelectedIndices([]);
        setCurrentIdx((i) => i + 1);
      }, 600);
      return () => clearTimeout(t);
    }
    // Wrong: requeue to end and advance
    handleWrongAnswer();
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
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      
      // Save individual step completion
      const completedStepsKey = `babySteps.completedSteps.${currentCode}`;
      const completedStepsData = await AsyncStorage.getItem(completedStepsKey);
      const completedSteps: Set<number> = completedStepsData 
        ? new Set(JSON.parse(completedStepsData))
        : new Set();
      
      // Add current step to completed steps
      completedSteps.add(stepIndex);
      
      const completedStepsArray = [...completedSteps];
      console.log(`[BabyStepRunner] Saving step ${stepIndex} as completed for language ${currentCode}`, completedStepsArray);
      
      // Save updated completed steps - ensure this completes before navigation
      await AsyncStorage.setItem(completedStepsKey, JSON.stringify(completedStepsArray));
      
      // Verify the save by reading it back
      const verifyData = await AsyncStorage.getItem(completedStepsKey);
      if (verifyData) {
        const verifySet = new Set(JSON.parse(verifyData));
        console.log(`[BabyStepRunner] Verified saved completed steps:`, [...verifySet]);
        if (!verifySet.has(stepIndex)) {
          console.warn(`[BabyStepRunner] Step ${stepIndex} not found in verified data, retrying save...`);
          verifySet.add(stepIndex);
          await AsyncStorage.setItem(completedStepsKey, JSON.stringify([...verifySet]));
        }
      }
      
      // Save the current streak only when baby step is completed successfully
      await saveStreak(streak);
      
      // Small delay to ensure AsyncStorage write is fully persisted (especially in release builds)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Only navigate after save operations complete successfully
      navigation.goBack();
    } catch (error) {
      // Log error for debugging, but still allow navigation
      console.error('[BabyStepRunner] Error saving baby step completion:', error);
      // Try to save again with a small delay
      try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const learningName = await AsyncStorage.getItem('language.learning');
        const currentCode = getLangCode(learningName, languageMappings) || 'en';
        const completedStepsKey = `babySteps.completedSteps.${currentCode}`;
        const completedStepsData = await AsyncStorage.getItem(completedStepsKey);
        const completedSteps: Set<number> = completedStepsData 
          ? new Set(JSON.parse(completedStepsData))
          : new Set();
        completedSteps.add(stepIndex);
        await AsyncStorage.setItem(completedStepsKey, JSON.stringify([...completedSteps]));
        await saveStreak(streak);
        console.log(`[BabyStepRunner] Retry save successful for step ${stepIndex}`);
      } catch (retryError) {
        console.error('[BabyStepRunner] Retry save also failed:', retryError);
      }
      // Navigate even if save failed to avoid blocking user
      navigation.goBack();
    }
  };

  const onRestart = async () => {
    // Mark as finished so the path stays completed even if restarting immediately
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const currentCode = getLangCode(learningName, languageMappings) || 'en';
      
      // Save individual step completion
      const completedStepsKey = `babySteps.completedSteps.${currentCode}`;
      const completedStepsData = await AsyncStorage.getItem(completedStepsKey);
      const completedSteps: Set<number> = completedStepsData 
        ? new Set(JSON.parse(completedStepsData))
        : new Set();
      
      // Add current step to completed steps
      completedSteps.add(stepIndex);
      
      const completedStepsArray = [...completedSteps];
      console.log(`[BabyStepRunner] Saving step ${stepIndex} as completed on restart for language ${currentCode}`, completedStepsArray);
      
      // Save updated completed steps - ensure this completes
      await AsyncStorage.setItem(completedStepsKey, JSON.stringify(completedStepsArray));
      
      // Verify the save by reading it back
      const verifyData = await AsyncStorage.getItem(completedStepsKey);
      if (verifyData) {
        const verifySet = new Set(JSON.parse(verifyData));
        if (!verifySet.has(stepIndex)) {
          console.warn(`[BabyStepRunner] Step ${stepIndex} not found in verified data on restart, retrying save...`);
          verifySet.add(stepIndex);
          await AsyncStorage.setItem(completedStepsKey, JSON.stringify([...verifySet]));
        }
      }
      
      // Save the current streak when restarting (step was completed)
      await saveStreak(streak);
      
      // Small delay to ensure AsyncStorage write is fully persisted
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Log error for debugging
      console.error('[BabyStepRunner] Error saving baby step completion on restart:', error);
      // Try to save again with a small delay
      try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const learningName = await AsyncStorage.getItem('language.learning');
        const currentCode = getLangCode(learningName, languageMappings) || 'en';
        const completedStepsKey = `babySteps.completedSteps.${currentCode}`;
        const completedStepsData = await AsyncStorage.getItem(completedStepsKey);
        const completedSteps: Set<number> = completedStepsData 
          ? new Set(JSON.parse(completedStepsData))
          : new Set();
        completedSteps.add(stepIndex);
        await AsyncStorage.setItem(completedStepsKey, JSON.stringify([...completedSteps]));
        await saveStreak(streak);
        console.log(`[BabyStepRunner] Retry save on restart successful for step ${stepIndex}`);
      } catch (retryError) {
        console.error('[BabyStepRunner] Retry save on restart also failed:', retryError);
      }
    }
    // Always rebuild tasks within the same screen instance
    setResetSeed((s) => s + 1);
    // Additionally try a full screen refresh; if it's a no-op, the local reset still works
    try {
      (navigation as any).replace('BabyStepRunner', { stepIndex });
    } catch {}
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // When we've completed all original tasks, show completion screen
  if (originalTaskCount > 0 && numCorrect >= originalTaskCount) {
    return (
      <CompletionScreen
        stepIndex={stepIndex}
        numCorrect={numCorrect}
        numWrong={numWrong}
        streak={streak}
        fadeAnim={fadeAnim}
        scaleAnim={scaleAnim}
        slideAnim={slideAnim}
        confettiAnim={confettiAnim}
        onFinish={onFinish}
        onRestart={onRestart}
      />
    );
  }

  // Safety check: if we've run out of tasks but haven't completed all original tasks, restart
  if (currentIdx >= tasks.length && originalTaskCount > 0) {
    setResetSeed((s) => s + 1);
    return (
      <View style={styles.centered}>
        <Text>Restarting step...</Text>
      </View>
    );
  }

  // Ensure we have a current task
  if (!current) {
    return (
      <View style={styles.centered}>
        <Text>Loading task...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ProgressHeader
        stepIndex={stepIndex}
        numCorrect={numCorrect}
        originalTaskCount={originalTaskCount}
        numWrong={numWrong}
        streak={streak}
        onSkip={onSkip}
      />

      <TaskRenderer
        current={current}
        currentIdx={currentIdx}
        onCorrectAnswer={handleCorrectAnswer}
        onWrongAnswer={handleWrongAnswer}
        onAdvance={() => setCurrentIdx((i) => i + 1)}
        onRequeueTask={() => setTasks((prev) => [...prev, prev[currentIdx]])}
      />

      {/* Streak Animation */}
      <StreakAnimation
        streak={streak}
        visible={showStreakAnimation}
        onAnimationComplete={() => setShowStreakAnimation(false)}
      />
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#f8fafc'
  },
  container: { 
    padding: 16, 
    gap: 16,
    backgroundColor: '#f8fafc',
    minHeight: '100%'
  },
});

export default BabyStepRunnerScreen;


