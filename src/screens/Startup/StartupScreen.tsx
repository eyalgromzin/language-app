import React from 'react';
import { Alert, Button, StyleSheet, Text, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import { useAuth } from '../../contexts/AuthContext';

type RootStackParamList = {
  Startup: undefined;
  Login: undefined;
  Main: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Startup'>;

function StartupScreen({ navigation }: Props): React.JSX.Element {
  const { completeSetup } = useAuth();
  const { languageMappings, isLoading: languagesLoading } = useLanguageMappings();
  const [learningLanguage, setLearningLanguage] = React.useState<string>('');
  const [nativeLanguage, setNativeLanguage] = React.useState<string>('');
  const [saving, setSaving] = React.useState<boolean>(false);
  const [removeAfterCorrect, setRemoveAfterCorrect] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);

  const onContinue = async () => {
    if (!learningLanguage || !nativeLanguage) {
      Alert.alert('Select languages', 'Please choose both languages to continue.');
      return;
    }
    try {
      setSaving(true);
      await AsyncStorage.multiSet([
        ['language.learning', learningLanguage],
        ['language.native', nativeLanguage],
        ['words.removeAfterNCorrect', String(removeAfterCorrect)],
        ['words.removeAfterTotalCorrect', String(removeAfterTotalCorrect)],
      ]);
      
      // Use AuthContext to complete setup - this will trigger navigation automatically
      await completeSetup();
    } catch (e) {
      setSaving(false);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

  if (languagesLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
        <Text style={styles.subtitle}>Please wait while we load available languages.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Let’s personalize your learning.</Text>

      <View style={styles.pickerBlock}>
        <Text style={styles.label}>Which language do you want to learn?</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={learningLanguage}
            onValueChange={(value) => setLearningLanguage(value)}
          >
            <Picker.Item label="Select a language..." value="" />
            {Object.keys(languageMappings).map((lang) => (
              <Picker.Item key={lang} label={lang} value={lang} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.pickerBlock}>
        <Text style={styles.label}>Your native language</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={nativeLanguage}
            onValueChange={(value) => setNativeLanguage(value)}
          >
            <Picker.Item label="Select your native language..." value="" />
            {Object.keys(languageMappings).map((lang) => (
              <Picker.Item key={lang} value={lang} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.pickerBlock}>
        <Text style={styles.infoLabel}>Num of correct answers to finish practice type</Text>
        <View style={styles.optionCirclesContainer}>
          {[1, 2, 3].map((n) => {
            const selected = removeAfterCorrect === n;
            return (
              <Pressable
                key={`num-${n}`}
                onPress={() => setRemoveAfterCorrect(n)}
                style={[styles.optionCircle, selected && styles.optionCircleSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Set number of correct answers to ${n}`}
              >
                <Text style={[styles.optionCircleText, selected && styles.optionCircleTextSelected]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.pickerBlock}>
        <Text style={styles.infoLabel}>Total correct answers till word removal</Text>
        <View style={[styles.optionCirclesContainer, { flexWrap: 'wrap' }]}>
          {[6, 10, 14, 18].map((n) => {
            const selected = removeAfterTotalCorrect === n;
            return (
              <Pressable
                key={`tot-${n}`}
                onPress={() => setRemoveAfterTotalCorrect(n)}
                style={[styles.optionCircle, selected && styles.optionCircleSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Set total correct answers to ${n}`}
              >
                <Text style={[styles.optionCircleText, selected && styles.optionCircleTextSelected]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Button title={saving ? 'Saving...' : 'Continue'} onPress={onContinue} disabled={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  pickerBlock: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonRow: {
    marginTop: 'auto',
  },
  optionCirclesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  optionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionCircleSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F0FF',
  },
  optionCircleText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  optionCircleTextSelected: {
    color: '#007AFF',
    fontWeight: '700',
  },
});

export default StartupScreen;


