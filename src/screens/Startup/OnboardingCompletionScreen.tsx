import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  const [saving, setSaving] = React.useState<boolean>(false);
  const [learningLanguage, setLearningLanguage] = React.useState<string>('');
  const [nativeLanguage, setNativeLanguage] = React.useState<string>('');

  // Get the settings from the previous screens
  const { removeAfterCorrect, removeAfterTotalCorrect } = route.params;

  React.useEffect(() => {
    // Get the selected languages from AsyncStorage (they should be set by previous screens)
    const getSelectedLanguages = async () => {
      try {
        const learning = await AsyncStorage.getItem('temp.learningLanguage');
        const native = await AsyncStorage.getItem('temp.nativeLanguage');
        if (learning) setLearningLanguage(learning);
        if (native) setNativeLanguage(native);
      } catch (error) {
        console.error('Error getting selected languages:', error);
      }
    };
    getSelectedLanguages();
  }, []);

  const onComplete = async () => {
    if (!learningLanguage || !nativeLanguage) {
      Alert.alert('Error', 'Language selection is missing. Please go back and select your languages.');
      return;
    }

    try {
      setSaving(true);
      console.log('[OnboardingCompletion] Starting setup completion...');
      
      // Show loader for 3 seconds with "Setting up" text
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('[OnboardingCompletion] Saving languages and settings');

      // Save languages and settings
      await AsyncStorage.setItem('language.learning', learningLanguage);
      await AsyncStorage.setItem('language.native', nativeLanguage);
      await AsyncStorage.setItem('words.removeAfterNCorrect', String(removeAfterCorrect));
      await AsyncStorage.setItem('words.removeAfterTotalCorrect', String(removeAfterTotalCorrect));
      
      // Ensure user is authenticated (auto-authenticate if not already)
      await AsyncStorage.multiSet([
        ['user_logged_in', 'true'],
        ['user_email', 'auto@user.com'],
        ['user_name', 'Auto User'],
        ['user_id', 'auto-user-id'],
      ]);

      console.log('[OnboardingCompletion] Languages and settings saved');
      console.log('[OnboardingCompletion] Removing temporary items');

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
      navigation.getParent()?.navigate('Main');
      
      // Reset saving state after successful completion
      setSaving(false);
    } catch (e) {
      console.error('[OnboardingCompletion] Error during setup completion:', e);
      setSaving(false);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
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
        <Text style={styles.title}>You're All Set!</Text>
        <Text style={styles.subtitle}>Review your settings and start learning</Text>
      </View>

      {/* Summary Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Your Settings</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Learning Language</Text>
          <Text style={styles.summaryValue}>{learningLanguage || 'Not selected'}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Native Language</Text>
          <Text style={styles.summaryValue}>{nativeLanguage || 'Not selected'}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Practice Completion</Text>
          <Text style={styles.summaryValue}>{removeAfterCorrect} correct answers</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Word Mastery</Text>
          <Text style={styles.summaryValue}>{removeAfterTotalCorrect} total correct answers</Text>
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
            accessibilityLabel="Go back to practice settings"
          >
            <Ionicons name="arrow-back" size={20} color="#007AFF" style={styles.backButtonIcon} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          
          <Pressable
            style={[styles.completeButton, saving && styles.completeButtonDisabled]}
            onPress={onComplete}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={saving ? 'Setting up your account' : 'Complete setup and start learning'}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" style={styles.buttonSpinner} />
            ) : (
              <Ionicons name="rocket-outline" size={20} color="white" style={styles.buttonIcon} />
            )}
            <Text style={styles.completeButtonText}>
              {saving ? 'Setting up' : 'Start Learning'}
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
