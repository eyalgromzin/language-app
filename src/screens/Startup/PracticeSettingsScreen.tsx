import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

type OnboardingStackParamList = {
  LearningLanguage: undefined;
  NativeLanguage: undefined;
  PracticeSettings: undefined;
  Completion: undefined;
};

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PracticeSettings'>;

function PracticeSettingsScreen({ navigation }: Props): React.JSX.Element {
  const [removeAfterCorrect, setRemoveAfterCorrect] = React.useState<number>(3);
  const [removeAfterTotalCorrect, setRemoveAfterTotalCorrect] = React.useState<number>(6);

  const onContinue = () => {
    navigation.navigate('Completion', {
      removeAfterCorrect,
      removeAfterTotalCorrect,
    });
  };

  const onBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="settings-outline" size={40} color="#007AFF" />
        </View>
        <Text style={styles.title}>Practice Settings</Text>
        <Text style={styles.subtitle}>Customize your learning experience</Text>
      </View>

      {/* Practice Settings Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy-outline" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>Practice Configuration</Text>
        </View>
        
        <View style={styles.pickerBlock}>
          <Text style={styles.infoLabel}>Correct answers needed to complete a practice type</Text>
          <Text style={styles.infoSubtext}>Choose how many correct answers you need before a practice type is considered complete</Text>
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
          <Text style={styles.infoLabel}>Total correct answers before word is mastered</Text>
          <Text style={styles.infoSubtext}>Choose how many total correct answers are needed before a word is considered fully learned</Text>
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

      {/* Button Section */}
      <View style={styles.buttonSection}>
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back to native language selection"
          >
            <Ionicons name="arrow-back" size={20} color="#007AFF" style={styles.backButtonIcon} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          
          <Pressable
            style={styles.continueButton}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel="Continue to completion"
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
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
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

export default PracticeSettingsScreen;
