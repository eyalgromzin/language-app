import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

type OnboardingStackParamList = {
  LearningLanguage: undefined;
  NativeLanguage: undefined;
  PracticeSettings: undefined;
  Completion: undefined;
};

type Props = NativeStackScreenProps<OnboardingStackParamList, 'NativeLanguage'>;

function NativeLanguageScreen({ navigation }: Props): React.JSX.Element {
  const { languageMappings, isLoading: languagesLoading } = useLanguageMappings();
  const { nativeLanguage, setNativeLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>('');
  const { t } = useTranslation();

  const onContinue = async () => {
    if (!selectedLanguage) {
      return; // Button will be disabled if no language selected
    }
    
    // Save the native language temporarily and in context
    try {
      await AsyncStorage.setItem('temp.nativeLanguage', selectedLanguage);
      await setNativeLanguage(selectedLanguage);
    } catch (error) {
      console.error('Error saving native language:', error);
    }
    
    navigation.navigate('PracticeSettings');
  };

  const handleLanguageChange = async (value: string) => {
    setSelectedLanguage(value);
    if (value) {
      await setNativeLanguage(value);
    }
  };

  const onBack = () => {
    navigation.goBack();
  };

  if (languagesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="language" size={48} color="#007AFF" />
          </View>
          <Text style={styles.loadingTitle}>{t('screens.home.title')}</Text>
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
          <Ionicons name="person-outline" size={40} color="#007AFF" />
        </View>
        <Text style={styles.title}>{t('screens.startup.nativeLanguageScreen.title')}</Text>
        <Text style={styles.subtitle}>{t('screens.startup.nativeLanguageScreen.subtitle')}</Text>
      </View>

      {/* Language Selection Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="home-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>{t('screens.settings.nativeLanguage')}</Text>
        </View>
        
        <View style={styles.pickerBlock}>
          <Text style={styles.label}>{t('screens.startup.nativeLanguageScreen.selectNativeLanguage')}</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedLanguage}
              onValueChange={handleLanguageChange}
            >
              <Picker.Item label={t('screens.startup.selectNativeLanguage')} value="" />
              {Object.keys(languageMappings).map((lang) => (
                <Picker.Item key={lang} label={lang} value={lang} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Button Section */}
      <View style={styles.buttonSection}>
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t('screens.startup.nativeLanguageScreen.accessibility.goBackToLearningSelection')}
          >
            <Ionicons name="arrow-back" size={20} color="#007AFF" style={styles.backButtonIcon} />
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </Pressable>
          
          <Pressable
            style={[styles.continueButton, !selectedLanguage && styles.continueButtonDisabled]}
            onPress={onContinue}
            disabled={!selectedLanguage}
            accessibilityRole="button"
            accessibilityLabel={t('screens.startup.nativeLanguageScreen.accessibility.continueToPracticeSettings')}
          >
            <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
          </Pressable>
        </View>
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
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
  continueButton: {
    flex: 2,
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
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default NativeLanguageScreen;
