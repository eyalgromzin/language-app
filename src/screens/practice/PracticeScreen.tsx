import * as React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, Animated, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../../hooks/useTranslation';
import { initializeShuffledOrder, navigateToNextInShuffledOrder } from './common/surprisePracticeOrder';

type PracticeOption = {
  key: string;
  label: string;
  emoji?: string;
};

const PRACTICE_OPTIONS: PracticeOption[] = [
  { key: 'missingLetters', label: 'missingLetters', emoji: '🔤' },
  { key: 'missingWords', label: 'missingWords', emoji: '🔡' },
  { key: 'matchGame', label: 'matchGame', emoji: '🧩' },
  { key: 'chooseWord', label: 'chooseWord', emoji: '📝' },
  { key: 'chooseTranslation', label: 'chooseTranslation', emoji: '🔎' },
  { key: 'translate', label: 'translate', emoji: 'ðŸŒ' },
  { key: 'memoryGame', label: 'memoryGame', emoji: '🧠' },
  { key: 'hearing', label: 'hearingPractice', emoji: '🔊' },
  { key: 'flipCards', label: 'flipCards', emoji: '🃏' },
];

// Custom Match Game Button Component
const MatchGameButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.matchGameButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('screens.practice.matchGame')}
    >
      <View style={styles.matchGameContent}>
        <Text style={styles.matchGameTitle}>{t('screens.practice.matchGame').toUpperCase()}</Text>
        
        <View style={styles.cardsContainer}>
          <View style={[styles.card, styles.cardLeft]}>
            <Text style={styles.cardSuit}>♥</Text>
            <Text style={styles.cardRank}>A</Text>
            <Text style={styles.cardSuit}>♥</Text>
          </View>
          
          <View style={styles.sparkleContainer}>
            <Text style={styles.sparkle}>✨</Text>
          </View>
          
          <View style={[styles.card, styles.cardRight]}>
            <Text style={styles.cardSuit}>♥</Text>
            <Text style={styles.cardRank}>A</Text>
            <Text style={styles.cardSuit}>♥</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Custom Missing Letters Button Component
const MissingLettersButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.missingLettersButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('screens.practice.missingLetters')}
    >
      <View style={styles.missingLettersContent}>
        <Text style={styles.missingLettersTitle}>{t('screens.practice.missingLetters').toUpperCase()}</Text>
        
        <View style={styles.wordContainer}>
          <Text style={styles.wordLetter}>H</Text>
          <Text style={styles.wordLetter}>E</Text>
          <View style={styles.missingLetterBox}>
            <Text style={styles.missingLetter}>?</Text>
          </View>
          <Text style={styles.wordLetter}>L</Text>
          <Text style={styles.wordLetter}>O</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Custom Missing Words Button Component
const MissingWordsButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.missingWordsButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('screens.practice.missingWords')}
    >
      <View style={styles.missingWordsContent}>
        <Text style={styles.missingWordsTitle}>{t('screens.practice.missingWords').toUpperCase()}</Text>
        
        <View style={styles.sentenceContainer}>
          <Text style={styles.sentenceWord}>The</Text>
          <View style={styles.missingWordBox}>
            <Text style={styles.missingWord}>___</Text>
          </View>
          <Text style={styles.sentenceWord}>is</Text>
          <Text style={styles.sentenceWord}>blue</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Custom Choose Word Button Component
const ChooseWordButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.chooseWordButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('screens.practice.chooseWord')}
    >
      <View style={styles.chooseWordContent}>
        <Text style={styles.chooseWordTitle}>{t('screens.practice.chooseWord').toUpperCase()}</Text>
        
        <View style={styles.optionsContainer}>
          <View style={styles.optionBox}>
            <Text style={styles.optionText}>A</Text>
          </View>
          <View style={[styles.optionBox, styles.optionBoxSelected]}>
            <Text style={styles.optionText}>B</Text>
          </View>
          <View style={styles.optionBox}>
            <Text style={styles.optionText}>C</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Custom Choose Translation Button Component
const ChooseTranslationButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.chooseTranslationButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('screens.practice.chooseTranslation')}
    >
      <View style={styles.chooseTranslationContent}>
        <Text style={styles.chooseTranslationTitle}>{t('screens.practice.chooseTranslation').toUpperCase()}</Text>
        
        <View style={styles.translationContainer}>
          <Text style={styles.translationWord}>Hello</Text>
          <Text style={styles.translationArrow}>→</Text>
          <View style={styles.translationOptions}>
            <Text style={styles.translationOption}>Hola</Text>
            <Text style={styles.translationOption}>Bonjour</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Custom Translation Missing Letters Button Component
const TranslationMissingLettersButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.translationMissingLettersButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('screens.practice.translate')}
    >
      <View style={styles.translationMissingLettersContent}>
        <Text style={styles.translationMissingLettersTitle}>{t('screens.practice.translate').toUpperCase()}</Text>
        
        <View style={styles.translationWordContainer}>
          <Text style={styles.translationWord}>H</Text>
          <Text style={styles.translationWord}>O</Text>
          <View style={styles.missingLetterBox}>
            <Text style={styles.missingLetter}>?</Text>
          </View>
          <Text style={styles.translationWord}>A</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Custom Memory Game Button Component
const MemoryGameButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.memoryGameButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('screens.practice.memoryGame')}
    >
      <View style={styles.memoryGameContent}>
        <Text style={styles.memoryGameTitle}>{t('screens.practice.memoryGame').toUpperCase()}</Text>
        
        <View style={styles.memoryGrid}>
          <View style={[styles.memoryCard, styles.memoryCardFlipped]}>
            <Text style={styles.memoryCardText}>A</Text>
          </View>
          <View style={styles.memoryCard}>
            <Text style={styles.memoryCardText}>?</Text>
          </View>
          <View style={styles.memoryCard}>
            <Text style={styles.memoryCardText}>?</Text>
          </View>
          <View style={[styles.memoryCard, styles.memoryCardFlipped]}>
            <Text style={styles.memoryCardText}>A</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Custom Hearing Practice Button Component
const HearingPracticeButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={styles.hearingPracticeButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('screens.practice.hearingPractice')}
    >
      <View style={styles.hearingPracticeContent}>
        <Text style={styles.hearingPracticeTitle}>{t('screens.practice.hearingPractice').toUpperCase()}</Text>
        
        <View style={styles.soundContainer}>
          <Text style={styles.soundWave}>🔊</Text>
          <View style={styles.waveContainer}>
            <View style={[styles.wave, styles.wave1]} />
            <View style={[styles.wave, styles.wave2]} />
            <View style={[styles.wave, styles.wave3]} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Custom Surprise Me Button Component
const SurpriseMeButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const { t } = useTranslation();
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };
    
    startAnimation();
  }, [animatedValue]);

  const borderColor = animatedValue.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [
      '#8B5CF6', // Purple
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F97316', // Orange
      '#EF4444', // Red
      '#EC4899', // Pink
    ],
  });

  return (
    <Animated.View style={[styles.surpriseMeButton, { borderColor }]}>
      <TouchableOpacity
        style={styles.surpriseMeButtonInner}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('screens.practice.surpriseMe')}
      >
        <View style={styles.surpriseMeContent}>
          <View style={styles.surpriseMeHeader}>
            <Text style={styles.surpriseMeTitle}>🎲</Text>
            <Text style={styles.surpriseMeTitle}>{t('screens.practice.surpriseMe').toUpperCase()}</Text>
            <Text style={styles.surpriseMeTitle}>🎲</Text>
          </View>
          
          <View style={styles.confettiContainer}>
            <Text style={[styles.confetti, styles.confetti1]}>🎉</Text>
            <Text style={[styles.confetti, styles.confetti2]}>✨</Text>
            <Text style={[styles.confetti, styles.confetti3]}>⭐</Text>
            <Text style={[styles.confetti, styles.confetti4]}>🎊</Text>
            <Text style={[styles.confetti, styles.confetti5]}>💫</Text>
          </View>
          
          <View style={styles.magicContainer}>
            <Text style={styles.magicText}>✨ {t('screens.practice.magic').toUpperCase()} ✨</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

function PracticeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const onOptionPress = (opt: PracticeOption) => {
    if (opt.key === 'missingLetters') {
      navigation.navigate('MissingLetters', { mode: 'word' });
      return;
    }
    if (opt.key === 'missingWords') {
      navigation.navigate('MissingWords');
      return;
    }
    if (opt.key === 'matchGame') {
      navigation.navigate('WordsMatch');
      return;
    }
    if (opt.key === 'memoryGame') {
      navigation.navigate('MemoryGame');
      return;
    }
    if (opt.key === 'hearing') {
      navigation.navigate('HearingPractice');
      return;
    }
    if (opt.key === 'flipCards') {
      navigation.navigate('FlipCards');
      return;
    }
  if (opt.key === 'translate') {
      navigation.navigate('Translate', { mode: 'translation' });
      return;
    }
    if (opt.key === 'chooseWord') {
      navigation.navigate('ChooseWord');
      return;
    }
    if (opt.key === 'chooseTranslation') {
      navigation.navigate('ChooseTranslation');
      return;
    }
    Alert.alert(t('common.comingSoon'), `${opt.label} ${t('common.notImplementedYet')}`);
  };

  const onSurprise = () => {
    // Initialize or reshuffle the practice order
    initializeShuffledOrder();
    // Navigate to the next practice in the shuffled order (use navigate for first time, not replace)
    navigateToNextInShuffledOrder(navigation, false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>{t('screens.practice.choosePreference')}</Text>
        </View>

        {/* Surprise Me Button */}
        <View style={styles.surpriseSection}>
          <SurpriseMeButton onPress={onSurprise} />
        </View>

        {/* Practice Options Grid */}
        <View style={styles.grid}>
        {PRACTICE_OPTIONS.map((opt) => {
          if (opt.key === 'matchGame') {
            return (
              <MatchGameButton
                key={opt.key}
                onPress={() => onOptionPress(opt)}
              />
            );
          }
          if (opt.key === 'missingLetters') {
            return (
              <MissingLettersButton
                key={opt.key}
                onPress={() => onOptionPress(opt)}
              />
            );
          }
          if (opt.key === 'missingWords') {
            return (
              <MissingWordsButton
                key={opt.key}
                onPress={() => onOptionPress(opt)}
              />
            );
          }
          if (opt.key === 'chooseWord') {
            return (
              <ChooseWordButton
                key={opt.key}
                onPress={() => onOptionPress(opt)}
              />
            );
          }
          if (opt.key === 'chooseTranslation') {
            return (
              <ChooseTranslationButton
                key={opt.key}
                onPress={() => onOptionPress(opt)}
              />
            );
          }
          if (opt.key === 'translate') {
            return (
              <TranslationMissingLettersButton
                key={opt.key}
                onPress={() => onOptionPress(opt)}
              />
            );
          }
          if (opt.key === 'memoryGame') {
            return (
              <MemoryGameButton
                key={opt.key}
                onPress={() => onOptionPress(opt)}
              />
            );
          }
          if (opt.key === 'hearing') {
            return (
              <HearingPracticeButton
                key={opt.key}
                onPress={() => onOptionPress(opt)}
              />
            );
          }
          
          return (
            <TouchableOpacity
              key={opt.key}
              style={styles.gridItem}
              onPress={() => onOptionPress(opt)}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <Text style={styles.gridItemEmoji}>{opt.emoji || '•'}</Text>
              <Text numberOfLines={2} style={styles.gridItemLabel}>{t(`screens.practice.${opt.label}`)}</Text>
            </TouchableOpacity>
          );
        })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  surpriseSection: {
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    rowGap: 16,
    paddingBottom: 40,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridItemEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  gridItemLabel: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  // Match Game Button Styles
  matchGameButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  matchGameContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  matchGameTitle: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  cardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    position: 'relative',
  },
  card: {
    width: 24,
    height: 32,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardLeft: {
    transform: [{ rotate: '-8deg' }],
    marginRight: 4,
  },
  cardRight: {
    transform: [{ rotate: '8deg' }],
    marginLeft: 4,
  },
  cardSuit: {
    color: '#FFFFFF', // White hearts
    fontSize: 8,
    fontWeight: 'bold',
  },
  cardRank: {
    color: '#FFFFFF', // White A
    fontSize: 10,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  sparkleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sparkle: {
    fontSize: 12,
    color: '#3B82F6',
  },
  // Missing Letters Button Styles
  missingLettersButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  missingLettersContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  missingLettersTitle: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  wordLetter: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  missingLetterBox: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  missingLetter: {
    color: '#92400E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Missing Words Button Styles
  missingWordsButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  missingWordsContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  missingWordsTitle: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sentenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
    flexWrap: 'wrap',
  },
  sentenceWord: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  missingWordBox: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  missingWord: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Choose Word Button Styles
  chooseWordButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  chooseWordContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  chooseWordTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  optionBox: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  optionBoxSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  optionText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Choose Translation Button Styles
  chooseTranslationButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#06B6D4',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  chooseTranslationContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  chooseTranslationTitle: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  translationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  translationWord: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  translationArrow: {
    color: '#06B6D4',
    fontSize: 16,
    marginVertical: 4,
  },
  translationOptions: {
    flexDirection: 'row',
    gap: 4,
  },
  translationOption: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  // Translation Missing Letters Button Styles
  translationMissingLettersButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F97316',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  translationMissingLettersContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  translationMissingLettersTitle: {
    color: '#F97316',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  translationWordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  // Memory Game Button Styles
  memoryGameButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EC4899',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  memoryGameContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  memoryGameTitle: {
    color: '#EC4899',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
    width: 60,
  },
  memoryCard: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  memoryCardFlipped: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  memoryCardText: {
    color: '#EC4899',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Hearing Practice Button Styles
  hearingPracticeButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  hearingPracticeContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  hearingPracticeTitle: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  soundContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  soundWave: {
    fontSize: 20,
    marginBottom: 4,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  wave: {
    backgroundColor: '#6366F1',
    borderRadius: 2,
  },
  wave1: {
    width: 3,
    height: 8,
  },
  wave2: {
    width: 3,
    height: 12,
  },
  wave3: {
    width: 3,
    height: 6,
  },
  // Surprise Me Button Styles
  surpriseMeButton: {
    borderRadius: 20,
    borderWidth: 3,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  surpriseMeButtonInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    overflow: 'hidden',
  },
  surpriseMeContent: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    position: 'relative',
  },
  surpriseMeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 8,
  },
  surpriseMeTitle: {
    color: '#8B5CF6',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    fontSize: 16,
  },
  confetti1: {
    top: '20%',
    left: '15%',
    transform: [{ rotate: '-15deg' }],
  },
  confetti2: {
    top: '25%',
    right: '20%',
    transform: [{ rotate: '25deg' }],
  },
  confetti3: {
    bottom: '30%',
    left: '25%',
    transform: [{ rotate: '45deg' }],
  },
  confetti4: {
    bottom: '25%',
    right: '15%',
    transform: [{ rotate: '-30deg' }],
  },
  confetti5: {
    top: '50%',
    left: '50%',
    transform: [{ translateX: -8 }, { rotate: '60deg' }],
  },
  magicContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  magicText: {
    color: '#8B5CF6',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default PracticeScreen;


