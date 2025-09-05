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
      <TouchableOpacity
        style={styles.surpriseButton}
        onPress={onSurprise}
        accessibilityRole="button"
        accessibilityLabel="Surprise me"
      >
        <Text style={styles.surpriseText}>🎲 Surprise me</Text>
      </TouchableOpacity>

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
  surpriseButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 26,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  surpriseText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
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
    backgroundColor: '#1E3A8A', // Deep blue background
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#3B82F6', // Medium blue border
    shadowColor: '#000',
    shadowOpacity: 0.3,
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#DC2626', // Red hearts
    fontSize: 8,
    fontWeight: 'bold',
  },
  cardRank: {
    color: '#DC2626', // Red A
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
    color: '#FFFFFF',
    textShadowColor: '#FCD34D',
    textShadowRadius: 4,
  },
});

export default PracticeScreen;


