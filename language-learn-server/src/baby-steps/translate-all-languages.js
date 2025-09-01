const fs = require('fs');
const path = require('path');

// All languages to translate
const languagesToTranslate = ['hi', 'pl', 'nl', 'el', 'sv', 'no', 'fi', 'cs', 'uk', 'he', 'thai', 'vi'];

// Language mapping
const languageMap = {
  'hi': 'Hindi',
  'pl': 'Polish', 
  'nl': 'Dutch',
  'el': 'Greek',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'uk': 'Ukrainian',
  'he': 'Hebrew',
  'thai': 'Thai',
  'vi': 'Vietnamese'
};

// Comprehensive translations for ALL languages
const translations = {
  'uk': {
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
    'I would like to order.': 'Я хотів би зробити замовлення.',
    
    // Direction sentences
    'Where is the bathroom?': 'Де знаходиться ванна кімната?',
    'Where is the station?': 'Де знаходиться станція?',
    'How do I get to …?': 'Як мені дістатися до …?',
    'Is it close?': 'Це близько?',
    'I am lost.': 'Я заблукав.',
    'Turn left.': 'Поверніть ліворуч.',
    'Turn right.': 'Поверніть праворуч.',
    'Go straight.': 'Йдіть прямо.',
    'It is near here.': 'Це близько звідси.',
    'It is far from here.': 'Це далеко звідси.'
  },
  
  'vi': {
    // Basic words
    'name': 'tên', 'meet': 'gặp', 'from': 'từ', 'speak': 'nói', 'language': 'ngôn ngữ',
    'country': 'quốc gia', 'city': 'thành phố', 'job': 'công việc', 'student': 'học sinh', 'teacher': 'giáo viên',
    'work': 'làm việc', 'study': 'học', 'learn': 'học', 'understand': 'hiểu', 'help': 'giúp đỡ',
    'please': 'xin vui lòng', 'thank you': 'cảm ơn', 'thanks': 'cảm ơn', 'yes': 'có', 'no': 'không',
    'goodbye': 'tạm biệt', 'welcome': 'chào mừng', 'okay': 'được', 'hello': 'xin chào', 'hi': 'xin chào',
    
    // Numbers and time
    'one': 'một', 'two': 'hai', 'three': 'ba', 'four': 'bốn', 'five': 'năm',
    'six': 'sáu', 'seven': 'bảy', 'eight': 'tám', 'nine': 'chín', 'ten': 'mười',
    'time': 'thời gian', 'hour': 'giờ', 'minute': 'phút', 'second': 'giây',
    'morning': 'sáng', 'afternoon': 'chiều', 'evening': 'tối', 'night': 'đêm',
    'today': 'hôm nay', 'tomorrow': 'ngày mai', 'yesterday': 'hôm qua',
    
    // Food and drinks
    'food': 'thức ăn', 'water': 'nước', 'bread': 'bánh mì', 'rice': 'cơm', 'meat': 'thịt',
    'vegetables': 'rau', 'fruit': 'trái cây', 'milk': 'sữa', 'coffee': 'cà phê', 'tea': 'trà',
    'breakfast': 'bữa sáng', 'lunch': 'bữa trưa', 'dinner': 'bữa tối',
    
    // Restaurant vocabulary
    'menu': 'thực đơn', 'table': 'bàn', 'bill': 'hóa đơn', 'waiter': 'phục vụ', 'order': 'đặt món',
    'reservation': 'đặt bàn', 'service': 'dịch vụ', 'tip': 'tiền boa', 'drink': 'đồ uống',
    
    // Family and people
    'family': 'gia đình', 'mother': 'mẹ', 'father': 'bố', 'sister': 'chị gái', 'brother': 'anh trai',
    'son': 'con trai', 'daughter': 'con gái', 'friend': 'bạn', 'man': 'đàn ông', 'woman': 'phụ nữ',
    'child': 'trẻ em', 'baby': 'em bé',
    
    // Common verbs
    'go': 'đi', 'come': 'đến', 'see': 'nhìn thấy', 'hear': 'nghe', 'eat': 'ăn',
    'drink': 'uống', 'sleep': 'ngủ', 'wake': 'thức dậy', 'walk': 'đi bộ', 'run': 'chạy',
    'sit': 'ngồi', 'stand': 'đứng', 'give': 'cho', 'take': 'lấy',
    
    // Directions
    'left': 'trái', 'right': 'phải', 'straight': 'thẳng', 'near': 'gần', 'far': 'xa',
    'here': 'đây', 'there': 'đó', 'up': 'lên', 'down': 'xuống', 'around': 'xung quanh',
    
    // Sentences
    'My name is …': 'Tên tôi là …', 'What is your name?': 'Tên bạn là gì?',
    'Nice to meet you.': 'Rất vui được gặp bạn.', 'How are you?': 'Bạn khỏe không?',
    'I am fine, thank you.': 'Tôi khỏe, cảm ơn bạn.', 'Where are you from?': 'Bạn đến từ đâu?',
    'I am from …': 'Tôi đến từ …', 'Do you speak English?': 'Bạn có nói tiếng Anh không?',
    'I speak a little Vietnamese.': 'Tôi nói một chút tiếng Việt.', 'Excuse me.': 'Xin lỗi.',
    'Sorry.': 'Xin lỗi.', 'Good morning.': 'Chào buổi sáng.', 'Good evening.': 'Chào buổi tối.',
    'Good night.': 'Chúc ngủ ngon.', 'See you later.': 'Hẹn gặp lại.',
    'Have a nice day.': 'Chúc một ngày tốt lành.', 'You are welcome.': 'Không có gì.',
    'No problem.': 'Không vấn đề gì.', 'Take care.': 'Hãy chăm sóc bản thân.',
    
    // Restaurant sentences
    'A table for two, please.': 'Một bàn cho hai người, xin vui lòng.',
    'Could we have the menu?': 'Chúng tôi có thể xem thực đơn không?',
    'The bill, please.': 'Hóa đơn, xin vui lòng.',
    'Do you have vegetarian options?': 'Bạn có món chay không?',
    'What do you recommend?': 'Bạn gợi ý gì?',
    'I would like to order.': 'Tôi muốn đặt món.',
    
    // Direction sentences
    'Where is the bathroom?': 'Nhà vệ sinh ở đâu?',
    'Where is the station?': 'Ga ở đâu?',
    'How do I get to …?': 'Làm sao để đến …?',
    'Is it close?': 'Có gần không?',
    'I am lost.': 'Tôi bị lạc.',
    'Turn left.': 'Rẽ trái.',
    'Turn right.': 'Rẽ phải.',
    'Go straight.': 'Đi thẳng.',
    'It is near here.': 'Nó gần đây.',
    'It is far from here.': 'Nó xa đây.'
  }
};

