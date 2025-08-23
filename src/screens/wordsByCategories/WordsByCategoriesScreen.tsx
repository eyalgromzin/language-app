import * as React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform, Alert, ToastAndroid, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WordCategory from './WordCategory';
import type { WordItem, WordCategoryType, LocalizedText } from '../../types/words';

 

// moved WordCategory component to its own file

type CategoriesData = {
  languages: string[];
  categories: WordCategoryType[];
};

const CATEGORIES_DATA: CategoriesData = require('../../userData/wordCategories.json');

function WordsByCategoriesScreen(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = React.useState<WordCategoryType | null>(null);
  const navigation = useNavigation<any>();
  const [failedEmojiIds, setFailedEmojiIds] = React.useState<Record<string, boolean>>({});
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const entries = await AsyncStorage.multiGet(['language.learning', 'language.native']);
          if (!mounted) return;
          const map = Object.fromEntries(entries);
          const learningRaw = map['language.learning'];
          const nativeRaw = map['language.native'];
          const learningVal = typeof learningRaw === 'string' && learningRaw.trim().length > 0 ? learningRaw : null;
          const nativeVal = typeof nativeRaw === 'string' && nativeRaw.trim().length > 0 ? nativeRaw : null;
          setLearningLanguage(learningVal);
          setNativeLanguage(nativeVal);
        } catch {
          if (!mounted) return;
          setLearningLanguage(null);
          setNativeLanguage(null);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const SOURCE_LANGUAGE = learningLanguage || 'English';
  const TARGET_LANGUAGE = nativeLanguage || 'Spanish';

  const getEmojiForWord = React.useCallback((word: string) => {
    const w = (word || '').trim().toLowerCase();
    switch (w) {
      case 'hello': return '👋';
      case 'good morning': return '🌞';
      case 'apple': return '🍎';
      case 'water': return '💧';
      case 'ticket': return '🎫';
      case 'hotel': return '🏨';
      case 'zero': return '0️⃣';
      case 'one': return '1️⃣';
      case 'two': return '2️⃣';
      case 'three': return '3️⃣';
      case 'ten': return '🔟';
      case 'hundred': return '💯';
      case 'i': return '👤';
      case 'you': return '🫵';
      case 'he': return '👨';
      case 'she': return '👩';
      case 'it': return '❓';
      case 'we': return '👥';
      case 'they': return '👥';
      case 'them': return '👥';
      case 'shirt': return '👕';
      case 'pants': return '👖';
      case 'shoes': return '👟';
      case 'dress': return '👗';
      case 'jacket': return '🧥';
      case 'today': return '📅';
      case 'yesterday': return '🕰️';
      case 'tomorrow': return '🌅';
      case 'week': return '🗓️';
      case 'hour': return '⏰';
      case 'happy': return '😀';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'tired': return '😴';
      case 'scared': return '😱';
      case 'mother': return '👩';
      case 'father': return '👨';
      case 'brother': return '👦';
      case 'sister': return '👧';
      case 'family': return '👪';
      case 'house': return '🏠';
      case 'room': return '🚪';
      case 'kitchen': return '🍳';
      case 'bathroom': return '🚽';
      case 'bed': return '🛏️';
      default: return '🔤';
    }
  }, []);

  const emojiToTwemojiUrl = React.useCallback((emoji: string) => {
    const codePoints = Array.from(emoji)
      .map((c) => c.codePointAt(0))
      .filter((cp): cp is number => typeof cp === 'number')
      .map((cp) => cp.toString(16))
      .join('-');
    return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoints}.png`;
  }, []);

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

  useFocusEffect(
    React.useCallback(() => {
      if (!selectedCategory) return;

      const onHardwareBack = () => {
        setSelectedCategory(null);
        return true;
      };

      const backSub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
      const navSub = navigation.addListener('beforeRemove', (e: any) => {
        if (!selectedCategory) return;
        e.preventDefault();
        setSelectedCategory(null);
      });

      return () => {
        backSub.remove();
        navSub();
      };
    }, [selectedCategory, navigation])
  );

  const onOpenCategory = (category: WordCategoryType) => {
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
      <WordCategory
        selectedCategory={selectedCategory}
        styles={styles as any}
        SOURCE_LANGUAGE={SOURCE_LANGUAGE}
        TARGET_LANGUAGE={TARGET_LANGUAGE}
        failedEmojiIds={failedEmojiIds}
        setFailedEmojiIds={setFailedEmojiIds}
        onBackToCategories={onBackToCategories}
        saveItemToMyWords={saveItemToMyWords}
        getEmojiForWord={getEmojiForWord}
        emojiToTwemojiUrl={emojiToTwemojiUrl}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.screenTitle}>Categories</Text>
      <View style={styles.grid}>
        {CATEGORIES_DATA.categories.map((cat) => {
          const title = cat.name[SOURCE_LANGUAGE] || cat.name[TARGET_LANGUAGE] || cat.id;
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
  itemTextFlex: {
    flex: 1,
    paddingRight: 8,
  },
  itemWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemWordEmojiImage: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  itemWordEmojiText: {
    marginRight: 8,
    fontSize: 18,
  },
  itemWordAvatar: {
    width: 22,
    height: 22,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemWordAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    includeFontPadding: false,
  },
  itemSeparator: {
    color: '#999',
  },
  itemTarget: {
    color: '#007AFF',
    fontWeight: '700',
  },
  itemTranslationLine: {
    marginTop: 4,
    color: '#007AFF',
    fontWeight: '700',
  },
  itemExample: {
    marginTop: 6,
    color: '#555',
  },
  itemExampleTranslation: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default WordsByCategoriesScreen;


