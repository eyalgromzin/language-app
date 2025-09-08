import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View, TouchableOpacity, Alert, Dimensions } from 'react-native';
import * as RNFS from 'react-native-fs';
import { useFocusEffect } from '@react-navigation/native';
import { WordEntry } from '../../types/words';
import linkingService from '../../services/linkingService';

const { width } = Dimensions.get('window');

function MyWordsScreen(): React.JSX.Element {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [words, setWords] = React.useState<WordEntry[]>([]);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;

  const loadWords = React.useCallback(async () => {
    setLoading(true);
    try {
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        setWords([]);
        return;
      }
      const content = await RNFS.readFile(filePath, 'utf8');
      const parsed: unknown = JSON.parse(content);
      const ensureNoa = (it: WordEntry): WordEntry => ({
        ...it,
        numberOfCorrectAnswers: it.numberOfCorrectAnswers || {
          missingLetters: 0,
          missingWords: 0,
          chooseTranslation: 0,
          chooseWord: 0,
          memoryGame: 0,
          writeTranslation: 0,
          writeWord: 0,
        },
      });
      const arr = (Array.isArray(parsed) ? (parsed as WordEntry[]) : []).map(ensureNoa);
      const sorted = [...arr].sort((a, b) => {
        const ta = a.addedAt ? Date.parse(a.addedAt) : 0;
        const tb = b.addedAt ? Date.parse(b.addedAt) : 0;
        return tb - ta;
      });
      setWords(sorted);
      // Persist back the normalized structure so future reads are consistent
      try {
        await RNFS.writeFile(filePath, JSON.stringify(sorted, null, 2), 'utf8');
      } catch {}
    } catch {
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  useFocusEffect(
    React.useCallback(() => {
      // Refresh list every time screen gains focus
      loadWords();
      return () => {};
    }, [loadWords])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadWords();
    setRefreshing(false);
  }, [loadWords]);

  const confirmClearAll = React.useCallback(() => {
    if (loading) return;
    Alert.alert(
      'Clear all words',
      'This will remove all saved words. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setExpanded({});
              await RNFS.writeFile(filePath, JSON.stringify([], null, 2), 'utf8');
              setWords([]);
            } catch {}
            finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [filePath, loading]);

  const deleteWord = React.useCallback(async (wordToDelete: WordEntry) => {
    try {
      const updatedWords = words.filter(word => 
        word.word !== wordToDelete.word || 
        word.sentence !== wordToDelete.sentence || 
        word.addedAt !== wordToDelete.addedAt
      );
      await RNFS.writeFile(filePath, JSON.stringify(updatedWords, null, 2), 'utf8');
      setWords(updatedWords);
      // Clear expanded state for deleted word
      const deletedId = getItemId(wordToDelete, words.findIndex(w => w === wordToDelete));
      setExpanded(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[deletedId];
        return newExpanded;
      });
    } catch (error) {
      console.error('Error deleting word:', error);
    }
  }, [words, filePath]);

  const confirmDeleteWord = React.useCallback((word: WordEntry) => {
    Alert.alert(
      'Delete word',
      `Are you sure you want to delete "${word.word}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWord(word),
        },
      ]
    );
  }, [deleteWord]);

  const shareWord = React.useCallback(async (word: WordEntry) => {
    try {
      await linkingService.shareWord(word.word, word.translation, word.sentence);
    } catch (error) {
      console.error('Error sharing word:', error);
    }
  }, []);

  const getItemId = (item: WordEntry, index: number) => `${item.word}|${item.sentence || ''}|${item.addedAt || index}`;

  const renderItem = ({ item, index }: { item: WordEntry; index: number }) => {
    const id = getItemId(item, index);
    const isExpanded = !!expanded[id];
    const toggleExpanded = () => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    
    const totalProgress = Object.values(item.numberOfCorrectAnswers || {}).reduce((sum, val) => sum + val, 0);
    
    return (
      <View style={styles.wordCard}>
        <View style={styles.cardHeader}>
          <View style={styles.wordInfo}>
            <Text style={styles.wordText} numberOfLines={1}>{item.word}</Text>
            {/* {item.addedAt && (
              <Text style={styles.addedDate}>
                {new Date(item.addedAt).toLocaleDateString()}
              </Text>
            )} */}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => shareWord(item)}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={`Share ${item.word}`}
            >
              <Text style={styles.shareIcon}>↗</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => confirmDeleteWord(item)}
              style={[styles.actionButton, styles.deleteButton]}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.word}`}
            >
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          {item.translation ? (
            <View style={styles.translationContainer}>
              {/* <Text style={styles.translationLabel}>Translation</Text> */}
              <Text style={styles.translationText} numberOfLines={3}>{item.translation}</Text>
            </View>
          ) : null}
          
          {item.sentence ? (
            <View style={styles.sentenceContainer}>
              <Text style={styles.sentenceLabel}>Example</Text>
              <Text style={styles.sentenceText} numberOfLines={3}>{item.sentence}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.progressSection}>
          <TouchableOpacity
            onPress={toggleExpanded}
            style={styles.progressToggle}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? 'Hide progress' : 'Show progress'}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Learning Progress</Text>
              <View style={styles.progressSummary}>
                <Text style={styles.progressTotal}>{totalProgress} total</Text>
                <Text style={styles.progressCaret}>{isExpanded ? '▼' : '▶'}</Text>
              </View>
            </View>
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.progressDetails}>
              <View style={styles.progressGrid}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressItemLabel}>Missing Letters</Text>
                  <Text style={styles.progressItemValue}>{item.numberOfCorrectAnswers?.missingLetters ?? 0}</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressItemLabel}>Missing Words</Text>
                  <Text style={styles.progressItemValue}>{item.numberOfCorrectAnswers?.missingWords ?? 0}</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressItemLabel}>Choose Translation</Text>
                  <Text style={styles.progressItemValue}>{item.numberOfCorrectAnswers?.chooseTranslation ?? 0}</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressItemLabel}>Choose Word</Text>
                  <Text style={styles.progressItemValue}>{item.numberOfCorrectAnswers?.chooseWord ?? 0}</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressItemLabel}>Memory Game</Text>
                  <Text style={styles.progressItemValue}>{item.numberOfCorrectAnswers?.memoryGame ?? 0}</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressItemLabel}>Write Translation</Text>
                  <Text style={styles.progressItemValue}>{item.numberOfCorrectAnswers?.writeTranslation ?? 0}</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressItemLabel}>Write Word</Text>
                  <Text style={styles.progressItemValue}>{item.numberOfCorrectAnswers?.writeWord ?? 0}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>My Words</Text>
            {!loading && (
              <View style={styles.statsContainer}>
                <View style={styles.statBadge}>
                  <Text style={styles.statNumber}>{words.length}</Text>
                  <Text style={styles.statLabel}>{words.length === 1 ? 'word' : 'words'}</Text>
                </View>
              </View>
            )}
          </View>
          {!loading && words.length > 0 ? (
            <TouchableOpacity
              onPress={confirmClearAll}
              style={styles.clearAllButton}
              accessibilityRole="button"
              accessibilityLabel="Clear all words"
            >
              <Text style={styles.clearAllButtonText}>Clear All</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading your words...</Text>
        </View>
      ) : words.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📚</Text>
          </View>
          <Text style={styles.emptyTitle}>No Words Yet</Text>
          <Text style={styles.emptyDescription}>
            Start building your vocabulary by adding words from the Surf tab. 
            Your saved words will appear here with progress tracking.
          </Text>
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item, index) => getItemId(item, index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header Styles
  headerSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  clearAllButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearAllButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // List Styles
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Word Card Styles
  wordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 16,
  },
  wordInfo: {
    flex: 1,
    marginRight: 12,
  },
  wordText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  addedDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  shareIcon: {
    fontSize: 16,
    color: '#0284C7',
    fontWeight: '600',
  },
  deleteIcon: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
  
  // Card Content
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  translationContainer: {
    marginBottom: 12,
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  translationText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 22,
  },
  sentenceContainer: {
    marginBottom: 4,
  },
  sentenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sentenceText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  
  // Progress Section
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  progressToggle: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  progressSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  progressCaret: {
    fontSize: 14,
    color: '#64748B',
  },
  progressDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  progressItem: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: (width - 80) / 2,
    flex: 1,
  },
  progressItemLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  progressItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
});

export default MyWordsScreen;


