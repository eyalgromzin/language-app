import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import RNFS from 'react-native-fs';
import { useFocusEffect } from '@react-navigation/native';

type WordEntry = {
  word: string;
  translation: string;
  sentence?: string;
  addedAt?: string;
  numberOfCorrectAnswers?: {
    missingLetters: number;
    missingWords: number;
    wordsAndTranslations: number;
    writeTranslation: number;
    writeWord: number;
  };
};

function MyWordsScreen(): React.JSX.Element {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [words, setWords] = React.useState<WordEntry[]>([]);

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
          wordsAndTranslations: 0,
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

  const renderItem = ({ item }: { item: WordEntry }) => {
    return (
      <View style={styles.itemRow}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemWord} numberOfLines={1}>{item.word}</Text>
          {item.addedAt ? (
            <Text style={styles.itemDate} numberOfLines={1}>{new Date(item.addedAt).toLocaleString()}</Text>
          ) : null}
        </View>
        {item.translation ? (
          <Text style={styles.itemTranslation} numberOfLines={3}>{item.translation}</Text>
        ) : null}
        {item.sentence ? (
          <Text style={styles.itemSentence} numberOfLines={3}>{item.sentence}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="small" color="#555" /></View>
      ) : words.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No words saved yet. Add words from the Surf tab.</Text>
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(item, index) => `${item.word}|${item.sentence || ''}|${item.addedAt || index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  listContent: {
    paddingBottom: 16,
  },
  itemRow: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemWord: {
    fontSize: 16,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: 8,
  },
  itemDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  itemTranslation: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  itemSentence: {
    fontSize: 13,
    color: '#666',
  },
});

export default MyWordsScreen;


