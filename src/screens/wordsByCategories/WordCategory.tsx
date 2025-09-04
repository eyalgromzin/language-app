import * as React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle, ImageStyle, SafeAreaView, Animated } from 'react-native';
import type { WordItem, WordCategoryType, LocalizedText } from '../../types/words';

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
  onBackToCategories: () => void;
  saveItemToMyWords: (item: WordItem) => Promise<void> | void;
};

export default function WordCategory(props: Props): React.JSX.Element | null {
  const {
    selectedCategory,
    styles,
    SOURCE_LANGUAGE,
    TARGET_LANGUAGE,
    onBackToCategories,
    saveItemToMyWords,
  } = props;

  // Debug logging
  console.log('WordCategory render - selectedCategory:', selectedCategory);
  console.log('WordCategory render - items length:', selectedCategory?.items?.length || 0);
  console.log('WordCategory render - SOURCE_LANGUAGE:', SOURCE_LANGUAGE);
  console.log('WordCategory render - TARGET_LANGUAGE:', TARGET_LANGUAGE);
  console.log('WordCategory render - first item text keys:', selectedCategory?.items?.[0]?.text ? Object.keys(selectedCategory.items[0].text) : 'no items');
  console.log('WordCategory render - first item example keys:', selectedCategory?.items?.[0]?.example ? Object.keys(selectedCategory.items[0].example) : 'no example');

  // Handle inconsistent language keys in the data
  const getTextInLanguage = (textObj: LocalizedText, languageCode: string): string => {
    // First try the exact language code
    if (textObj[languageCode]) return textObj[languageCode];
    
    // Then try common aliases
    if (languageCode === 'es' && textObj['Spanish']) return textObj['Spanish'];
    if (languageCode === 'en' && textObj['English']) return textObj['English'];
    if (languageCode === 'he' && textObj['Hebrew']) return textObj['Hebrew'];
    
    // Finally, try to find any available text
    const availableKeys = Object.keys(textObj);
    if (availableKeys.length > 0) {
      return textObj[availableKeys[0]] || '';
    }
    
    return '';
  };

  // Animation value for plus button rotation
  const spinValue = React.useRef(new Animated.Value(0)).current;

  const spinPlus = React.useCallback((onComplete?: () => void) => {
    // Reset to 0 and animate to 360 degrees
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(onComplete);
  }, [spinValue]);

  // Create rotation interpolate
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePlusPress = React.useCallback((item: WordItem) => {
    spinPlus(() => {
      saveItemToMyWords(item);
    });
  }, [spinPlus, saveItemToMyWords]);

  if (!selectedCategory) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBackToCategories} accessibilityRole="button" accessibilityLabel="Back" activeOpacity={0.7}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {(selectedCategory.emoji ? `${selectedCategory.emoji} ` : '') + (getTextInLanguage(selectedCategory.name, SOURCE_LANGUAGE) || getTextInLanguage(selectedCategory.name, TARGET_LANGUAGE) || selectedCategory.id)}
        </Text>
        <View style={{ width: 56 }} />
      </View>
      {selectedCategory.description ? (
        <Text style={styles.categoryDescription}>
          {getTextInLanguage(selectedCategory.description, SOURCE_LANGUAGE) || getTextInLanguage(selectedCategory.description, TARGET_LANGUAGE)}
        </Text>
      ) : null}

      <ScrollView contentContainerStyle={styles.list}>
        {selectedCategory.items.map((item) => {
          const source = getTextInLanguage(item.text, SOURCE_LANGUAGE);
          const target = getTextInLanguage(item.text, TARGET_LANGUAGE);
          const exampleSource = item.example ? getTextInLanguage(item.example, SOURCE_LANGUAGE) : '';
          const exampleTarget = item.example ? getTextInLanguage(item.example, TARGET_LANGUAGE) : '';
          
          // Debug logging for each item
          console.log(`Item ${item.id}: source="${source}", target="${target}", exampleSource="${exampleSource}", exampleTarget="${exampleTarget}"`);
          
          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeaderRow}>
                {item.type === 'sentence' ? (
                  <Text numberOfLines={1} style={[styles.itemText, styles.itemTextFlex]}>
                    {source} -
                  </Text>
                ) : (
                  <View style={styles.itemTextFlex}>
                    <Text numberOfLines={1} style={styles.itemText}>
                      {source}
                      <Text style={styles.itemSeparator}> — </Text>
                      <Text style={styles.itemTarget}>{target}</Text>
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => handlePlusPress(item)}
                  style={styles.addBtnWrap}
                  accessibilityRole="button"
                  accessibilityLabel="Add to My Words"
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                  activeOpacity={0.85}
                >
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Text style={styles.addBtnText}>+</Text>
                  </Animated.View>
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
    </SafeAreaView>
  );
}


