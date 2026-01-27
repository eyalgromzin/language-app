import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface ProgressHeaderProps {
  stepIndex: number;
  numCorrect: number;
  originalTaskCount: number;
  numWrong: number;
  streak: number;
  onSkip: () => void;
}

const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  stepIndex,
  numCorrect,
  originalTaskCount,
  numWrong,
  streak,
  onSkip,
}) => {
  const { t } = useTranslation();

  const progressLabel = t('screens.babyStepsRunner.progressSummary', {
    step: stepIndex + 1,
    correct: numCorrect,
    total: originalTaskCount,
    wrong: numWrong,
  });

  return (
    <View style={styles.topRow}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{progressLabel}</Text>
        {streak > 0 && (
          <View style={styles.streakIndicator}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        )}
      </View>
      {numCorrect < originalTaskCount ? (
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={onSkip} 
          accessibilityRole="button" 
          accessibilityLabel={t('common.skip')}
        >
          <Text style={styles.skipText}>{t('common.skip')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  titleContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  title: { 
    fontSize: 16, 
    fontWeight: '700', 
    flex: 1 
  },
  streakIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FF6B35', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12,
    marginLeft: 8,
    marginRight: 8
  },
  streakEmoji: { 
    fontSize: 14, 
    marginRight: 4 
  },
  streakText: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#fff' 
  },
  skipButton: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8, 
    backgroundColor: '#fff' 
  },
  skipText: { 
    color: '#007AFF', 
    fontWeight: '700' 
  },
});

export default ProgressHeader;
