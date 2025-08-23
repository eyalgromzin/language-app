import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import Ionicons from 'react-native-vector-icons/Ionicons';

type WordEntry = {
  word: string;
  translation: string;
  sentence?: string;
  addedAt?: string;
  numberOfCorrectAnswers?: {
    missingLetters: number;
    missingWords: number;
    chooseTranslation: number;
    chooseWord?: number;
    memoryGame?: number;
    writeTranslation: number;
    writeWord: number;
    formulateSentence?: number;
  };
};

type ProgressStats = {
  totalWords: number;
  wordsLearned: number;
  sentencesLearned: number;
  practicesFinished: number;
  loadTime: string;
};

const WORDS_FILE_PATH = `${RNFS.DocumentDirectoryPath}/words.json`;

export default function ProgressScreen(): React.JSX.Element {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading progress...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load progress data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const learningProgress = stats.totalWords > 0 ? (stats.wordsLearned / stats.totalWords) * 100 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Ionicons name="stats-chart" size={24} color="#007AFF" />
        <Text style={styles.headerTitle}>Your Progress</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color={refreshing ? "#ccc" : "#007AFF"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.progressOverview}>
        <Text style={styles.overviewTitle}>Learning Progress</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${learningProgress}%` }]} />
        </View>
        <Text style={styles.progressPercentage}>{learningProgress.toFixed(1)}%</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="library" size={28} color="#FF6B6B" />
          </View>
          <Text style={styles.statNumber}>{stats.totalWords}</Text>
          <Text style={styles.statLabel}>Words Added</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={28} color="#4ECDC4" />
          </View>
          <Text style={styles.statNumber}>{stats.wordsLearned}</Text>
          <Text style={styles.statLabel}>Words Mastered</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="chatbubble-ellipses" size={28} color="#45B7D1" />
          </View>
          <Text style={styles.statNumber}>{stats.sentencesLearned}</Text>
          <Text style={styles.statLabel}>Sentences Mastered</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="trophy" size={28} color="#FFA726" />
          </View>
          <Text style={styles.statNumber}>{stats.practicesFinished}</Text>
          <Text style={styles.statLabel}>Practices Finished</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.lastUpdated}>Last updated: {stats.loadTime}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  progressOverview: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
  },
});
