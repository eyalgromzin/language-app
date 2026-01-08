import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

type OnboardingStackParamList = {
  LearningLanguage: undefined;
  NativeLanguage: undefined;
  PracticeSettings: undefined;
  Completion: {
    removeAfterCorrect: number;
    removeAfterTotalCorrect: number;
  };
};

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Completion'>;

function OnboardingCompletionScreen({ navigation, route }: Props): React.JSX.Element {
  const { completeSetup } = useAuth();
  const { learningLanguage, nativeLanguage } = useLanguage();
  const [saving, setSaving] = React.useState<boolean>(false);
  const { t, i18n } = useTranslation();
  const isHebrew = i18n.language === 'he' || i18n.language === 'iw';

  // Get the settings from the previous screens
  const { removeAfterCorrect, removeAfterTotalCorrect } = route.params;

  const onComplete = async () => {
    if (!learningLanguage || !nativeLanguage) {
      Alert.alert(t('screens.startup.error'), t('screens.startup.completionScreen.languagesMissing'));
      return;
    }

    try {
      setSaving(true);
      console.log('[OnboardingCompletion] Starting setup completion...');
      
      // Show loader for 3 seconds with "Setting up" text
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('[OnboardingCompletion] Languages are already saved in LanguageContext, saving practice settings');

      // Save practice settings (languages are already saved by LanguageContext)
      await AsyncStorage.setItem('words.removeAfterNCorrect', String(removeAfterCorrect));
      await AsyncStorage.setItem('words.removeAfterTotalCorrect', String(removeAfterTotalCorrect));
      
      // Ensure user is authenticated (auto-authenticate if not already)
      await AsyncStorage.multiSet([
        ['user_logged_in', 'true'],
        ['user_email', 'auto@user.com'],
        ['user_name', 'Auto User'],
        ['user_id', 'auto-user-id'],
      ]);

      console.log('[OnboardingCompletion] Practice settings saved');
      console.log('[OnboardingCompletion] Cleaning up temporary storage');

      // Clean up temporary storage
      await AsyncStorage.removeItem('temp.learningLanguage');
      await AsyncStorage.removeItem('temp.nativeLanguage');

      console.log('[OnboardingCompletion] Temporary storage cleaned up');
      
      // Complete setup and navigate directly to MainTabs
      console.log('[OnboardingCompletion] Calling completeSetup...');
      await completeSetup();
      console.log('[OnboardingCompletion] Setup completed successfully');
      
      // Navigate directly to MainTabs
      console.log('[OnboardingCompletion] Navigating to MainTabs...');
      setTimeout(() => {
        navigation.getParent()?.navigate('Main');
      }, 500);  //1000 works 
      
      // Reset saving state after successful completion
      setSaving(false);
    } catch (e) {
      console.error('[OnboardingCompletion] Error during setup completion:', e);
      setSaving(false);
      Alert.alert(t('screens.startup.error'), t('screens.startup.failedToSavePreferences'));
    }
  };

  const onBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="checkmark-circle-outline" size={40} color="#34C759" />
        </View>
        <Text style={styles.title}>{t('screens.startup.completionScreen.title')}</Text>
        <Text style={styles.subtitle}>{t('screens.startup.completionScreen.subtitle')}</Text>
      </View>

      {/* Summary Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>{t('screens.startup.completionScreen.yourSettings')}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('screens.settings.learningLanguage')}</Text>
          <Text style={styles.summaryValue}>{learningLanguage || t('screens.startup.completionScreen.notSelected')}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('screens.settings.nativeLanguage')}</Text>
          <Text style={styles.summaryValue}>{nativeLanguage || t('screens.startup.completionScreen.notSelected')}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('screens.settings.practiceCompletion')}</Text>
          <Text style={styles.summaryValue}>{t('screens.startup.completionScreen.correctAnswers', { count: removeAfterCorrect })}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('screens.settings.wordMastery')}</Text>
          <Text style={styles.summaryValue}>{t('screens.startup.completionScreen.totalCorrectAnswers', { count: removeAfterTotalCorrect })}</Text>
        </View>
      </View>

      {/* Button Section */}
      <View style={styles.buttonSection}>
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={t('screens.startup.completionScreen.accessibility.goBack')}
          >
            <Ionicons 
              name="arrow-back" 
              size={20} 
              color="#007AFF" 
              style={[styles.backButtonIcon, isHebrew && { transform: [{ rotate: '180deg' }] }]} 
            />
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </Pressable>
          
          <Pressable
            style={[styles.completeButton, saving && styles.completeButtonDisabled]}
            onPress={onComplete}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={saving ? t('screens.startup.settingUpAccount') : t('screens.startup.completionScreen.accessibility.completeSetup')}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" style={styles.buttonSpinner} />
            ) : (
              <Ionicons name="rocket-outline" size={20} color="white" style={styles.buttonIcon} />
            )}
            <Text style={styles.completeButtonText}>
              {saving ? t('screens.startup.completionScreen.settingUp') : t('screens.startup.completionScreen.startLearning')}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Main container styles
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 100,
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

  // Summary styles
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'right',
  },

  // Button section
  buttonSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  backButtonIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  completeButton: {
    flex: 2,
    backgroundColor: '#34C759',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completeButtonDisabled: {
    backgroundColor: '#a0a0a0',
    shadowOpacity: 0.1,
  },
  completeButtonText: {
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

export default OnboardingCompletionScreen;
