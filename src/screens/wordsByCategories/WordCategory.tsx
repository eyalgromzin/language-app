import * as React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle, ImageStyle, SafeAreaView, Animated, ActivityIndicator } from 'react-native';
import type { WordItem, WordCategoryType, LocalizedText } from '../../types/words';
import { cachedApiService } from '../../services/cachedApiService';
import Tts from 'react-native-tts';
import { getTtsLangCode } from '../practice/common';

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
  wordCategoryLoadingContainer: StyleProp<ViewStyle>;
  loadingText: StyleProp<TextStyle>;
  wordCategoryErrorContainer: StyleProp<ViewStyle>;
  wordCategoryErrorText: StyleProp<TextStyle>;
  wordCategoryRetryButton: StyleProp<ViewStyle>;
  wordCategoryRetryButtonText: StyleProp<TextStyle>;
  speakerBtnWrap: StyleProp<ViewStyle>;
  speakerIcon: StyleProp<TextStyle>;
  itemExampleRow: StyleProp<ViewStyle>;
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

  const [categoryData, setCategoryData] = React.useState<WordCategoryType | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isFromCache, setIsFromCache] = React.useState<boolean>(false);

  // Store animation values for each item
  const animationValues = React.useRef<Map<string, Animated.Value>>(new Map());

  // Function to get or create animation value for an item
  const getAnimationValue = React.useCallback((itemId: string) => {
    if (!animationValues.current.has(itemId)) {
      animationValues.current.set(itemId, new Animated.Value(0));
    }
    return animationValues.current.get(itemId)!;
  }, []);

  // Function to speak text using TTS
  const speakText = React.useCallback(async (text: string, language: string) => {
    if (!text) return;
    
    try {
      Tts.stop();
      
      // Set TTS language for proper accent
      const langCode = getTtsLangCode(language);
      if (langCode) {
        await Tts.setDefaultLanguage(langCode);
      }
      
      Tts.speak(text);
    } catch (err) {
      console.error('TTS error:', err);
    }
  }, []);

  // Fetch category data on component mount
  React.useEffect(() => {
    const fetchCategoryData = async () => {
      if (!selectedCategory?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('[WordCategory] Fetching category data for ID:', selectedCategory.id);
        
        // Try to get from cache first, then from server
        const data = await cachedApiService.getWordCategoryById(selectedCategory.id);
        
        if (data) {
          console.log('[WordCategory] Category data received:', data);
          setCategoryData(data);
          setIsFromCache(true); // Data was loaded from cache
        } else {
          // If no cached data, use the passed selectedCategory
          console.log('[WordCategory] Using passed category data');
          setCategoryData(selectedCategory);
          setIsFromCache(false);
        }
      } catch (err) {
        console.error('[WordCategory] Failed to fetch category data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load category data');
        // Fallback to passed data
        setCategoryData(selectedCategory);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [selectedCategory?.id]);

  // Debug logging
  console.log('WordCategory render - selectedCategory:', selectedCategory);
  console.log('WordCategory render - categoryData:', categoryData);
  console.log('WordCategory render - items length:', categoryData?.items?.length || 0);
  console.log('WordCategory render - SOURCE_LANGUAGE:', SOURCE_LANGUAGE);
  console.log('WordCategory render - TARGET_LANGUAGE:', TARGET_LANGUAGE);
  console.log('WordCategory render - isFromCache:', isFromCache);

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
  const spinPlus = React.useCallback((itemId: string, onComplete?: () => void) => {
    const spinValue = getAnimationValue(itemId);
    // Reset to 0 and animate to 360 degrees
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(onComplete);
  }, [getAnimationValue]);

  // Function to get rotation interpolate for an item
  const getRotationInterpolate = React.useCallback((itemId: string) => {
    const spinValue = getAnimationValue(itemId);
    return spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
  }, [getAnimationValue]);

  const handlePlusPress = React.useCallback((item: WordItem) => {
    spinPlus(item.id, () => {
      saveItemToMyWords(item);
    });
  }, [spinPlus, saveItemToMyWords]);

  const handleRetry = async () => {
    if (!selectedCategory?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Clear cache for this specific category to force fresh data
      await cachedApiService.clearEndpointCache('WORD_CATEGORY_BY_ID');
      
      const data = await cachedApiService.getWordCategoryById(selectedCategory.id);
      if (data) {
        setCategoryData(data);
        setIsFromCache(false);
      } else {
        setCategoryData(selectedCategory);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load category data');
      setCategoryData(selectedCategory);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBackToCategories} accessibilityRole="button" accessibilityLabel="Back" activeOpacity={0.7}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.headerTitle}>
              Loading...
            </Text>
            <View style={{ width: 56 }} />
          </View>
          <View style={styles.wordCategoryLoadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              Loading category data...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !categoryData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBackToCategories} accessibilityRole="button" accessibilityLabel="Back" activeOpacity={0.7}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.headerTitle}>
              Error
            </Text>
            <View style={{ width: 56 }} />
          </View>
          <View style={styles.wordCategoryErrorContainer}>
            <Text style={styles.wordCategoryErrorText}>
              {error}
            </Text>
            <TouchableOpacity style={styles.wordCategoryRetryButton} onPress={handleRetry}>
              <Text style={styles.wordCategoryRetryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Use categoryData if available, otherwise fallback to selectedCategory
  const displayCategory = categoryData || selectedCategory;
  
  if (!displayCategory || !displayCategory.items) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBackToCategories} accessibilityRole="button" accessibilityLabel="Back" activeOpacity={0.7}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {(displayCategory.emoji ? `${displayCategory.emoji} ` : '') + (getTextInLanguage(displayCategory.name, SOURCE_LANGUAGE) || getTextInLanguage(displayCategory.name, TARGET_LANGUAGE) || displayCategory.id)}
        </Text>
        <View style={{ width: 56 }} />
      </View>
      {displayCategory.description ? (
        <Text style={styles.categoryDescription}>
          {getTextInLanguage(displayCategory.description, TARGET_LANGUAGE) || getTextInLanguage(displayCategory.description, SOURCE_LANGUAGE)}
        </Text>
      ) : null}

      <ScrollView contentContainerStyle={styles.list}>
        {displayCategory.items?.map((item) => {
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
                   <View style={styles.itemTextFlex}>
                     <TouchableOpacity
                       onPress={() => speakText(source, SOURCE_LANGUAGE)}
                       style={[styles.speakerBtnWrap, { marginRight: 12 }]}
                       hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                       accessibilityRole="button"
                       accessibilityLabel="Speak source text"
                       activeOpacity={0.7}
                     >
                       <Text style={styles.speakerIcon}>🔊</Text>
                     </TouchableOpacity>
                     <Text numberOfLines={1} style={styles.itemText}>
                       {source} -
                     </Text>
                   </View>
                 ) : (
                   <View style={styles.itemTextFlex}>
                     <TouchableOpacity
                       onPress={() => speakText(source, SOURCE_LANGUAGE)}
                       style={[styles.speakerBtnWrap, { marginRight: 8 }]}
                       hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                       accessibilityRole="button"
                       accessibilityLabel="Speak source text"
                       activeOpacity={0.7}
                     >
                       <Text style={styles.speakerIcon}>🔊</Text>
                     </TouchableOpacity>
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
                  <Animated.View style={{ transform: [{ rotate: getRotationInterpolate(item.id) }] }}>
                    <Text style={styles.addBtnText}>+</Text>
                  </Animated.View>
                </TouchableOpacity>
              </View>
                             {item.type === 'sentence' ? (
                 <Text style={styles.itemTranslationLine}>{target}</Text>
               ) : null}
                             {(exampleSource || exampleTarget) ? (
                 <View style={styles.itemExampleRow}>
                   {exampleSource && (
                     <Text style={styles.itemExample}>{exampleSource}</Text>
                   )}
                   {exampleTarget && (
                     <Text style={styles.itemExample}>
                       {exampleTarget}
                     </Text>
                   )}
                 </View>
               ) : null}
            </View>
          );
        })}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}


