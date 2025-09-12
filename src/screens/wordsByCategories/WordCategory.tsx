import * as React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle, ImageStyle, SafeAreaView, Animated, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import type { WordItem, WordCategoryType, LocalizedText } from '../../types/words';
import { cachedApiService } from '../../services/cachedApiService';
import Tts from 'react-native-tts';
import { getTtsLangCode } from '../practice/common';

// Function to get appropriate icon for category with unique mapping
const getCategoryIcon = (emoji: string | undefined, categoryId: string): string => {
  // First, try to get icon based on emoji with unique mappings for actual app emojis
  if (emoji) {
    const emojiToIcon: Record<string, string> = {
      // ACTUAL EMOJIS USED IN THE APP - each unique
      '👋': 'hand-left',        // greetings
      '🍽️': 'restaurant',       // food_and_drink
      '✈️': 'airplane',         // travel
      '🔢': 'calculator',       // numbers
      '🧍': 'person',           // pronouns
      '👕': 'shirt',            // clothing
      '⏰': 'time',             // time
      '😊': 'happy',            // emotions
      '👪': 'people',           // family
      '🏠': 'home',             // home
      '🐾': 'paw',              // animals
      '🎨': 'color-palette',    // colors
      '👤': 'person-circle',    // body_parts
      '🌤️': 'partly-sunny',     // weather
      '🚗': 'car',              // transportation
      '💼': 'briefcase',        // jobs
      '🎯': 'target',           // hobbies
      '🎓': 'school',           // school
      '🌿': 'leaf',             // nature
      '🏃': 'walk',             // verbs
      
      // Additional common emojis for completeness
      '🍎': 'nutrition',
      '🍕': 'pizza',
      '🍔': 'fast-food',
      '🥗': 'leaf',
      '☕': 'cafe',
      '🍰': 'ice-cream',
      '🥤': 'wine',
      '🍞': 'restaurant',
      '🥕': 'carrot',
      '🍌': 'banana',
      '🍇': 'grapes',
      '🍊': 'orange',
      '🍓': 'strawberry',
      
      // People & Family - each unique
      '👨': 'man',
      '👩': 'woman',
      '👶': 'baby',
      '👴': 'elderly',
      '👵': 'elderly-woman',
      '👦': 'boy',
      '👧': 'girl',
      
      // Animals - each unique
      '🐕': 'paw',
      '🐱': 'cat',
      '🐦': 'bird',
      '🐰': 'rabbit',
      '🐸': 'frog',
      '🐟': 'fish',
      '🐝': 'bug',
      '🦋': 'butterfly',
      '🐴': 'horse',
      '🐄': 'cow',
      '🐷': 'pig',
      '🐑': 'sheep',
      
      // Transportation - each unique
      '🚌': 'bus',
      '🚲': 'bicycle',
      '🚢': 'boat',
      '🚂': 'train',
      '🏍️': 'bike',
      '🚁': 'airplane',
      
      // Clothing - each unique
      '👗': 'dress',
      '👟': 'football',
      '👠': 'high-heel',
      '👒': 'hat',
      '🧥': 'coat',
      '👖': 'pants',
      '🧦': 'sock',
      
      // Weather & Nature - each unique
      '🌞': 'sunny',
      '🌧️': 'rainy',
      '❄️': 'snow',
      '⛅': 'cloudy',
      '🌪️': 'tornado',
      '🌈': 'rainbow',
      '🌺': 'flower',
      '🌳': 'tree',
      '🌊': 'water',
      '🏔️': 'mountain',
      
      // Activities & Sports - each unique
      '⚽': 'football',
      '🏀': 'basketball',
      '🎮': 'game-controller',
      '🎵': 'musical-notes',
      '📚': 'book',
      '✏️': 'pencil',
      '🎭': 'theater-masks',
      '🎪': 'circus',
      '🏊': 'swimmer',
      '🚴': 'bicycle',
      
      // Technology - each unique
      '💻': 'laptop',
      '📱': 'phone-portrait',
      '📷': 'camera',
      '📺': 'tv',
      '🎧': 'headset',
      '⌚': 'watch',
      '🔋': 'battery-charging',
      '💾': 'save',
      
      // Objects & Tools - each unique
      '🌍': 'globe',
      '🏥': 'medical',
      '🏫': 'school',
      '🏪': 'storefront',
      '🏢': 'business',
      '🏦': 'card',
      '🏨': 'bed',
      '🏰': 'castle',
      '⛪': 'church',
      '🕌': 'mosque',
      '🕍': 'synagogue',
      
      // Body Parts - each unique
      '👁️': 'eye',
      '👂': 'ear',
      '👃': 'nose',
      '👄': 'chatbubble',
      '👅': 'tongue',
      '🦷': 'tooth',
      '🦶': 'footsteps',
      
      // Colors & Shapes - each unique
      '🔴': 'ellipse',
      '🔵': 'ellipse-outline',
      '🟢': 'ellipse',
      '🟡': 'ellipse',
      '🟣': 'ellipse',
      '⚫': 'ellipse',
      '⚪': 'ellipse-outline',
      '🟤': 'ellipse',
      
      // Miscellaneous - each unique
      '💡': 'bulb',
      '🔑': 'key',
      '🎁': 'gift',
      '🎈': 'balloon',
      '🎊': 'confetti',
      '🎉': 'confetti-ball',
      '⭐': 'star',
      '❤️': 'heart',
      '💎': 'diamond',
      '💰': 'cash',
      '🔒': 'lock-closed',
      '🔓': 'lock-open',
    };
    
    if (emojiToIcon[emoji]) {
      return emojiToIcon[emoji];
    }
  }
  
  // Fallback: Default icons based on category ID patterns with unique mappings
  const categoryIdLower = categoryId.toLowerCase();
  if (categoryIdLower.includes('food') || categoryIdLower.includes('eat') || categoryIdLower.includes('meal')) return 'restaurant';
  if (categoryIdLower.includes('family') || categoryIdLower.includes('parent')) return 'people';
  if (categoryIdLower.includes('body') || categoryIdLower.includes('health')) return 'body';
  if (categoryIdLower.includes('clothes') || categoryIdLower.includes('wear') || categoryIdLower.includes('dress')) return 'shirt';
  if (categoryIdLower.includes('house') || categoryIdLower.includes('home') || categoryIdLower.includes('room')) return 'home';
  if (categoryIdLower.includes('animal') || categoryIdLower.includes('pet')) return 'paw';
  if (categoryIdLower.includes('color') || categoryIdLower.includes('paint')) return 'color-palette';
  if (categoryIdLower.includes('number') || categoryIdLower.includes('count') || categoryIdLower.includes('math')) return 'calculator';
  if (categoryIdLower.includes('time') || categoryIdLower.includes('clock') || categoryIdLower.includes('hour')) return 'time';
  if (categoryIdLower.includes('weather') || categoryIdLower.includes('rain') || categoryIdLower.includes('sun')) return 'partly-sunny';
  if (categoryIdLower.includes('sport') || categoryIdLower.includes('game') || categoryIdLower.includes('play')) return 'football';
  if (categoryIdLower.includes('music') || categoryIdLower.includes('song') || categoryIdLower.includes('sound')) return 'musical-notes';
  if (categoryIdLower.includes('book') || categoryIdLower.includes('read') || categoryIdLower.includes('learn')) return 'book';
  if (categoryIdLower.includes('car') || categoryIdLower.includes('drive') || categoryIdLower.includes('vehicle')) return 'car';
  if (categoryIdLower.includes('work') || categoryIdLower.includes('job') || categoryIdLower.includes('office')) return 'briefcase';
  if (categoryIdLower.includes('school') || categoryIdLower.includes('education') || categoryIdLower.includes('study')) return 'school';
  if (categoryIdLower.includes('money') || categoryIdLower.includes('buy') || categoryIdLower.includes('shop')) return 'card';
  if (categoryIdLower.includes('travel') || categoryIdLower.includes('trip') || categoryIdLower.includes('vacation')) return 'airplane';
  if (categoryIdLower.includes('nature') || categoryIdLower.includes('tree') || categoryIdLower.includes('plant')) return 'leaf';
  if (categoryIdLower.includes('water') || categoryIdLower.includes('sea') || categoryIdLower.includes('ocean')) return 'water';
  
  // Ultimate fallback
  return 'book';
};

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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBackToCategories} accessibilityRole="button" accessibilityLabel={t('screens.categories.wordCategories.back')} activeOpacity={0.7}>
              <Text style={styles.backText}>‹ {t('screens.categories.wordCategories.back')}</Text>
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {t('common.loading')}
            </Text>
            <View style={{ width: 56 }} />
          </View>
          <View style={styles.wordCategoryLoadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>
              {t('screens.categories.wordCategories.loadingCategoryData')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && !categoryData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBackToCategories} accessibilityRole="button" accessibilityLabel={t('screens.categories.wordCategories.back')} activeOpacity={0.7}>
              <Text style={styles.backText}>‹ {t('screens.categories.wordCategories.back')}</Text>
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {t('screens.categories.wordCategories.error')}
            </Text>
            <View style={{ width: 56 }} />
          </View>
          <View style={styles.wordCategoryErrorContainer}>
            <Text style={styles.wordCategoryErrorText}>
              {error}
            </Text>
            <TouchableOpacity style={styles.wordCategoryRetryButton} onPress={handleRetry}>
              <Text style={styles.wordCategoryRetryButtonText}>{t('screens.categories.wordCategories.retry')}</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBackToCategories} accessibilityRole="button" accessibilityLabel={t('screens.categories.wordCategories.back')} activeOpacity={0.7}>
            <View style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color="#3B82F6" />
              <Text style={styles.backText}>{t('screens.categories.wordCategories.back')}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.categoryIconContainer}>
              <Ionicons 
                name={getCategoryIcon(displayCategory.emoji, displayCategory.id)} 
                size={24} 
                color="#3B82F6" 
              />
            </View>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {getTextInLanguage(displayCategory.name, SOURCE_LANGUAGE) || getTextInLanguage(displayCategory.name, TARGET_LANGUAGE) || displayCategory.id}
            </Text>
          </View>
          <View style={{ width: 80 }} />
        </View>
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
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeaderRow}>
                                 {item.type === 'sentence' ? (
                   <View style={styles.itemTextFlex}>
                     <TouchableOpacity
                       onPress={() => speakText(source, SOURCE_LANGUAGE)}
                       style={[styles.speakerBtnWrap, { marginRight: 12 }]}
                       hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                       accessibilityRole="button"
                       accessibilityLabel={t('screens.categories.wordCategories.speakSourceText')}
                       activeOpacity={0.7}
                     >
                       <Ionicons name="volume-medium" size={16} color="#64748B" />
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
                       accessibilityLabel={t('screens.categories.wordCategories.speakSourceText')}
                       activeOpacity={0.7}
                     >
                       <Ionicons name="volume-medium" size={16} color="#64748B" />
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
                  accessibilityLabel={t('screens.categories.wordCategories.addToMyWords')}
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


