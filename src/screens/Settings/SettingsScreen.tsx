import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { LANGUAGE_OPTIONS } from '../../constants/languages';

function SettingsScreen(): React.JSX.Element {
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);
  const [removeAfterCorrect, setRemoveAfterCorrect] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet([
          'language.learning',
          'language.native',
          'words.removeAfterNCorrect',
          'words.removeAfterTotalCorrect',
        ]);
        if (!mounted) return;
        const map = Object.fromEntries(entries);
        setLearningLanguage(map['language.learning'] ?? null);
        setNativeLanguage(map['language.native'] ?? null);
        const raw = map['words.removeAfterNCorrect'];
        const parsed = Number.parseInt(typeof raw === 'string' ? raw : '', 10);
        const valid = parsed >= 1 && parsed <= 4 ? parsed : 3;
        setRemoveAfterCorrect(valid);
        const rawTotal = map['words.removeAfterTotalCorrect'];
        const parsedTotal = Number.parseInt(typeof rawTotal === 'string' ? rawTotal : '', 10);
        const validTotal = parsedTotal >= 1 && parsedTotal <= 50 ? parsedTotal : 6;
        setRemoveAfterTotalCorrect(validTotal);
      } catch {
        if (!mounted) return;
        setLearningLanguage(null);
        setNativeLanguage(null);
        setRemoveAfterCorrect(3);
        setRemoveAfterTotalCorrect(6);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onChangeLearning = async (value: string) => {
    setLearningLanguage(value);
    try {
      await AsyncStorage.setItem('language.learning', value);
    } catch {}
  };

  const onChangeNative = async (value: string) => {
    setNativeLanguage(value);
    try {
      await AsyncStorage.setItem('language.native', value);
    } catch {}
  };

  const onChangeRemoveAfter = async (value: number) => {
    setRemoveAfterCorrect(value);
    try {
      await AsyncStorage.setItem('words.removeAfterNCorrect', String(value));
    } catch {}
  };

  const onChangeRemoveAfterTotal = async (value: number) => {
    setRemoveAfterTotalCorrect(value);
    try {
      await AsyncStorage.setItem('words.removeAfterTotalCorrect', String(value));
    } catch {}
  };

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Settings</Text>

      <View style={styles.pickerBlock}>
        <Text style={styles.infoLabel}>Learning language</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={learningLanguage || ''}
            onValueChange={onChangeLearning}
          >
            <Picker.Item label="Select a language..." value="" />
            {LANGUAGE_OPTIONS.map((lang) => (
              <Picker.Item key={lang} label={lang} value={lang} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.pickerBlock}>
        <Text style={styles.infoLabel}>Native language</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={nativeLanguage || ''}
            onValueChange={onChangeNative}
          >
            <Picker.Item label="Select your native language..." value="" />
            {LANGUAGE_OPTIONS.map((lang) => (
              <Picker.Item key={lang} label={lang} value={lang} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.pickerBlock}>
        <Text style={styles.infoLabel}>Num of correct answers to remove word</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={removeAfterCorrect}
            onValueChange={onChangeRemoveAfter}
          >
            {[1, 2, 3].map((n) => (
              <Picker.Item key={n} label={`${n}`} value={n} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.pickerBlock}>
        <Text style={styles.infoLabel}>Total correct answers till word removal</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={removeAfterTotalCorrect}
            onValueChange={onChangeRemoveAfterTotal}
          >
            {[3,4,5,6,7,8,9,10,12,15].map((n) => (
              <Picker.Item key={`tot-${n}`} label={`${n}`} value={n} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  pickerBlock: {
    marginBottom: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
});

export default SettingsScreen;


