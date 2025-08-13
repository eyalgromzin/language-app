import * as React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform, Alert, ToastAndroid } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import RNFS from 'react-native-fs';

type LocalizedText = Record<string, string>;

type WordItem = {
  id: string;
  type: 'word' | 'sentence';
  text: LocalizedText;
  example?: LocalizedText;
};

type WordCategory = {
  id: string;
  emoji?: string;
  name: LocalizedText;
  description?: LocalizedText;
  items: WordItem[];
};

type CategoriesData = {
  languages: string[];
  categories: WordCategory[];
};

const CATEGORIES_DATA: CategoriesData = require('../../userData/wordCategories.json');

const SOURCE_LANGUAGE = 'English';
const TARGET_LANGUAGE = 'Spanish';

function WordsByCategoriesScreen(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = React.useState<WordCategory | null>(null);
  const navigation = useNavigation<any>();

  useFocusEffect(
    React.useCallback(() => {
      setSelectedCategory(null);
    }, [])
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      setSelectedCategory(null);
    });
    return unsubscribe;
  }, [navigation]);

  const onOpenCategory = (category: WordCategory) => {
    setSelectedCategory(category);
  };

  const onBackToCategories = () => {
    setSelectedCategory(null);
  };

  const saveItemToMyWords = async (item: WordItem) => {
    const source = item.text[SOURCE_LANGUAGE] || '';
    const target = item.text[TARGET_LANGUAGE] || '';
    const sentenceSource = item.type === 'sentence' ? source : (item.example?.[SOURCE_LANGUAGE] || '');
    const entry = {
      word: source,
      translation: target,
      sentence: sentenceSource,
      addedAt: new Date().toISOString(),
      numberOfCorrectAnswers: {
        missingLetters: 0,
        missingWords: 0,
        chooseTranslation: 0,
        chooseWord: 0,
        memoryGame: 0,
        writeTranslation: 0,
        writeWord: 0,
      },
    } as const;

    const filePath = `${RNFS.DocumentDirectoryPath}/words.json`;
    try {
      let current: unknown = [];
      try {
        const content = await RNFS.readFile(filePath, 'utf8');
        current = JSON.parse(content);
      } catch {
        current = [];
      }
      const arr = Array.isArray(current) ? current : [];

      const normalize = (it: any) => {
        const base = it && typeof it === 'object' ? it : {};
        const noa = (base as any).numberOfCorrectAnswers || {};
        const safeNoa = {
          missingLetters: Math.max(0, Number(noa.missingLetters) || 0),
          missingWords: Math.max(0, Number(noa.missingWords) || 0),
          chooseTranslation: Math.max(0, Number(noa.chooseTranslation) || 0),
          chooseWord: Math.max(0, Number(noa.chooseWord) || 0),
          memoryGame: Math.max(0, Number(noa.memoryGame) || 0),
          writeTranslation: Math.max(0, Number(noa.writeTranslation) || 0),
          writeWord: Math.max(0, Number(noa.writeWord) || 0),
        };
        return { ...base, numberOfCorrectAnswers: safeNoa };
      };
      const normalized = arr.map(normalize);

      const exists = normalized.some(
        (it: any) => it && typeof it === 'object' && it.word === entry.word && (it.sentence || '') === (entry.sentence || '')
      );
      if (!exists) normalized.push(entry);

      await RNFS.writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf8');
      if (Platform.OS === 'android') {
        ToastAndroid.show(exists ? 'Already saved' : 'Saved', ToastAndroid.SHORT);
      } else {
        Alert.alert(exists ? 'Already saved' : 'Saved', exists ? 'This item is already in your list.' : 'Item added to your list.');
      }
    } catch {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to save', ToastAndroid.SHORT);
      } else {
        Alert.alert('Error', 'Failed to save the item.');
      }
    }
  };

  if (selectedCategory) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBackToCategories} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {(selectedCategory.emoji ? `${selectedCategory.emoji} ` : '') + (selectedCategory.name[TARGET_LANGUAGE] || selectedCategory.name[SOURCE_LANGUAGE] || selectedCategory.id)}
          </Text>
          <View style={{ width: 56 }} />
        </View>
        {selectedCategory.description ? (
          <Text style={styles.categoryDescription}>
            {selectedCategory.description[TARGET_LANGUAGE] || selectedCategory.description[SOURCE_LANGUAGE]}
          </Text>
        ) : null}

        <ScrollView contentContainerStyle={styles.list}>
          {selectedCategory.items.map((item) => {
            const source = item.text[SOURCE_LANGUAGE] || '';
            const target = item.text[TARGET_LANGUAGE] || '';
            const exampleSource = item.example?.[SOURCE_LANGUAGE];
            const exampleTarget = item.example?.[TARGET_LANGUAGE];
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemType}>{item.type === 'word' ? 'Word' : 'Sentence'}</Text>
                  <TouchableOpacity
                    onPress={() => saveItemToMyWords(item)}
                    style={styles.addBtnWrap}
                    accessibilityRole="button"
                    accessibilityLabel="Add to My Words"
                    hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  >
                    <Text style={styles.addBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemText}>
                  {source}
                  <Text style={styles.itemSeparator}> — </Text>
                  <Text style={styles.itemTarget}>{target}</Text>
                </Text>
                {(exampleSource || exampleTarget) ? (
                  <Text style={styles.itemExample}>
                    {(exampleSource || '')}
                    {exampleSource && exampleTarget ? ' — ' : ''}
                    {(exampleTarget || '')}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Categories</Text>
      <View style={styles.grid}>
        {CATEGORIES_DATA.categories.map((cat) => {
          const title = cat.name[TARGET_LANGUAGE] || cat.name[SOURCE_LANGUAGE] || cat.id;
          const subtitle = cat.name[SOURCE_LANGUAGE] && cat.name[TARGET_LANGUAGE] && cat.name[SOURCE_LANGUAGE] !== cat.name[TARGET_LANGUAGE]
            ? `${cat.name[SOURCE_LANGUAGE]} • ${cat.name[TARGET_LANGUAGE]}`
            : undefined;
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.gridItem}
              onPress={() => onOpenCategory(cat)}
              accessibilityRole="button"
              accessibilityLabel={title}
            >
              <Text style={styles.gridEmoji}>{cat.emoji || '•'}</Text>
              <Text numberOfLines={1} style={styles.gridTitle}>{title}</Text>
              {subtitle ? <Text numberOfLines={1} style={styles.gridSubtitle}>{subtitle}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
    width: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  categoryDescription: {
    color: '#666',
  },
  list: {
    gap: 12,
    paddingTop: 4,
    paddingBottom: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  itemHeaderRow: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemType: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  addBtnWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
    includeFontPadding: false,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSeparator: {
    color: '#999',
  },
  itemTarget: {
    color: '#007AFF',
    fontWeight: '700',
  },
  itemExample: {
    marginTop: 6,
    color: '#555',
  },
});

export default WordsByCategoriesScreen;


