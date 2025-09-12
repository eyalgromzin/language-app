import type { LocalizedText } from '../types/words';

// Function to get appropriate icon for category with unique mapping
export const getCategoryIcon = (emoji: string | undefined, categoryId: string): string => {
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

// Handle inconsistent language keys in the data
export const getTextInLanguage = (textObj: LocalizedText, languageCode: string): string => {
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
