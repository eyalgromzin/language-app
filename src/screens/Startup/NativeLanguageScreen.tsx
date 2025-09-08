import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

type OnboardingStackParamList = {
  LearningLanguage: undefined;
  NativeLanguage: undefined;
  PracticeSettings: undefined;
  Completion: undefined;
};

type Props = NativeStackScreenProps<OnboardingStackParamList, 'NativeLanguage'>;

function NativeLanguageScreen({ navigation }: Props): React.JSX.Element {
  const { languageMappings, isLoading: languagesLoading } = useLanguageMappings();
  const [nativeLanguage, setNativeLanguage] = React.useState<string>('');

  const onContinue = async () => {
    if (!nativeLanguage) {
      return; // Button will be disabled if no language selected
    }
    
    // Store the selected language temporarily
    try {
      await AsyncStorage.setItem('temp.nativeLanguage', nativeLanguage);
    } catch (error) {
      console.error('Error saving native language:', error);
    }
    
    navigation.navigate('PracticeSettings');
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
          <Text style={styles.loadingTitle}>HelloLingo</Text>
          <Text style={styles.loadingSubtitle}>Loading available languages...</Text>
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
        <Text style={styles.title}>Your Native Language</Text>
        <Text style={styles.subtitle}>What is your native or primary language?</Text>
      </View>

      {/* Language Selection Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="home-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Native Language</Text>
        </View>
        
        <View style={styles.pickerBlock}>
          <Text style={styles.label}>Select your native language</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={nativeLanguage}
              onValueChange={(value) => setNativeLanguage(value)}
            >
              <Picker.Item label="Choose your native language..." value="" />
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
            accessibilityLabel="Go back to learning language selection"
          >
            <Ionicons name="arrow-back" size={20} color="#007AFF" style={styles.backButtonIcon} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          
          <Pressable
            style={[styles.continueButton, !nativeLanguage && styles.continueButtonDisabled]}
            onPress={onContinue}
            disabled={!nativeLanguage}
            accessibilityRole="button"
            accessibilityLabel="Continue to practice settings"
          >
            <Text style={styles.continueButtonText}>Continue</Text>
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
