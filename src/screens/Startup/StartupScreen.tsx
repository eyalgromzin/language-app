import React from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Startup: undefined;
  Login: undefined;
  Main: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Startup'>;

const LANGUAGE_OPTIONS: string[] = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese (Mandarin)',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
  'Turkish',
  'Polish',
  'Dutch',
  'Greek',
  'Swedish',
  'Norwegian',
  'Finnish',
  'Czech',
  'Ukrainian',
  'Hebrew',
  'Thai',
  'Vietnamese',
];

function StartupScreen({ navigation }: Props): React.JSX.Element {
  const [learningLanguage, setLearningLanguage] = React.useState<string>('');
  const [nativeLanguage, setNativeLanguage] = React.useState<string>('');
  const [saving, setSaving] = React.useState<boolean>(false);

  const onContinue = async () => {
    if (!learningLanguage || !nativeLanguage) {
      Alert.alert('Select languages', 'Please choose both languages to continue.');
      return;
    }
    try {
      setSaving(true);
      await AsyncStorage.multiSet([
        ['setup.completed', 'true'],
        ['language.learning', learningLanguage],
        ['language.native', nativeLanguage],
      ]);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      setSaving(false);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    }
  };

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
            {LANGUAGE_OPTIONS.map((lang) => (
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
            {LANGUAGE_OPTIONS.map((lang) => (
              <Picker.Item key={lang} label={lang} value={lang} />
            ))}
          </Picker>
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
});

export default StartupScreen;


