import React from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { languagesService } from '../../services/languages';
import Ionicons from 'react-native-vector-icons/Ionicons';

function SettingsScreen(): React.JSX.Element {
  const { logout } = useAuth();
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);
  const [removeAfterCorrect, setRemoveAfterCorrect] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);
  const [languageOptions, setLanguageOptions] = React.useState<string[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Fetch language options from server
        const languages = await languagesService.getLanguageNames();
        if (!mounted) return;
        setLanguageOptions(languages);
        setIsLoadingLanguages(false);
      } catch (error) {
        if (!mounted) return;
        console.error('Error fetching languages:', error);
        setLanguageOptions([]);
        setIsLoadingLanguages(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
        
        // Convert stored symbols to display names
        let learningVal = null;
        let nativeVal = null;
        
        if (typeof learningRaw === 'string' && learningRaw.trim().length > 0) {
          const language = await languagesService.getLanguageBySymbol(learningRaw);
          learningVal = language?.name ? language.name.charAt(0).toUpperCase() + language.name.slice(1) : learningRaw;
        }
        
        if (typeof nativeRaw === 'string' && nativeRaw.trim().length > 0) {
          const language = await languagesService.getLanguageBySymbol(nativeRaw);
          nativeVal = language?.name ? language.name.charAt(0).toUpperCase() + language.name.slice(1) : nativeRaw;
        }
        
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
      if (v) {
        // Find the language by display name and store the symbol
        const language = await languagesService.getLanguageByName(v);
        const symbolToStore = language?.symbol || v;
        await AsyncStorage.setItem('language.learning', symbolToStore);
      } else {
        await AsyncStorage.removeItem('language.learning');
      }
    } catch {}
  };

  const onChangeNative = async (value: string) => {
    const v = typeof value === 'string' && value.trim().length > 0 ? value : null;
    setNativeLanguage(v);
    try {
      if (v) {
        // Find the language by display name and store the symbol
        const language = await languagesService.getLanguageByName(v);
        const symbolToStore = language?.symbol || v;
        await AsyncStorage.setItem('language.native', symbolToStore);
      } else {
        await AsyncStorage.removeItem('language.native');
      }
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screenContainer} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Settings</Text>
        <Text style={styles.screenSubtitle}>Customize your learning experience</Text>
      </View>

      {/* Language Settings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="language-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Language Settings</Text>
        </View>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Learning Language</Text>
            <Text style={styles.settingDescription}>The language you want to learn</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={learningLanguage || ''}
                onValueChange={onChangeLearning}
                enabled={!isLoadingLanguages}
                style={styles.picker}
              >
                <Picker.Item label={isLoadingLanguages ? "Loading languages..." : "Select a language..."} value="" />
                {languageOptions.length > 0 ? (
                  languageOptions.map((lang: string) => (
                    <Picker.Item key={lang} label={lang} value={lang} />
                  ))
                ) : (
                  <Picker.Item label="No languages available" value="" />
                )}
              </Picker>
            </View>
            {isLoadingLanguages && (
              <Text style={styles.loadingText}>Loading language options...</Text>
            )}
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Native Language</Text>
            <Text style={styles.settingDescription}>Your primary language</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={nativeLanguage || ''}
                onValueChange={onChangeNative}
                enabled={!isLoadingLanguages}
                style={styles.picker}
              >
                <Picker.Item label={isLoadingLanguages ? "Loading languages..." : "Select your native language..."} value="" />
                {languageOptions.length > 0 ? (
                  languageOptions.map((lang: string) => (
                    <Picker.Item key={lang} label={lang} value={lang} />
                  ))
                ) : (
                  <Picker.Item label="No languages available" value="" />
                )}
              </Picker>
            </View>
            {isLoadingLanguages && (
              <Text style={styles.loadingText}>Loading language options...</Text>
            )}
          </View>
        </View>
      </View>

      {/* Practice Settings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Practice Settings</Text>
        </View>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Practice Completion</Text>
            <Text style={styles.settingDescription}>Number of correct answers needed to complete a practice type</Text>
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

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Word Mastery</Text>
            <Text style={styles.settingDescription}>Total correct answers before a word is considered mastered</Text>
            <View style={[styles.optionCirclesContainer, { flexWrap: 'wrap' }]}>
              {[6, 10, 14, 18].map((n) => {
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
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Account</Text>
        </View>
        
        <View style={styles.settingsCard}>
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed
            ]}
            accessibilityRole="button"
            accessibilityLabel="Logout"
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </Pressable>
        </View>
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
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '400',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  settingItem: {
    marginBottom: 24,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 20,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  picker: {
    height: 50,
  },
  loadingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  optionCirclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionCircleSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#EBF4FF',
    shadowColor: '#007AFF',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCircleText: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
  optionCircleTextSelected: {
    color: '#007AFF',
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SettingsScreen;


