import * as React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type PracticeOption = {
  key: string;
  label: string;
  emoji?: string;
};

const PRACTICE_OPTIONS: PracticeOption[] = [
  { key: 'missingLetters', label: 'Word Missing letters', emoji: '🔤' },
  { key: 'missingWords', label: 'Missing words', emoji: '🔡' },
  { key: 'matchGame', label: 'Match game', emoji: '🧩' },
  { key: 'chooseWord', label: 'Choose word', emoji: '📝' },
  { key: 'chooseTranslation', label: 'Choose translation', emoji: '🔎' },
  { key: 'translate', label: 'Translation Missing Letters', emoji: 'ðŸŒ' },
  { key: 'memoryGame', label: 'Memory game', emoji: '🧠' },
  { key: 'hearing', label: 'Hearing practice', emoji: '🔊' },
];

// Custom Match Game Button Component
const MatchGameButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.matchGameButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Match game"
    >
      <View style={styles.matchGameContent}>
        <Text style={styles.matchGameTitle}>MATCH</Text>
        <Text style={styles.matchGameTitle}>GAME</Text>
        
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
  return (
    <TouchableOpacity
      style={styles.missingLettersButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Missing letters"
    >
      <View style={styles.missingLettersContent}>
        <Text style={styles.missingLettersTitle}>MISSING</Text>
        <Text style={styles.missingLettersTitle}>LETTERS</Text>
        
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
  return (
    <TouchableOpacity
      style={styles.missingWordsButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Missing words"
    >
      <View style={styles.missingWordsContent}>
        <Text style={styles.missingWordsTitle}>MISSING</Text>
        <Text style={styles.missingWordsTitle}>WORDS</Text>
        
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
  return (
    <TouchableOpacity
      style={styles.chooseWordButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Choose word"
    >
      <View style={styles.chooseWordContent}>
        <Text style={styles.chooseWordTitle}>CHOOSE</Text>
        <Text style={styles.chooseWordTitle}>WORD</Text>
        
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
  return (
    <TouchableOpacity
      style={styles.chooseTranslationButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Choose translation"
    >
      <View style={styles.chooseTranslationContent}>
        <Text style={styles.chooseTranslationTitle}>CHOOSE</Text>
        <Text style={styles.chooseTranslationTitle}>TRANSLATION</Text>
        
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
  return (
    <TouchableOpacity
      style={styles.translationMissingLettersButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Translation missing letters"
    >
      <View style={styles.translationMissingLettersContent}>
        <Text style={styles.translationMissingLettersTitle}>TRANSLATION</Text>
        <Text style={styles.translationMissingLettersTitle}>MISSING</Text>
        
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
  return (
    <TouchableOpacity
      style={styles.memoryGameButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Memory game"
    >
      <View style={styles.memoryGameContent}>
        <Text style={styles.memoryGameTitle}>MEMORY</Text>
        <Text style={styles.memoryGameTitle}>GAME</Text>
        
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
  return (
    <TouchableOpacity
      style={styles.hearingPracticeButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Hearing practice"
    >
      <View style={styles.hearingPracticeContent}>
        <Text style={styles.hearingPracticeTitle}>HEARING</Text>
        <Text style={styles.hearingPracticeTitle}>PRACTICE</Text>
        
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
  return (
    <TouchableOpacity
      style={styles.surpriseMeButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Surprise me"
    >
      <View style={styles.surpriseMeContent}>
        <View style={styles.surpriseMeHeader}>
          <Text style={styles.surpriseMeTitle}>🎲</Text>
          <Text style={styles.surpriseMeTitle}>SURPRISE</Text>
          <Text style={styles.surpriseMeTitle}>ME</Text>
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
          <Text style={styles.magicText}>✨ MAGIC ✨</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

function PracticeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
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
    Alert.alert('Coming soon', `${opt.label} is not implemented yet.`);
  };

  const onSurprise = () => {
    const idx = Math.floor(Math.random() * PRACTICE_OPTIONS.length);
    const opt = PRACTICE_OPTIONS[idx];
    if (opt.key === 'missingLetters') return navigation.navigate('MissingLetters', { surprise: true, mode: 'word' });
    if (opt.key === 'missingWords') return navigation.navigate('MissingWords', { surprise: true });
    if (opt.key === 'matchGame') return navigation.navigate('WordsMatch', { surprise: true });
    if (opt.key === 'memoryGame') return navigation.navigate('MemoryGame', { surprise: true });
    if (opt.key === 'hearing') return navigation.navigate('HearingPractice', { surprise: true });
    if (opt.key === 'translate') return navigation.navigate('Translate', { surprise: true, mode: 'translation' });
    if (opt.key === 'chooseWord') return navigation.navigate('ChooseWord', { surprise: true });
    if (opt.key === 'chooseTranslation') return navigation.navigate('ChooseTranslation', { surprise: true });
    onOptionPress(opt);
  };

  return (
    <View style={styles.container}>
      <SurpriseMeButton onPress={onSurprise} />

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
              <Text numberOfLines={2} style={styles.gridItemLabel}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItemEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  gridItemLabel: {
    textAlign: 'center',
    fontWeight: '600',
  },
  // Match Game Button Styles
  matchGameButton: {
    width: '48%',
    backgroundColor: '#FFFFFF', // Bright white background
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#1E3A8A', // Deep blue border
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  matchGameContent: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  matchGameTitle: {
    color: '#1E3A8A', // Deep blue text
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(30, 58, 138, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: '#1E3A8A', // Deep blue background
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FCD34D', // Yellow glow
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
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
    color: '#1E3A8A', // Deep blue sparkle
    textShadowColor: '#FCD34D',
    textShadowRadius: 4,
  },
  // Missing Letters Button Styles
  missingLettersButton: {
    width: '48%',
    backgroundColor: '#FFFFFF', // Bright white background
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#059669', // Green border
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  missingLettersContent: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  missingLettersTitle: {
    color: '#059669', // Green text
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(5, 150, 105, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    color: '#059669', // Green text
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
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
    backgroundColor: '#FFFFFF', // Bright white background
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#7C3AED', // Purple border
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  missingWordsContent: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  missingWordsTitle: {
    color: '#7C3AED', // Purple text
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(124, 58, 237, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    color: '#7C3AED', // Purple text
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
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
    backgroundColor: '#FFFFFF', // Bright white background
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#DC2626', // Red border
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  chooseWordContent: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  chooseWordTitle: {
    color: '#DC2626', // Red text
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(220, 38, 38, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  optionBoxSelected: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  optionText: {
    color: '#DC2626', // Red text
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Choose Translation Button Styles
  chooseTranslationButton: {
    width: '48%',
    backgroundColor: '#FFFFFF', // Bright white background
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#0891B2', // Cyan border
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  chooseTranslationContent: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  chooseTranslationTitle: {
    color: '#0891B2', // Cyan text
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(8, 145, 178, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  translationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  translationWord: {
    color: '#0891B2', // Cyan text
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  translationArrow: {
    color: '#0891B2', // Cyan arrow
    fontSize: 16,
    marginVertical: 4,
  },
  translationOptions: {
    flexDirection: 'row',
    gap: 4,
  },
  translationOption: {
    color: '#0891B2', // Cyan text
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  // Translation Missing Letters Button Styles
  translationMissingLettersButton: {
    width: '48%',
    backgroundColor: '#FFFFFF', // Bright white background
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#EA580C', // Orange border
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  translationMissingLettersContent: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  translationMissingLettersTitle: {
    color: '#EA580C', // Orange text
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(234, 88, 12, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: '#FFFFFF', // Bright white background
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#BE185D', // Pink border
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  memoryGameContent: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  memoryGameTitle: {
    color: '#BE185D', // Pink text
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(190, 24, 93, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(190, 24, 93, 0.3)',
  },
  memoryCardFlipped: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  memoryCardText: {
    color: '#BE185D', // Pink text
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Hearing Practice Button Styles
  hearingPracticeButton: {
    width: '48%',
    backgroundColor: '#FFFFFF', // Bright white background
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#4338CA', // Indigo border
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    overflow: 'hidden',
  },
  hearingPracticeContent: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  hearingPracticeTitle: {
    color: '#4338CA', // Indigo text
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(67, 56, 202, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: '#4338CA', // Indigo waves
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
    backgroundColor: '#FFFFFF', // Bright white background
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#FF6B6B', // Vibrant red-pink border
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  surpriseMeContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
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
    color: '#FF6B6B', // Vibrant red-pink text
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 107, 107, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
    textShadowColor: 'rgba(255, 107, 107, 0.8)',
    textShadowRadius: 3,
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
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  magicText: {
    color: '#FF6B6B', // Vibrant red-pink text
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 107, 107, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
});

export default PracticeScreen;


