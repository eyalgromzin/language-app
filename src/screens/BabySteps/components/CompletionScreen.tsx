import React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';

interface CompletionScreenProps {
  stepIndex: number;
  numCorrect: number;
  numWrong: number;
  streak: number;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  slideAnim: Animated.Value;
  confettiAnim: Animated.Value;
  onFinish: () => void;
  onRestart: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({
  stepIndex,
  numCorrect,
  numWrong,
  streak,
  fadeAnim,
  scaleAnim,
  slideAnim,
  confettiAnim,
  onFinish,
  onRestart,
}) => {
  return (
    <View style={styles.completionContainer}>
      {/* Celebration Background */}
      <Animated.View 
        style={[
          styles.celebrationBackground,
          {
            opacity: confettiAnim,
            transform: [{ scale: confettiAnim }],
          }
        ]} 
      />
      
      {/* Main Content */}
      <Animated.View 
        style={[
          styles.completionContent,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          }
        ]}
      >
        {/* Success Icon */}
        <Animated.View 
          style={[
            styles.successIconContainer,
            {
              transform: [{ 
                scale: confettiAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1],
                })
              }],
            }
          ]}
        >
          <Text style={styles.successIcon}>🎉</Text>
          <Animated.View 
            style={[
              styles.successCheckmark,
              {
                transform: [{ 
                  scale: confettiAnim.interpolate({
                    inputRange: [0, 0.3, 1],
                    outputRange: [0, 1.2, 1],
                  })
                }],
              }
            ]}
          >
            <Text style={styles.checkmarkText}>✓</Text>
          </Animated.View>
        </Animated.View>
        
        {/* Congratulations Text */}
        <Animated.Text 
          style={[
            styles.congratulationsTitle,
            {
              transform: [{ 
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, -10],
                })
              }],
            }
          ]}
        >
          Congratulations!
        </Animated.Text>
        <Animated.Text 
          style={[
            styles.stepCompletedText,
            {
              transform: [{ 
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, -5],
                })
              }],
            }
          ]}
        >
          Step {stepIndex + 1} completed successfully
        </Animated.Text>
        
        {/* Stats Card */}
        <Animated.View 
          style={[
            styles.statsCard,
            {
              transform: [{ 
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, -15],
                })
              }],
            }
          ]}
        >
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{numCorrect}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.round((numCorrect / (numCorrect + numWrong)) * 100)}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </Animated.View>
        
        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actionButtonsContainer,
            {
              transform: [{ 
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, -20],
                })
              }],
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={onRestart} 
            accessibilityRole="button" 
            accessibilityLabel="Restart step"
          >
            <Text style={styles.secondaryButtonText}>Practice Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={onFinish} 
            accessibilityRole="button" 
            accessibilityLabel="Finish step"
          >
            <Text style={styles.primaryButtonText}>Continue Learning</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  completionContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  celebrationBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#667eea',
    opacity: 0.05,
  },
  completionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  successCheckmark: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  congratulationsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepCompletedText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  actionButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CompletionScreen;
