import React from 'react';
import { Alert, Button, StyleSheet, Text, View, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import Ionicons from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  Startup: undefined;
  Login: undefined;
  Main: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Startup'>;

function StartupScreen({ navigation }: Props): React.JSX.Element {
  const { completeSetup } = useAuth();
  const { languageMappings, isLoading: languagesLoading } = useLanguageMappings();
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language === 'he' || i18n.language === 'iw';
  const [learningLanguage, setLearningLanguage] = React.useState<string>('');
  const [nativeLanguage, setNativeLanguage] = React.useState<string>('');
  const [saving, setSaving] = React.useState<boolean>(false);
  const [removeAfterCorrect, setRemoveAfterCorrect] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);

  const onContinue = async () => {
    if (!learningLanguage || !nativeLanguage) {
      Alert.alert(t('screens.startup.selectLanguages'), t('screens.startup.chooseBothLanguages'));
      return;
    }
    try {
      setSaving(true);
      console.log('[StartupScreen] Starting setup completion...');
      
      await AsyncStorage.multiSet([
        ['language.learning', learningLanguage],
        ['language.native', nativeLanguage],
        ['words.removeAfterNCorrect', String(removeAfterCorrect)],
        ['words.removeAfterTotalCorrect', String(removeAfterTotalCorrect)],
      ]);
      
      // Ensure user is authenticated (auto-authenticate if not already)
      await AsyncStorage.multiSet([
        ['user_logged_in', 'true'],
        ['user_email', 'auto@user.com'],
        ['user_name', 'Auto User'],
        ['user_id', 'auto-user-id'],
      ]);
      
      console.log('[StartupScreen] Languages and settings saved, calling completeSetup...');
      
      // Use AuthContext to complete setup - this will trigger navigation automatically
      await completeSetup();
      console.log('[StartupScreen] Setup completed successfully');
      
      // Reset saving state after successful completion
      setSaving(false);
    } catch (e) {
      console.error('[StartupScreen] Error during setup completion:', e);
      setSaving(false);
      Alert.alert(t('screens.startup.error'), t('screens.startup.failedToSavePreferences'));
    }
  };

  if (languagesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="language" size={48} color="#007AFF" />
          </View>
          <Text style={styles.loadingTitle}>HelloLingo</Text>
          <ActivityIndicator size="large" color="#007AFF" style={styles.loadingSpinner} />
          <Text style={styles.loadingSubtitle}>{t('screens.startup.loadingLanguages')}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="language" size={40} color="#007AFF" />
        </View>
        <Text style={styles.title}>{t('screens.startup.welcome')}</Text>
        <Text style={styles.subtitle}>{t('screens.startup.personalize')}</Text>
      </View>

      {/* Language Selection Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="globe-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>{t('screens.startup.languageSetup')}</Text>
        </View>
        
        <View style={styles.pickerBlock}>
          <Text style={styles.label}>{t('screens.startup.whichLanguageToLearn')}</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={learningLanguage}
              onValueChange={(value) => setLearningLanguage(value)}
            >
              <Picker.Item label={t('screens.startup.selectLanguage')} value="" />
              {Object.keys(languageMappings).sort().map((lang) => (
                <Picker.Item key={lang} label={lang} value={lang} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.pickerBlock}>
          <Text style={styles.label}>{t('screens.startup.yourNativeLanguage')}</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={nativeLanguage}
              onValueChange={(value) => setNativeLanguage(value)}
            >
              <Picker.Item label={t('screens.startup.selectNativeLanguage')} value="" />
              {Object.keys(languageMappings).sort().map((lang) => (
                <Picker.Item key={lang} label={lang} value={lang} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Practice Settings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>{t('screens.settings.practiceSettings')}</Text>
        </View>
        
        <View style={styles.pickerBlock}>
          <Text style={styles.infoLabel}>{t('screens.settings.practiceCompletionDescription')}</Text>
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
          <Text style={styles.infoLabel}>{t('screens.settings.wordMasteryDescription')}</Text>
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
      </View>

      {/* Continue Button */}
      <View style={styles.buttonSection}>
        <Pressable
          style={[styles.continueButton, saving && styles.continueButtonDisabled]}
          onPress={onContinue}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={saving ? 'Saving your preferences' : 'Continue to app'}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" style={styles.buttonSpinner} />
          ) : (
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color="white" 
              style={[styles.buttonIcon, isHebrew && { transform: [{ rotate: '180deg' }] }]} 
            />
          )}
          <Text style={styles.continueButtonText}>
            {saving ? t('screens.startup.settingUpAccount') : t('screens.startup.startLearning')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 16,
    marginBottom: 24,
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  // Main container styles
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 100, // Increased padding to avoid overlap with bottom navigation
  },

  // Header section
  headerSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Section styles
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },

  // Picker styles
  pickerBlock: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },

  // Option circles
  optionCirclesContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  optionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCircleSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E6F0FF',
  },
  optionCircleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  optionCircleTextSelected: {
    color: '#007AFF',
    fontWeight: '700',
  },

  // Button section
  buttonSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20, // Added bottom padding for extra spacing
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#a0a0a0',
    shadowOpacity: 0.1,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonSpinner: {
    marginRight: 8,
  },
});

export default StartupScreen;


