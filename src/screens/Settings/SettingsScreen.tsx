import React from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { languagesService } from '../../services/languages';
import { useTranslation } from '../../hooks/useTranslation';
import { getLanguageCodeFromName, getLanguageNameFromCode } from '../../i18n';
import Ionicons from 'react-native-vector-icons/Ionicons';

function SettingsScreen(): React.JSX.Element {
  const { logout } = useAuth();
  const { t, changeLanguage, getCurrentLanguage } = useTranslation();
  const { 
    learningLanguage, 
    nativeLanguage, 
    setLearningLanguage, 
    setNativeLanguage,
    isLoading: isLoadingLanguages 
  } = useLanguage();
  const [uiLanguage, setUILanguage] = React.useState<string>('en');
  const [removeAfterCorrect, setRemoveAfterCorrect] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);
  const [languageOptions, setLanguageOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Fetch language options from server
        const languages = await languagesService.getLanguageNames();
        if (!mounted) return;
        // Sort languages alphabetically
        setLanguageOptions(languages.sort());
      } catch (error) {
        if (!mounted) return;
        console.error('Error fetching languages:', error);
        setLanguageOptions([]);
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
          'ui.language',
          'words.removeAfterNCorrect',
          'words.removeAfterTotalCorrect',
        ]);
        if (!mounted) return;
        const map = Object.fromEntries(entries);
        const uiLanguageRaw = map['ui.language'];
        
        // Set UI language
        if (typeof uiLanguageRaw === 'string' && uiLanguageRaw.trim().length > 0) {
          setUILanguage(uiLanguageRaw);
        } else {
          setUILanguage(getCurrentLanguage());
        }
        
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
        setUILanguage('en');
        setRemoveAfterCorrect(3);
        setRemoveAfterTotalCorrect(6);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getCurrentLanguage]);

  const onChangeLearning = async (value: string) => {
    const v = typeof value === 'string' && value.trim().length > 0 ? value : null;
    await setLearningLanguage(v);
  };

  const onChangeNative = async (value: string) => {
    const v = typeof value === 'string' && value.trim().length > 0 ? value : null;
    await setNativeLanguage(v);
  };

  const onChangeUILanguage = async (value: string) => {
    const v = typeof value === 'string' && value.trim().length > 0 ? value : null;
    if (v) {
      setUILanguage(v);
      await changeLanguage(v);
    }
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
      t('screens.settings.logout'),
      t('screens.settings.logoutConfirm'),
      [
        {
          text: t('screens.settings.cancel'),
          style: 'cancel',
        },
        {
          text: t('screens.settings.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              console.log('[Logout] User signed out successfully');
              // Navigation will be handled automatically by AuthContext
            } catch (error) {
              console.log('[Logout] Error during logout:', error);
              Alert.alert(t('screens.settings.logoutError'), t('screens.settings.logoutError'));
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
        <Text style={styles.screenTitle}>{t('screens.settings.title')}</Text>
        <Text style={styles.screenSubtitle}>{t('screens.settings.subtitle')}</Text>
      </View>

      {/* Language Settings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="language-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>{t('screens.settings.languageSettings')}</Text>
        </View>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('screens.settings.learningLanguage')}</Text>
            <Text style={styles.settingDescription}>{t('screens.settings.learningLanguageDescription')}</Text>
            <View style={styles.pickerWrapper}>
              {isLoadingLanguages ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>{t('screens.startup.loadingLanguageOptions')}</Text>
                </View>
              ) : (
                <Picker
                  selectedValue={learningLanguage || ''}
                  onValueChange={onChangeLearning}
                  style={styles.picker}
                >
                  <Picker.Item label={t('screens.startup.selectLanguage')} value="" />
                  {languageOptions.length > 0 ? (
                    languageOptions.map((lang: string) => (
                      <Picker.Item key={lang} label={lang} value={lang} />
                    ))
                  ) : (
                    <Picker.Item label={t('screens.startup.noLanguagesAvailable')} value="" />
                  )}
                </Picker>
              )}
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('screens.settings.nativeLanguage')}</Text>
            <Text style={styles.settingDescription}>{t('screens.settings.nativeLanguageDescription')}</Text>
            <View style={styles.pickerWrapper}>
              {isLoadingLanguages ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>{t('screens.startup.loadingLanguageOptions')}</Text>
                </View>
              ) : (
                <Picker
                  selectedValue={nativeLanguage || ''}
                  onValueChange={onChangeNative}
                  style={styles.picker}
                >
                  <Picker.Item label={t('screens.startup.selectNativeLanguage')} value="" />
                  {languageOptions.length > 0 ? (
                    languageOptions.map((lang: string) => (
                      <Picker.Item key={lang} label={lang} value={lang} />
                    ))
                  ) : (
                    <Picker.Item label={t('screens.startup.noLanguagesAvailable')} value="" />
                  )}
                </Picker>
              )}
            </View>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('common.language')}</Text>
            <Text style={styles.settingDescription}>App interface language</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={uiLanguage}
                onValueChange={onChangeUILanguage}
                style={styles.picker}
              >
                <Picker.Item label="English" value="en" />
                <Picker.Item label="Español" value="es" />
                <Picker.Item label="Français" value="fr" />
                <Picker.Item label="Deutsch" value="de" />
                <Picker.Item label="עברית" value="he" />
                <Picker.Item label="Italiano" value="it" />
                <Picker.Item label="Português" value="pt" />
                <Picker.Item label="Русский" value="ru" />
                <Picker.Item label="हिन्दी" value="hi" />
                <Picker.Item label="Polski" value="pl" />
                <Picker.Item label="Nederlands" value="nl" />
                <Picker.Item label="Ελληνικά" value="el" />
                <Picker.Item label="Svenska" value="sv" />
                <Picker.Item label="Norsk" value="no" />
                <Picker.Item label="Suomi" value="fi" />
                <Picker.Item label="Čeština" value="cs" />
                <Picker.Item label="Українська" value="uk" />
                <Picker.Item label="ไทย" value="th" />
                <Picker.Item label="Tiếng Việt" value="vi" />
              </Picker>
            </View>
          </View>
        </View>
      </View>

      {/* Practice Settings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>{t('screens.settings.practiceSettings')}</Text>
        </View>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>{t('screens.settings.practiceCompletion')}</Text>
            <Text style={styles.settingDescription}>{t('screens.settings.practiceCompletionDescription')}</Text>
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
            <Text style={styles.settingLabel}>{t('screens.settings.wordMastery')}</Text>
            <Text style={styles.settingDescription}>{t('screens.settings.wordMasteryDescription')}</Text>
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
          <Text style={styles.sectionTitle}>{t('screens.settings.account')}</Text>
        </View>
        
        <View style={styles.settingsCard}>
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('screens.settings.logout')}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>{t('screens.settings.signOut')}</Text>
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
  loadingContainer: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginLeft: 8,
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


