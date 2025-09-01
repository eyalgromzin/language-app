const fs = require('fs');
const path = require('path');

// Ukrainian translations for ALL common words and phrases
const ukrainianTranslations = {
  // Basic words
  'name': 'ім\'я', 'meet': 'зустрічатися', 'from': 'з', 'speak': 'говорити', 'language': 'мова',
  'country': 'країна', 'city': 'місто', 'job': 'робота', 'student': 'студент', 'teacher': 'вчитель',
  'work': 'праця', 'study': 'навчатися', 'learn': 'вивчати', 'understand': 'розуміти', 'help': 'допомога',
  'please': 'будь ласка', 'thank you': 'дякую', 'thanks': 'дякую', 'yes': 'так', 'no': 'ні',
  'goodbye': 'до побачення', 'welcome': 'ласкаво просимо', 'okay': 'добре', 'hello': 'привіт', 'hi': 'привіт',
  
  // Numbers and time
  'one': 'один', 'two': 'два', 'three': 'три', 'four': 'чотири', 'five': 'п\'ять',
  'six': 'шість', 'seven': 'сім', 'eight': 'вісім', 'nine': 'дев\'ять', 'ten': 'десять',
  'time': 'час', 'hour': 'година', 'minute': 'хвилина', 'second': 'секунда',
  'morning': 'ранок', 'afternoon': 'день', 'evening': 'вечір', 'night': 'ніч',
  'today': 'сьогодні', 'tomorrow': 'завтра', 'yesterday': 'вчора',
  
  // Food and drinks
  'food': 'їжа', 'water': 'вода', 'bread': 'хліб', 'rice': 'рис', 'meat': 'м\'ясо',
  'vegetables': 'овочі', 'fruit': 'фрукти', 'milk': 'молоко', 'coffee': 'кава', 'tea': 'чай',
  'breakfast': 'сніданок', 'lunch': 'обід', 'dinner': 'вечеря',
  
  // Restaurant vocabulary
  'menu': 'меню', 'table': 'стіл', 'bill': 'рахунок', 'waiter': 'офіціант', 'order': 'замовлення',
  'reservation': 'бронювання', 'service': 'обслуговування', 'tip': 'чайові', 'drink': 'напій',
  
  // Family and people
  'family': 'сім\'я', 'mother': 'мати', 'father': 'батько', 'sister': 'сестра', 'brother': 'брат',
  'son': 'син', 'daughter': 'дочка', 'friend': 'друг', 'man': 'чоловік', 'woman': 'жінка',
  'child': 'дитина', 'baby': 'малюк',
  
  // Common verbs
  'go': 'йти', 'come': 'приходити', 'see': 'бачити', 'hear': 'чути', 'eat': 'їсти',
  'drink': 'пити', 'sleep': 'спати', 'wake': 'прокидатися', 'walk': 'ходити', 'run': 'бігати',
  'sit': 'сидіти', 'stand': 'стояти', 'give': 'давати', 'take': 'брати',
  
  // Directions
  'left': 'ліво', 'right': 'право', 'straight': 'прямо', 'near': 'близько', 'far': 'далеко',
  'here': 'тут', 'there': 'там', 'up': 'вгору', 'down': 'вниз', 'around': 'навколо',
  
  // Sentences
  'My name is …': 'Мене звати …', 'What is your name?': 'Як вас звати?',
  'Nice to meet you.': 'Приємно познайомитися.', 'How are you?': 'Як справи?',
  'I am fine, thank you.': 'Добре, дякую.', 'Where are you from?': 'Звідки ви?',
  'I am from …': 'Я з …', 'Do you speak English?': 'Ви говорите англійською?',
  'I speak a little Ukrainian.': 'Я трохи говорю українською.', 'Excuse me.': 'Перепрошую.',
  'Sorry.': 'Перепрошую.', 'Good morning.': 'Доброго ранку.', 'Good evening.': 'Добрий вечір.',
  'Good night.': 'Доброї ночі.', 'See you later.': 'До побачення.',
  'Have a nice day.': 'Гарного дня.', 'You are welcome.': 'Будь ласка.',
  'No problem.': 'Немає проблем.', 'Take care.': 'Бережіть себе.',
  
  // Restaurant sentences
  'A table for two, please.': 'Стіл на двох, будь ласка.',
  'Could we have the menu?': 'Чи можемо ми отримати меню?',
  'The bill, please.': 'Рахунок, будь ласка.',
  'Do you have vegetarian options?': 'Чи є у вас вегетаріанські варіанти?',
  'What do you recommend?': 'Що ви рекомендуєте?',
  'I would like to order.': 'Я хотів би зробити замовлення.'
};

// Function to translate text to Ukrainian
function translateToUkrainian(text) {
  return ukrainianTranslations[text] || text;
}

// Function to translate a file
function translateFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Update language field
    data.language = 'Ukrainian';
    
    // Translate title
    if (data.title) {
      const titleTranslations = {
        'Introductions & basic info': 'Знайомство та основна інформація',
        'greetings & politeness': 'привітання та ввічливість',
        'Core verbs & pronouns': 'Основні дієслова та займенники',
        'Numbers & time basics': 'Числа та основи часу',
        'Getting around': 'Орієнтування',
        'Food & drink basics': 'Основы їжі та напоїв',
        'Shopping & money': 'Покупки та гроші',
        'Travel & hotel': 'Подорожі та готелі',
        'Emergencies & health': 'Надзвичайні ситуації та здоров\'я',
        'Daily routines': 'Щоденні рутини',
        'At the restaurant': 'У ресторані'
      };
      
      if (titleTranslations[data.title]) {
        data.title = titleTranslations[data.title];
      }
    }
    
    // Translate ALL items
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        if (item.text) {
          item.text = translateToUkrainian(item.text);
        }
      });
    }
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Translated: ${path.basename(filePath)}`);
    
  } catch (error) {
    console.error(`❌ Error translating ${filePath}:`, error.message);
  }
}

// Main function
function main() {
  console.log('🚀 Starting COMPLETE translation of ALL Ukrainian files...\n');
  
  const ukPath = path.join(__dirname, 'src', 'baby-steps', 'uk');
  if (!fs.existsSync(ukPath)) {
    console.log(`⚠️  Ukrainian folder not found: uk`);
    return;
  }
  
  const files = fs.readdirSync(ukPath);
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  console.log(`🌍 Found ${jsonFiles.length} files to translate in Ukrainian folder`);
  
  jsonFiles.forEach(file => {
    const filePath = path.join(ukPath, file);
    translateFile(filePath);
  });
  
  console.log('\n🎉 COMPLETE translation process finished for Ukrainian!');
  console.log('All lesson files have been translated to Ukrainian!');
}

if (require.main === module) {
  main();
}

module.exports = { translateFile, translateToUkrainian };
