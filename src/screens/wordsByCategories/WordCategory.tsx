import * as React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, StyleProp, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import type { WordItem, WordCategoryType } from '../../types/words';

type Styles = {
  container: StyleProp<ViewStyle>;
  headerRow: StyleProp<ViewStyle>;
  backText: StyleProp<TextStyle>;
  headerTitle: StyleProp<TextStyle>;
  categoryDescription: StyleProp<TextStyle>;
  list: StyleProp<ViewStyle>;
  itemCard: StyleProp<ViewStyle>;
  itemHeaderRow: StyleProp<ViewStyle>;
  itemText: StyleProp<TextStyle>;
  itemTextFlex: StyleProp<ViewStyle>;
  itemWordRow: StyleProp<ViewStyle>;
  itemWordEmojiImage: StyleProp<ImageStyle>;
  itemWordEmojiText: StyleProp<TextStyle>;
  addBtnWrap: StyleProp<ViewStyle>;
  addBtnText: StyleProp<TextStyle>;
  itemSeparator: StyleProp<TextStyle>;
  itemTarget: StyleProp<TextStyle>;
  itemTranslationLine: StyleProp<TextStyle>;
  itemExample: StyleProp<TextStyle>;
  itemExampleTranslation: StyleProp<TextStyle>;
};

type Props = {
  selectedCategory: WordCategoryType;
  styles: Styles;
  SOURCE_LANGUAGE: string;
  TARGET_LANGUAGE: string;
  failedEmojiIds: Record<string, boolean>;
  setFailedEmojiIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onBackToCategories: () => void;
  saveItemToMyWords: (item: WordItem) => Promise<void> | void;
  getEmojiForWord: (word: string) => string;
  emojiToTwemojiUrl: (emoji: string) => string;
};

export default function WordCategory(props: Props): React.JSX.Element | null {
  const {
    selectedCategory,
    styles,
    SOURCE_LANGUAGE,
    TARGET_LANGUAGE,
    failedEmojiIds,
    setFailedEmojiIds,
    onBackToCategories,
    saveItemToMyWords,
    getEmojiForWord,
    emojiToTwemojiUrl,
  } = props;

  if (!selectedCategory) return null;

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
          const emoji = item.type === 'word' ? getEmojiForWord(source) : undefined;
          const emojiUrl = emoji ? emojiToTwemojiUrl(emoji) : undefined;
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeaderRow}>
                {item.type === 'sentence' ? (
                  <Text numberOfLines={1} style={[styles.itemText, styles.itemTextFlex]}>
                    {source} -
                  </Text>
                ) : (
                  <View style={[styles.itemTextFlex, styles.itemWordRow]}>
                    {emojiUrl && !failedEmojiIds[item.id] ? (
                      <Image
                        source={{ uri: emojiUrl }}
                        style={styles.itemWordEmojiImage}
                        onError={() => setFailedEmojiIds((prev) => ({ ...prev, [item.id]: true }))}
                      />
                    ) : (
                      <Text style={styles.itemWordEmojiText}>{emoji}</Text>
                    )}
                    <Text numberOfLines={1} style={styles.itemText}>
                      {source}
                      <Text style={styles.itemSeparator}> — </Text>
                      <Text style={styles.itemTarget}>{target}</Text>
                    </Text>
                  </View>
                )}
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
              {item.type === 'sentence' ? (
                <Text style={styles.itemTranslationLine}>{target}</Text>
              ) : null}
              {(exampleSource || exampleTarget) ? (
                <Text style={styles.itemExample}>
                  {exampleSource ? exampleSource : null}
                  {exampleSource && exampleTarget ? '\n' : null}
                  {exampleTarget ? (
                    <Text style={styles.itemExampleTranslation}>{exampleTarget}</Text>
                  ) : null}
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}