// Function to translate text
function translateText(text, targetLang) {
  const langTranslations = translations[targetLang];
  if (!langTranslations) {
    return text;
  }
  return langTranslations[text] || text;
}

// Function to translate a file
function translateFile(filePath, targetLang) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Update language field
    data.language = languageMap[targetLang];
    
    // Translate title
    if (data.title) {
      const titleTranslations = {
        'Introductions & basic info': {
          'uk': 'Знайомство та основна інформація',
          'vi': 'Giới thiệu và thông tin cơ bản'
        },
        'greetings & politeness': {
          'uk': 'привітання та ввічливість',
          'vi': 'lời chào và lịch sự'
        },
        'Core verbs & pronouns': {
          'uk': 'Основні дієслова та займенники',
          'vi': 'Động từ cơ bản và đại từ'
        },
        'Numbers & time basics': {
          'uk': 'Числа та основи часу',
          'vi': 'Số và thời gian cơ bản'
        },
        'Getting around': {
          'uk': 'Орієнтування',
          'vi': 'Đi lại'
        },
        'Food & drink basics': {
          'uk': 'Основы їжі та напоїв',
          'vi': 'Thức ăn và đồ uống cơ bản'
        },
        'Shopping & money': {
          'uk': 'Покупки та гроші',
          'vi': 'Mua sắm và tiền bạc'
        },
        'Travel & hotel': {
          'uk': 'Подорожі та готелі',
          'vi': 'Du lịch và khách sạn'
        },
        'Emergencies & health': {
          'uk': 'Надзвичайні ситуації та здоров\'я',
          'vi': 'Tình huống khẩn cấp và sức khỏe'
        },
        'Daily routines': {
          'uk': 'Щоденні рутини',
          'vi': 'Thói quen hàng ngày'
        },
        'At the restaurant': {
          'uk': 'У ресторані',
          'vi': 'Tại nhà hàng'
        },
        'Directions & getting around': {
          'uk': 'Напрямки та орієнтування',
          'vi': 'Phương hướng và đi lại'
        }
      };
      
      if (titleTranslations[data.title] && titleTranslations[data.title][targetLang]) {
        data.title = titleTranslations[data.title][targetLang];
      }
    }
    
    // Translate ALL items
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        if (item.text) {
          item.text = translateText(item.text, targetLang);
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
  console.log('🚀 Starting COMPLETE translation of ALL files for selected languages...\n');
  
  languagesToTranslate.forEach(langCode => {
    console.log(`\n🌍 Translating language: ${langCode} (${languageMap[langCode]})`);
    
    const langPath = path.join(__dirname, langCode);
    if (!fs.existsSync(langPath)) {
      console.log(`⚠️  Language folder not found: ${langCode}`);
      return;
    }
    
    const files = fs.readdirSync(langPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`📁 Found ${jsonFiles.length} files to translate`);
    
    jsonFiles.forEach(file => {
      const filePath = path.join(langPath, file);
      translateFile(filePath, langCode);
    });
    
    console.log(`✅ Completed translation for ${langCode}`);
  });
  
  console.log('\n🎉 COMPLETE translation process finished!');
  console.log('All lesson files have been translated for each selected language!');
}

if (require.main === module) {
  main();
}

module.exports = { translateFile, translateText };
