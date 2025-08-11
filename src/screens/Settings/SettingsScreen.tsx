import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { LANGUAGE_OPTIONS } from '../../constants/languages';

function SettingsScreen(): React.JSX.Element {
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);
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


