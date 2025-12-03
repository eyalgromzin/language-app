import * as React from 'react';
import { ScrollView, View, Text, StyleProp, ViewStyle, TextStyle, ImageStyle, SafeAreaView, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { WordItem, WordCategoryType } from '../../types/words';
import { cachedApiService } from '../../services/cachedApiService';
import Tts from 'react-native-tts';
import { getTtsLangCode } from '../practice/common';
import CategoryHeader from './components/CategoryHeader';
import CategoryLoading from './components/CategoryLoading';
import CategoryError from './components/CategoryError';
import WordItemCard from './components/WordItemCard';
import { getTextInLanguage } from '../../utils/categoryUtils';


type Styles = {
  container: StyleProp<ViewStyle>;
  headerRow: StyleProp<ViewStyle>;
  backButton: StyleProp<ViewStyle>;
  backText: StyleProp<TextStyle>;
  headerTitleContainer: StyleProp<ViewStyle>;
  categoryIconContainer: StyleProp<ViewStyle>;
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
  const { t } = useTranslation();
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
  
  // Track which items have been added
  const [addedItems, setAddedItems] = React.useState<Set<string>>(new Set());

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
        await Tts.setDefaultRate(0.5);
      }
      
      Tts.speak(text);
    } catch (err) {
    }
  }, []);

  // Initialize TTS settings
  React.useEffect(() => {
    const initTTS = async () => {
      try {
        await Tts.setDefaultRate(0.5);
        // Note: setDefaultPitch may not be available on all platforms or TTS modules
        if (typeof (Tts as any).setDefaultPitch === 'function') {
          await (Tts as any).setDefaultPitch(1.0);
        } else {
        }
      } catch (err) {
        console.warn('[TTS] Failed to initialize default settings:', err);
      }
    };
    
    initTTS();
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
      // Mark item as added after animation completes
      setAddedItems(prev => new Set(prev).add(item.id));
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.container}>
          <CategoryHeader
            category={selectedCategory}
            styles={styles}
            SOURCE_LANGUAGE={SOURCE_LANGUAGE}
            TARGET_LANGUAGE={TARGET_LANGUAGE}
            onBackToCategories={onBackToCategories}
          />
          <CategoryLoading
            styles={styles}
            onBackToCategories={onBackToCategories}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !categoryData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.container}>
          <CategoryHeader
            category={selectedCategory}
            styles={styles}
            SOURCE_LANGUAGE={SOURCE_LANGUAGE}
            TARGET_LANGUAGE={TARGET_LANGUAGE}
            onBackToCategories={onBackToCategories}
          />
          <CategoryError
            error={error}
            styles={styles}
            onRetry={handleRetry}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Use categoryData if available, otherwise fallback to selectedCategory
  const displayCategory = categoryData || selectedCategory;
  
  if (!displayCategory || !displayCategory.items) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.container}>
        <CategoryHeader
          category={displayCategory}
          styles={styles}
          SOURCE_LANGUAGE={SOURCE_LANGUAGE}
          TARGET_LANGUAGE={TARGET_LANGUAGE}
          onBackToCategories={onBackToCategories}
        />
        <ScrollView contentContainerStyle={styles.list}>
          {displayCategory.description ? (
            <Text style={styles.categoryDescription}>
              {getTextInLanguage(displayCategory.description, TARGET_LANGUAGE) || getTextInLanguage(displayCategory.description, SOURCE_LANGUAGE)}
            </Text>
          ) : null}
          {displayCategory.items?.map((item) => {
            const source = getTextInLanguage(item.text, SOURCE_LANGUAGE);
            const target = getTextInLanguage(item.text, TARGET_LANGUAGE);
            const exampleSource = item.example ? getTextInLanguage(item.example, SOURCE_LANGUAGE) : '';
            const exampleTarget = item.example ? getTextInLanguage(item.example, TARGET_LANGUAGE) : '';
            
            // Debug logging for each item
            console.log(`Item ${item.id}: source="${source}", target="${target}", exampleSource="${exampleSource}", exampleTarget="${exampleTarget}"`);
            
            return (
              <WordItemCard
                key={item.id}
                item={item}
                styles={styles}
                SOURCE_LANGUAGE={SOURCE_LANGUAGE}
                TARGET_LANGUAGE={TARGET_LANGUAGE}
                onSpeakText={speakText}
                onAddToMyWords={handlePlusPress}
                rotationInterpolate={getRotationInterpolate(item.id)}
                isAdded={addedItems.has(item.id)}
              />
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}


