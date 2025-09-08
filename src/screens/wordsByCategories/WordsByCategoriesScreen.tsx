import * as React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Platform, Alert, ToastAndroid, BackHandler, SafeAreaView, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WordCategory from './WordCategory';
import type { WordItem, WordCategoryType, LocalizedText } from '../../types/words';
import { useWordCategories } from '../../contexts/WordCategoriesContext';
import { useLoginGate } from '../../contexts/LoginGateContext';
import { useAuth } from '../../contexts/AuthContext';
import wordCountService from '../../services/wordCountService';

// moved WordCategory component to its own file

type CategoriesData = {
  languages: string[];
  categories: WordCategoryType[];
};

// Language name to code mapping (matching the server's API response)
const LANGUAGE_NAME_TO_CODE: Record<string, string> = {
  English: 'en',
  Spanish: 'es',
  Hebrew: 'he',
  French: 'fr',
  German: 'de',
  Italian: 'it',
  Portuguese: 'pt',
  Russian: 'ru',
  Hindi: 'hi',
  Polish: 'pl',
  Dutch: 'nl',
  Greek: 'el',
  Swedish: 'sv',
  Norwegian: 'no',
  Finnish: 'fi',
  Czech: 'cs',
  Ukrainian: 'uk',
  Thai: 'th',
  Vietnamese: 'vi',
};

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

