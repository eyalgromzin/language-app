import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { WordEntry } from '../../types/words';

const { width } = Dimensions.get('window');

type ProgressStats = {
  totalWords: number;
  wordsLearned: number;
  sentencesLearned: number;
  practicesFinished: number;
  loadTime: string;
};

const WORDS_FILE_PATH = `${RNFS.DocumentDirectoryPath}/words.json`;

export default function ProgressScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const loadStats = async () => {
    try {
      // Get the threshold setting from AsyncStorage
      const removeAfterTotalCorrectRaw = await AsyncStorage.getItem('words.removeAfterTotalCorrect');
      const removeAfterTotalCorrect = parseInt(removeAfterTotalCorrectRaw || '6', 10) || 6;

      const wordsFileExists = await RNFS.exists(WORDS_FILE_PATH);
      let words: WordEntry[] = [];

      if (wordsFileExists) {
        const wordsContent = await RNFS.readFile(WORDS_FILE_PATH, 'utf8');
        words = JSON.parse(wordsContent) || [];
      }

      // Calculate statistics
      const totalWords = words.length;
      
      // Count words that have reached the threshold for "learned" status
      const wordsLearned = words.filter(word => {
        const answers = word.numberOfCorrectAnswers;
        if (!answers) return false;
        
        const totalCorrectAnswers = (answers.missingLetters || 0) +
                                   (answers.missingWords || 0) +
                                   (answers.chooseTranslation || 0) +
                                   (answers.chooseWord || 0) +
                                   (answers.memoryGame || 0) +
                                   (answers.writeTranslation || 0) +
                                   (answers.writeWord || 0) +
                                   (answers.formulateSentence || 0);
        
        return totalCorrectAnswers >= removeAfterTotalCorrect;
      }).length;

      // Count sentences learned (words with sentence context that have reached the threshold)
      const sentencesLearned = words.filter(word => {
        const answers = word.numberOfCorrectAnswers;
        if (!answers) return false;
        
        // Must have sentence context AND reach the threshold
        const hasSentenceContext = !!word.sentence || (answers.formulateSentence || 0) > 0;
        if (!hasSentenceContext) return false;
        
        const totalCorrectAnswers = (answers.missingLetters || 0) +
                                   (answers.missingWords || 0) +
                                   (answers.chooseTranslation || 0) +
                                   (answers.chooseWord || 0) +
                                   (answers.memoryGame || 0) +
                                   (answers.writeTranslation || 0) +
                                   (answers.writeWord || 0) +
                                   (answers.formulateSentence || 0);
        
        return totalCorrectAnswers >= removeAfterTotalCorrect;
      }).length;

      // Count total practice completions
      const practicesFinished = words.reduce((total, word) => {
        const answers = word.numberOfCorrectAnswers;
        if (!answers) return total;
        
        return total +
               (answers.missingLetters || 0) +
               (answers.missingWords || 0) +
               (answers.chooseTranslation || 0) +
               (answers.chooseWord || 0) +
               (answers.memoryGame || 0) +
               (answers.writeTranslation || 0) +
               (answers.writeWord || 0) +
               (answers.formulateSentence || 0);
      }, 0);

      const now = new Date();
      const loadTime = now.toLocaleTimeString();

      setStats({
        totalWords,
        wordsLearned,
        sentencesLearned,
        practicesFinished,
        loadTime,
      });
      
      // Animate progress bar
      const learningProgress = totalWords > 0 ? (wordsLearned / totalWords) * 100 : 0;
      Animated.timing(progressAnim, {
        toValue: learningProgress,
        duration: 1000,
        useNativeDriver: false,
      }).start();
      
    } catch (error) {
      console.error('Error loading progress stats:', error);
      setStats({
        totalWords: 0,
        wordsLearned: 0,
        sentencesLearned: 0,
        practicesFinished: 0,
        loadTime: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
  };

  useEffect(() => {
    loadStats();
    
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('screens.progress.loadingProgress')}</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('screens.progress.unableToLoadData')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
          <Text style={styles.retryButtonText}>{t('screens.progress.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const learningProgress = stats.totalWords > 0 ? (stats.wordsLearned / stats.totalWords) * 100 : 0;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="analytics" size={28} color="#6366F1" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Progress Dashboard</Text>
              <Text style={styles.headerSubtitle}>Track your learning journey</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]} 
            onPress={handleRefresh} 
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={refreshing ? "#9CA3AF" : "#6366F1"} 
            />
          </TouchableOpacity>
        </View>

        {/* Progress Overview Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{t('screens.progress.learningStatistics')}</Text>
            <Text style={styles.progressSubtitle}>
              {stats.wordsLearned} of {stats.totalWords} {t('screens.progress.wordsMasteredCount')}
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <Animated.View 
                style={[
                  styles.progressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    }),
                  },
                ]} 
              />
            </View>
            <Text style={styles.progressPercentage}>{learningProgress.toFixed(1)}%</Text>
          </View>
          
          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <Text style={styles.progressStatNumber}>{stats.wordsLearned}</Text>
              <Text style={styles.progressStatLabel}>{t('screens.progress.mastered')}</Text>
            </View>
            <View style={styles.progressStatDivider} />
            <View style={styles.progressStatItem}>
              <Text style={styles.progressStatNumber}>{stats.totalWords - stats.wordsLearned}</Text>
              <Text style={styles.progressStatLabel}>{t('screens.progress.remaining')}</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>{t('screens.progress.learningStatistics')}</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardPrimary]}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, styles.statIconPrimary]}>
                  <Ionicons name="library-outline" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>{stats.totalWords}</Text>
              </View>
              <Text style={styles.statLabel}>{t('screens.progress.wordsAdded')}</Text>
              <Text style={styles.statDescription}>{t('screens.progress.totalVocabularyCollected')}</Text>
            </View>

            <View style={[styles.statCard, styles.statCardSuccess]}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, styles.statIconSuccess]}>
                  <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>{stats.wordsLearned}</Text>
              </View>
              <Text style={styles.statLabel}>{t('screens.progress.wordsMastered')}</Text>
              <Text style={styles.statDescription}>{t('screens.progress.fullyLearnedVocabulary')}</Text>
            </View>

            <View style={[styles.statCard, styles.statCardInfo]}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, styles.statIconInfo]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>{stats.sentencesLearned}</Text>
              </View>
              <Text style={styles.statLabel}>{t('screens.progress.sentencesMastered')}</Text>
              <Text style={styles.statDescription}>{t('screens.progress.contextualUnderstanding')}</Text>
            </View>

            <View style={[styles.statCard, styles.statCardWarning]}>
              <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, styles.statIconWarning]}>
                  <Ionicons name="trophy-outline" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>{stats.practicesFinished}</Text>
              </View>
              <Text style={styles.statLabel}>{t('screens.progress.practicesCompleted')}</Text>
              <Text style={styles.statDescription}>{t('screens.progress.totalExercisesFinished')}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Ionicons name="time-outline" size={16} color="#9CA3AF" />
            <Text style={styles.lastUpdated}>{t('screens.progress.lastUpdated')} {stats.loadTime}</Text>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonDisabled: {
    backgroundColor: '#F1F5F9',
  },
  
  // Progress Card Styles
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  progressHeader: {
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6366F1',
    textAlign: 'right',
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
  },
  
  // Stats Section Styles
  statsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    width: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statIconPrimary: {
    backgroundColor: '#3B82F6',
  },
  statIconSuccess: {
    backgroundColor: '#10B981',
  },
  statIconInfo: {
    backgroundColor: '#06B6D4',
  },
  statIconWarning: {
    backgroundColor: '#F59E0B',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  
  // Card Variants
  statCardPrimary: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  statCardSuccess: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  statCardInfo: {
    borderLeftWidth: 4,
    borderLeftColor: '#06B6D4',
  },
  statCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  
  // Footer Styles
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
  },
});
