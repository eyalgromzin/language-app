import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>{t('screens.babyStepsRunner.loadingStepContent')}</Text>
      <Text style={styles.loadingSubtext}>{t('screens.babyStepsRunner.preparingPracticeExercises')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
    backgroundColor: '#f8fafc'
  },
  loadingText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#333',
    textAlign: 'center'
  },
  loadingSubtext: { 
    fontSize: 14, 
    color: '#666',
    textAlign: 'center',
    marginTop: 4
  },
});

export default LoadingScreen;