function WordsByCategoriesScreen(): React.JSX.Element {
  const [selectedCategory, setSelectedCategory] = React.useState<WordCategoryType | null>(null);
  const navigation = useNavigation<any>();
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [nativeLanguage, setNativeLanguage] = React.useState<string | null>(null);
  const { categoriesData, loading, error, isFromCache, refreshCategories } = useWordCategories();
  const { showLoginGate } = useLoginGate();
  const { isAuthenticated } = useAuth();
  
  // Animation values for category cards
  const cardAnimations = React.useRef<Map<string, Animated.Value>>(new Map());

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

  // Convert language names to API language codes
  const getLanguageCode = (languageName: string | null): string => {
    if (!languageName) return 'en'; // Default to English
    return LANGUAGE_NAME_TO_CODE[languageName] || 'en';
  };

  const SOURCE_LANGUAGE = getLanguageCode(learningLanguage);
  const TARGET_LANGUAGE = getLanguageCode(nativeLanguage);

  // Debug logging for language mapping
  console.log('WordsByCategoriesScreen - Language mapping:');
  console.log('  learningLanguage from storage:', learningLanguage);
  console.log('  nativeLanguage from storage:', nativeLanguage);
  console.log('  SOURCE_LANGUAGE mapped to:', SOURCE_LANGUAGE);
  console.log('  TARGET_LANGUAGE mapped to:', TARGET_LANGUAGE);

  

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

  // Get or create animation value for a category
  const getCardAnimation = React.useCallback((categoryId: string) => {
    if (!cardAnimations.current.has(categoryId)) {
      cardAnimations.current.set(categoryId, new Animated.Value(1));
    }
    return cardAnimations.current.get(categoryId)!;
  }, []);

  // Animate card press
  const animateCardPress = React.useCallback((categoryId: string, callback: () => void) => {
    const animValue = getCardAnimation(categoryId);
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  }, [getCardAnimation]);

  const onOpenCategory = (category: WordCategoryType) => {
    console.log('onOpenCategory called with category:', category);
    console.log('Category items:', category.items);
    console.log('Category items length:', category.items?.length || 0);
    animateCardPress(category.id, () => {
      setSelectedCategory(category);
    });
  };

  const onBackToCategories = () => {
    setSelectedCategory(null);
  };

  const saveItemToMyWords = async (item: WordItem) => {
    // Check if user is authenticated, if not, check word count and show login gate
    if (!isAuthenticated) {
      await wordCountService.initialize();
      const currentCount = wordCountService.getWordCount();
      
      // Show login gate if this would be the 3rd word (after saving, count would be 3)
      if (currentCount.totalWordsAdded >= 2) {
        showLoginGate();
        return;
      }
    }

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
    
    const source = getTextInLanguage(item.text, SOURCE_LANGUAGE);
    const target = getTextInLanguage(item.text, TARGET_LANGUAGE);
    const sentenceSource = item.type === 'sentence' ? source : (item.example ? getTextInLanguage(item.example, SOURCE_LANGUAGE) : '');
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
      
      if (!exists) {
        normalized.push(entry);
        
        // Increment word count for categories
        if (!isAuthenticated) {
          await wordCountService.incrementCategoriesWords();
        }
      }

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
        onBackToCategories={onBackToCategories}
        saveItemToMyWords={saveItemToMyWords}
      />
    );
  }

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading categories...</Text>
            <Text style={styles.loadingSubtext}>Discovering new vocabulary topics</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error || !categoriesData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Ionicons name="cloud-offline" size={48} color="#94A3B8" style={styles.errorIcon} />
            <Text style={styles.errorText}>Unable to load categories</Text>
            <Text style={styles.errorSubtext}>
              Please check your internet connection and try again
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshCategories}>
              <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshCategories}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.screenTitle}>Word Categories</Text>
          <Text style={styles.screenSubtitle}>
            Explore vocabulary by topic and add words to your personal collection
          </Text>
        </View>
        <View style={styles.grid}>
          {categoriesData?.categories && Array.isArray(categoriesData.categories) ? (
            categoriesData.categories.map((cat: WordCategoryType) => {
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
              
              const title = getTextInLanguage(cat.name, SOURCE_LANGUAGE) || getTextInLanguage(cat.name, TARGET_LANGUAGE) || cat.id;
              const subtitle = getTextInLanguage(cat.name, SOURCE_LANGUAGE) && getTextInLanguage(cat.name, TARGET_LANGUAGE) && getTextInLanguage(cat.name, SOURCE_LANGUAGE) !== getTextInLanguage(cat.name, TARGET_LANGUAGE)
                ? `${getTextInLanguage(cat.name, SOURCE_LANGUAGE)} • ${getTextInLanguage(cat.name, TARGET_LANGUAGE)}`
                : undefined;
              return (
                <Animated.View
                  key={cat.id}
                  style={[
                    styles.gridItem,
                    {
                      transform: [{ scale: getCardAnimation(cat.id) }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => onOpenCategory(cat)}
                    accessibilityRole="button"
                    accessibilityLabel={title}
                    activeOpacity={0.8}
                  >
                    <View style={styles.gridIcon}>
                      <Ionicons 
                        name={getCategoryIcon(cat.emoji, cat.id)} 
                        size={28} 
                        color="#3B82F6" 
                      />
                    </View>
                    <Text numberOfLines={1} style={styles.gridTitle}>{title}</Text>
                    {subtitle ? <Text numberOfLines={1} style={styles.gridSubtitle}>{subtitle}</Text> : null}
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>No categories available</Text>
              <Text style={styles.errorSubtext}>
                {categoriesData ? 'Categories data is malformed' : 'Categories data is missing'}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={refreshCategories}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    // gap: 32,
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
  },
  headerSection: {
    marginBottom: 8,
  },
  screenTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.8,
    marginBottom: 8,
    textAlign: 'left',
    lineHeight: 42,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  cacheInfo: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
    marginTop: 24,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Enhanced shadow with more depth
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    // Subtle border for definition
    borderColor: '#F1F5F9',
    borderWidth: 1,
    // Add subtle gradient effect
    position: 'relative',
  },
  gridIcon: {
    marginBottom: 16,
    // Add subtle background circle for icons
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  gridTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0F172A',
    letterSpacing: -0.3,
    lineHeight: 22,
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  backText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    flex: 1,
    textAlign: 'center',
  },
  categoryDescription: {
    color: '#64748B',
    marginTop: 0,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  list: {
    gap: 20,
    paddingTop: 0,
    paddingBottom: 100,
    paddingHorizontal: 4,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginHorizontal: 4,
    // Enhanced shadow with more depth
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    // Subtle border
    borderColor: '#F1F5F9',
    borderWidth: 1,
    // Add subtle gradient effect
    position: 'relative',
  },
  itemHeaderRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemType: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBtnWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  addBtnText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24,
    includeFontPadding: false,
  },
  itemText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 26,
  },
  itemTextFlex: {
    flex: 1,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemWordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemWordEmojiImage: {
    width: 26,
    height: 26,
    marginRight: 10,
  },
  itemWordEmojiText: {
    marginRight: 10,
    fontSize: 22,
  },
  itemWordAvatar: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 10,
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
    color: '#94A3B8',
    fontWeight: '600',
  },
  itemTarget: {
    color: '#3B82F6',
    fontWeight: '800',
  },
  itemTranslationLine: {
    marginTop: 8,
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 24,
  },
  itemExample: {
    marginTop: 10,
    color: '#475569',
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
  },
  itemExampleTranslation: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 20,
    color: '#0F172A',
    fontWeight: '700',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 32,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorIcon: {
    marginBottom: 24,
  },
  errorText: {
    fontSize: 22,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  // WordCategory specific styles
  wordCategoryLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  wordCategoryErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  wordCategoryErrorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  wordCategoryRetryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  wordCategoryRetryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  speakerBtnWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemExampleRow: {
    flexDirection: 'column',
    gap: 6,
  },
});

export default WordsByCategoriesScreen;


