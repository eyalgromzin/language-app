import * as React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
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
];

function PracticeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const onOptionPress = (opt: PracticeOption) => {
    if (opt.key === 'missingLetters') {
      navigation.navigate('MissingLetters');
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
  if (opt.key === 'translate') {
      navigation.navigate('Translate');
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
    onOptionPress(PRACTICE_OPTIONS[idx]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.surpriseButton}
        onPress={onSurprise}
        accessibilityRole="button"
        accessibilityLabel="Surprise me"
      >
        <Text style={styles.surpriseText}>🎲 Surprise me</Text>
      </TouchableOpacity>

      <View style={styles.grid}>
        {PRACTICE_OPTIONS.map((opt) => (
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
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  surpriseButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingVertical: 18,
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
});

export default PracticeScreen;


