import React from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { LANGUAGE_OPTIONS } from '../../constants/languages';

function SettingsScreen(): React.JSX.Element {
  const { logout } = useAuth();
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
        const learningRaw = map['language.learning'];
        const nativeRaw = map['language.native'];
        const learningVal = typeof learningRaw === 'string' && learningRaw.trim().length > 0 ? learningRaw : null;
        const nativeVal = typeof nativeRaw === 'string' && nativeRaw.trim().length > 0 ? nativeRaw : null;
        setLearningLanguage(learningVal);
        setNativeLanguage(nativeVal);
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
    const v = typeof value === 'string' && value.trim().length > 0 ? value : null;
    setLearningLanguage(v);
    try {
      if (v) await AsyncStorage.setItem('language.learning', v);
      else await AsyncStorage.removeItem('language.learning');
    } catch {}
  };

  const onChangeNative = async (value: string) => {
    const v = typeof value === 'string' && value.trim().length > 0 ? value : null;
    setNativeLanguage(v);
    try {
      if (v) await AsyncStorage.setItem('language.native', v);
      else await AsyncStorage.removeItem('language.native');
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

  const onLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              console.log('[Logout] User signed out successfully');
              // Navigation will be handled automatically by AuthContext
            } catch (error) {
              console.log('[Logout] Error during logout:', error);
              Alert.alert('Logout Error', 'There was an error logging out. Please try again.');
            }
          },
        },
      ]
    );
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
        <Text style={styles.infoLabel}>Num of correct answers to finish practice type</Text>
        <View style={styles.optionCirclesContainer}>
          {[1, 2, 3].map((n) => {
            const selected = removeAfterCorrect === n;
            return (
              <Pressable
                key={`num-${n}`}
                onPress={() => onChangeRemoveAfter(n)}
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
          {[2, 6, 10, 14, 18].map((n) => {  //2 is for testing , remove it later 
            const selected = removeAfterTotalCorrect === n;
            return (
              <Pressable
                key={`tot-${n}`}
                onPress={() => onChangeRemoveAfterTotal(n)}
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

      <View style={styles.logoutSection}>
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed
          ]}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
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
  logoutSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SettingsScreen;


