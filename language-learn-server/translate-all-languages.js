const fs = require('fs');
const path = require('path');

// Language mappings for translation
const languageMappings = {
  'nl': 'Dutch',
  'el': 'Greek', 
  'sv': 'Swedish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'uk': 'Ukrainian',
  'he': 'Hebrew',
  'th': 'Thai',
  'vi': 'Vietnamese'
};

// Basic translations for common words and phrases
const translations = {
  'nl': {
    // Numbers
    'zero': 'nul', 'one': 'één', 'two': 'twee', 'three': 'drie', 'four': 'vier',
    'five': 'vijf', 'six': 'zes', 'seven': 'zeven', 'eight': 'acht', 'nine': 'negen',
    'ten': 'tien', 'twenty': 'twintig', 'thirty': 'dertig', 'forty': 'veertig',
    'fifty': 'vijftig', 'sixty': 'zestig', 'seventy': 'zeventig', 'eighty': 'tachtig',
    'ninety': 'negentig', 'hundred': 'honderd', 'thousand': 'duizend',
    'today': 'vandaag', 'tomorrow': 'morgen', 'yesterday': 'gisteren', 'now': 'nu',
    
    // Basic words
    'hello': 'hallo', 'hi': 'hallo', 'goodbye': 'tot ziens', 'please': 'alsjeblieft',
    'thank you': 'dank je', 'thanks': 'dank je', 'yes': 'ja', 'no': 'nee',
    'welcome': 'welkom', 'okay': 'oké', 'sorry': 'sorry',
    
    // Pronouns
    'I': 'ik', 'you': 'jij', 'he': 'hij', 'she': 'zij', 'we': 'wij', 'they': 'zij',
    'it': 'het', 'me': 'mij', 'him': 'hem', 'her': 'haar',
    
    // Common verbs
    'am': 'ben', 'are': 'bent', 'is': 'is', 'have': 'heb', 'want': 'wil', 'need': 'heb nodig',
    'go': 'gaan', 'come': 'komen', 'see': 'zien', 'eat': 'eten', 'drink': 'drinken',
    'speak': 'spreken', 'understand': 'begrijpen', 'know': 'weten',
    
    // Directions
    'left': 'links', 'right': 'rechts', 'straight': 'rechtdoor', 'near': 'dichtbij',
    'far': 'ver', 'here': 'hier', 'there': 'daar', 'up': 'omhoog', 'down': 'omlaag',
    
    // Food
    'water': 'water', 'coffee': 'koffie', 'tea': 'thee', 'bread': 'brood',
    'apple': 'appel', 'milk': 'melk', 'juice': 'sap', 'rice': 'rijst',
    'chicken': 'kip', 'fish': 'vis',
    
    // Titles
    'Numbers & time basics': 'Cijfers en tijd basis',
    'Directions & getting around': 'Richtingen en je weg vinden',
    'Food & drink basics': 'Eten en drinken basis',
    'Shopping & money': 'Winkelen en geld',
    'Travel & hotel': 'Reizen en hotel',
    'Emergencies & health': 'Noodgevallen en gezondheid',
    'Daily routines & common verbs': 'Dagelijkse routines en veelgebruikte werkwoorden',
    'Family & people': 'Familie en mensen',
    'Weather & small talk': 'Weer en kleine praat',
    'Work & study basics': 'Werk en studie basis',
    'Making plans & invitations': 'Plannen maken en uitnodigingen',
    'Requests & asking for help': 'Verzoeken en om hulp vragen',
    'Phone & internet': 'Telefoon en internet',
    'At the restaurant': 'In het restaurant',
    'Transportation details': 'Transport details',
    'Housing & utilities': 'Woning en nutsvoorzieningen',
    'Connectors & advanced phrases': 'Verbindingswoorden en geavanceerde zinnen',
    'Technology Basics': 'Technologie basis',
    'Weather & Nature': 'Weer en natuur',
    'Shopping & Money': 'Winkelen en geld',
    'Family & Relationships': 'Familie en relaties',
    'Sports & Exercise': 'Sport en beweging',
    'Hobbies & entertainment': 'Hobby\'s en vermaak',
    'Emotions & feelings': 'Emoties en gevoelens',
    'Time & dates': 'Tijd en data',
    'Numbers & quantities': 'Cijfers en hoeveelheden',
    'Colors & appearance': 'Kleuren en uiterlijk',
    'Food & drinks': 'Eten en drinken',
    'Clothing & Fashion': 'Kleding en mode',
    'Home & Furniture': 'Huis en meubels',
    'Animals & Pets': 'Dieren en huisdieren',
    'Communication & Language': 'Communicatie en taal',
    'Advanced Phrases': 'Geavanceerde zinnen'
  },
  
  'el': {
    // Greek translations
    'hello': 'γεια', 'goodbye': 'αντίο', 'please': 'παρακαλώ', 'thank you': 'ευχαριστώ',
    'yes': 'ναι', 'no': 'όχι', 'I': 'εγώ', 'you': 'εσύ', 'he': 'αυτός', 'she': 'αυτή',
    'Numbers & time basics': 'Αριθμοί και βασικά χρόνου',
    'Directions & getting around': 'Κατευθύνσεις και πλοήγηση',
    'Food & drink basics': 'Βασικά τροφίμων και ποτών',
    'Shopping & money': 'Ψώνια και χρήματα',
    'Travel & hotel': 'Ταξίδια και ξενοδοχείο',
    'Emergencies & health': 'Επείγοντα και υγεία',
    'Daily routines & common verbs': 'Καθημερινές ρουτίνες και κοινά ρήματα',
    'Family & people': 'Οικογένεια και άνθρωποι',
    'Weather & small talk': 'Καιρός και μικρές συζητήσεις',
    'Work & study basics': 'Βασικά εργασίας και μελέτης',
    'Making plans & invitations': 'Κάνοντας σχέδια και προσκλήσεις',
    'Requests & asking for help': 'Αιτήματα και ζητώντας βοήθεια',
    'Phone & internet': 'Τηλέφωνο και διαδίκτυο',
    'At the restaurant': 'Στο εστιατόριο',
    'Transportation details': 'Λεπτομέρειες μεταφοράς',
    'Housing & utilities': 'Στέγαση και κοινόχρηστες υπηρεσίες',
    'Connectors & advanced phrases': 'Συνδετικοί και προχωρημένες φράσεις',
    'Technology Basics': 'Βασικά τεχνολογίας',
    'Weather & Nature': 'Καιρός και φύση',
    'Shopping & Money': 'Ψώνια και χρήματα',
    'Family & Relationships': 'Οικογένεια και σχέσεις',
    'Sports & Exercise': 'Αθλήματα και άσκηση',
    'Hobbies & entertainment': 'Χόμπι και διασκέδαση',
    'Emotions & feelings': 'Συναισθήματα και αισθήματα',
    'Time & dates': 'Χρόνος και ημερομηνίες',
    'Numbers & quantities': 'Αριθμοί και ποσότητες',
    'Colors & appearance': 'Χρώματα και εμφάνιση',
    'Food & drinks': 'Τρόφιμα και ποτά',
    'Clothing & Fashion': 'Ρούχα και μόδα',
    'Home & Furniture': 'Σπίτι και έπιπλα',
    'Animals & Pets': 'Ζώα και κατοικίδια',
    'Communication & Language': 'Επικοινωνία και γλώσσα',
    'Advanced Phrases': 'Προχωρημένες φράσεις'
  },
  
  'sv': {
    // Swedish translations
    'hello': 'hej', 'goodbye': 'hej då', 'please': 'snälla', 'thank you': 'tack',
    'yes': 'ja', 'no': 'nej', 'I': 'jag', 'you': 'du', 'he': 'han', 'she': 'hon',
    'Numbers & time basics': 'Siffror och tid grunderna',
    'Directions & getting around': 'Riktningar och att ta sig fram',
    'Food & drink basics': 'Mat och dryck grunderna',
    'Shopping & money': 'Shopping och pengar',
    'Travel & hotel': 'Resor och hotell',
    'Emergencies & health': 'Nödsituationer och hälsa',
    'Daily routines & common verbs': 'Dagliga rutiner och vanliga verb',
    'Family & people': 'Familj och människor',
    'Weather & small talk': 'Väder och småprat',
    'Work & study basics': 'Arbete och studier grunderna',
    'Making plans & invitations': 'Att göra planer och inbjudningar',
    'Requests & asking for help': 'Förfrågningar och att be om hjälp',
    'Phone & internet': 'Telefon och internet',
    'At the restaurant': 'På restaurangen',
    'Transportation details': 'Transportdetaljer',
    'Housing & utilities': 'Bostad och allmännyttiga tjänster',
    'Connectors & advanced phrases': 'Konnektorer och avancerade fraser',
    'Technology Basics': 'Teknologi grunderna',
    'Weather & Nature': 'Väder och natur',
    'Shopping & Money': 'Shopping och pengar',
    'Family & Relationships': 'Familj och relationer',
    'Sports & Exercise': 'Sport och träning',
    'Hobbies & entertainment': 'Hobbyer och underhållning',
    'Emotions & feelings': 'Känslor och känslor',
    'Time & dates': 'Tid och datum',
    'Numbers & quantities': 'Siffror och kvantiteter',
    'Colors & appearance': 'Färger och utseende',
    'Food & drinks': 'Mat och drycker',
    'Clothing & Fashion': 'Kläder och mode',
    'Home & Furniture': 'Hem och möbler',
    'Animals & Pets': 'Djur och husdjur',
    'Communication & Language': 'Kommunikation och språk',
    'Advanced Phrases': 'Avancerade fraser'
  },
  
  'no': {
    // Norwegian translations
    'hello': 'hei', 'goodbye': 'ha det', 'please': 'vær så snill', 'thank you': 'takk',
    'yes': 'ja', 'no': 'nei', 'I': 'jeg', 'you': 'du', 'he': 'han', 'she': 'hun',
    'Numbers & time basics': 'Tall og tid grunnleggende',
    'Directions & getting around': 'Retninger og å finne veien',
    'Food & drink basics': 'Mat og drikke grunnleggende',
    'Shopping & money': 'Shopping og penger',
    'Travel & hotel': 'Reiser og hotell',
    'Emergencies & health': 'Nødsituasjoner og helse',
    'Daily routines & common verbs': 'Daglige rutiner og vanlige verb',
    'Family & people': 'Familie og mennesker',
    'Weather & small talk': 'Vær og småprat',
    'Work & study basics': 'Arbeid og studie grunnleggende',
    'Making plans & invitations': 'Å lage planer og invitasjoner',
    'Requests & asking for help': 'Forespørsler og å be om hjelp',
    'Phone & internet': 'Telefon og internett',
    'At the restaurant': 'På restauranten',
    'Transportation details': 'Transportdetaljer',
    'Housing & utilities': 'Bolig og allmennnyttige tjenester',
    'Connectors & advanced phrases': 'Konnektører og avanserte fraser',
    'Technology Basics': 'Teknologi grunnleggende',
    'Weather & Nature': 'Vær og natur',
    'Shopping & Money': 'Shopping og penger',
    'Family & Relationships': 'Familie og relasjoner',
    'Sports & Exercise': 'Sport og trening',
    'Hobbies & entertainment': 'Hobbyer og underholdning',
    'Emotions & feelings': 'Følelser og følelser',
    'Time & dates': 'Tid og datoer',
    'Numbers & quantities': 'Tall og mengder',
    'Colors & appearance': 'Farger og utseende',
    'Food & drinks': 'Mat og drikke',
    'Clothing & Fashion': 'Klær og mote',
    'Home & Furniture': 'Hjem og møbler',
    'Animals & Pets': 'Dyr og kjæledyr',
    'Communication & Language': 'Kommunikasjon og språk',
    'Advanced Phrases': 'Avanserte fraser'
  },
  
  'fi': {
    // Finnish translations
    'hello': 'hei', 'goodbye': 'näkemiin', 'please': 'kiitos', 'thank you': 'kiitos',
    'yes': 'kyllä', 'no': 'ei', 'I': 'minä', 'you': 'sinä', 'he': 'hän', 'she': 'hän',
    'Numbers & time basics': 'Numerot ja aika perusteet',
    'Directions & getting around': 'Suunnat ja liikkuminen',
    'Food & drink basics': 'Ruoka ja juoma perusteet',
    'Shopping & money': 'Ostokset ja raha',
    'Travel & hotel': 'Matkustus ja hotelli',
    'Emergencies & health': 'Hätätilanteet ja terveys',
    'Daily routines & common verbs': 'Päivittäiset rutiinit ja yleiset verbit',
    'Family & people': 'Perhe ja ihmiset',
    'Weather & small talk': 'Sää ja pieni keskustelu',
    'Work & study basics': 'Työ ja opiskelu perusteet',
    'Making plans & invitations': 'Suunnitelmien tekeminen ja kutsut',
    'Requests & asking for help': 'Pyynnöt ja avun pyytäminen',
    'Phone & internet': 'Puhelin ja internet',
    'At the restaurant': 'Ravintolassa',
    'Transportation details': 'Liikenteen yksityiskohdat',
    'Housing & utilities': 'Asuminen ja yleishyödylliset palvelut',
    'Connectors & advanced phrases': 'Yhdistäjät ja edistyneet lauseet',
    'Technology Basics': 'Teknologia perusteet',
    'Weather & Nature': 'Sää ja luonto',
    'Shopping & Money': 'Ostokset ja raha',
    'Family & Relationships': 'Perhe ja suhteet',
    'Sports & Exercise': 'Urheilu ja harjoittelu',
    'Hobbies & entertainment': 'Harrastukset ja viihde',
    'Emotions & feelings': 'Tunteet ja tunteet',
    'Time & dates': 'Aika ja päivämäärät',
    'Numbers & quantities': 'Numerot ja määrät',
    'Colors & appearance': 'Värit ja ulkonäkö',
    'Food & drinks': 'Ruoka ja juomat',
    'Clothing & Fashion': 'Vaatteet ja muoti',
    'Home & Furniture': 'Koti ja huonekalut',
    'Animals & Pets': 'Eläimet ja lemmikit',
    'Communication & Language': 'Viestintä ja kieli',
    'Advanced Phrases': 'Edistyneet lauseet'
  },
  
  'cs': {
    // Czech translations
    'hello': 'ahoj', 'goodbye': 'na shledanou', 'please': 'prosím', 'thank you': 'děkuji',
    'yes': 'ano', 'no': 'ne', 'I': 'já', 'you': 'ty', 'he': 'on', 'she': 'ona',
    'Numbers & time basics': 'Čísla a základy času',
    'Directions & getting around': 'Směry a orientace',
    'Food & drink basics': 'Základy jídla a pití',
    'Shopping & money': 'Nakupování a peníze',
    'Travel & hotel': 'Cestování a hotel',
    'Emergencies & health': 'Nouzové situace a zdraví',
    'Daily routines & common verbs': 'Denní rutiny a běžná slovesa',
    'Family & people': 'Rodina a lidé',
    'Weather & small talk': 'Počasí a malé rozhovory',
    'Work & study basics': 'Základy práce a studia',
    'Making plans & invitations': 'Plánování a pozvánky',
    'Requests & asking for help': 'Žádosti a prosby o pomoc',
    'Phone & internet': 'Telefon a internet',
    'At the restaurant': 'V restauraci',
    'Transportation details': 'Detaily dopravy',
    'Housing & utilities': 'Bydlení a veřejné služby',
    'Connectors & advanced phrases': 'Spojky a pokročilé fráze',
    'Technology Basics': 'Základy technologií',
    'Weather & Nature': 'Počasí a příroda',
    'Shopping & Money': 'Nakupování a peníze',
    'Family & Relationships': 'Rodina a vztahy',
    'Sports & Exercise': 'Sport a cvičení',
    'Hobbies & entertainment': 'Koníčky a zábava',
    'Emotions & feelings': 'Emoce a pocity',
    'Time & dates': 'Čas a data',
    'Numbers & quantities': 'Čísla a množství',
    'Colors & appearance': 'Barvy a vzhled',
    'Food & drinks': 'Jídlo a nápoje',
    'Clothing & Fashion': 'Oblečení a móda',
    'Home & Furniture': 'Domov a nábytek',
    'Animals & Pets': 'Zvířata a domácí mazlíčci',
    'Communication & Language': 'Komunikace a jazyk',
    'Advanced Phrases': 'Pokročilé fráze'
  },
  
  'uk': {
    // Ukrainian translations
    'hello': 'привіт', 'goodbye': 'до побачення', 'please': 'будь ласка', 'thank you': 'дякую',
    'yes': 'так', 'no': 'ні', 'I': 'я', 'you': 'ти', 'he': 'він', 'she': 'вона',
    'Numbers & time basics': 'Числа та основи часу',
    'Directions & getting around': 'Напрямки та орієнтація',
    'Food & drink basics': 'Основи їжі та напоїв',
    'Shopping & money': 'Покупки та гроші',
    'Travel & hotel': 'Подорожі та готель',
    'Emergencies & health': 'Надзвичайні ситуації та здоров\'я',
    'Daily routines & common verbs': 'Щоденні рутини та загальні дієслова',
    'Family & people': 'Сім\'я та люди',
    'Weather & small talk': 'Погода та невеликі розмови',
    'Work & study basics': 'Основи роботи та навчання',
    'Making plans & invitations': 'Планування та запрошення',
    'Requests & asking for help': 'Прохання та звернення за допомогою',
    'Phone & internet': 'Телефон та інтернет',
    'At the restaurant': 'У ресторані',
    'Transportation details': 'Деталі транспортування',
    'Housing & utilities': 'Житло та комунальні послуги',
    'Connectors & advanced phrases': 'З\'єднувачі та розширені фрази',
    'Technology Basics': 'Основи технологій',
    'Weather & Nature': 'Погода та природа',
    'Shopping & Money': 'Покупки та гроші',
    'Family & Relationships': 'Сім\'я та стосунки',
    'Sports & Exercise': 'Спорт та вправи',
    'Hobbies & entertainment': 'Хобі та розваги',
    'Emotions & feelings': 'Емоції та почуття',
    'Time & dates': 'Час та дати',
    'Numbers & quantities': 'Числа та кількість',
    'Colors & appearance': 'Кольори та зовнішність',
    'Food & drinks': 'Їжа та напої',
    'Clothing & Fashion': 'Одяг та мода',
    'Home & Furniture': 'Дім та меблі',
    'Animals & Pets': 'Тварини та домашні тварини',
    'Communication & Language': 'Спілкування та мова',
    'Advanced Phrases': 'Розширені фрази'
  },
  
  'he': {
    // Hebrew translations
    'hello': 'שלום', 'goodbye': 'להתראות', 'please': 'בבקשה', 'thank you': 'תודה',
    'yes': 'כן', 'no': 'לא', 'I': 'אני', 'you': 'אתה', 'he': 'הוא', 'she': 'היא',
    'Numbers & time basics': 'מספרים ויסודות הזמן',
    'Directions & getting around': 'כיוונים וניווט',
    'Food & drink basics': 'יסודות מזון ומשקאות',
    'Shopping & money': 'קניות וכסף',
    'Travel & hotel': 'נסיעות ומלון',
    'Emergencies & health': 'מצבי חירום ובריאות',
    'Daily routines & common verbs': 'שגרות יומיות ופעלים נפוצים',
    'Family & people': 'משפחה ואנשים',
    'Weather & small talk': 'מזג אוויר ושיחות קטנות',
    'Work & study basics': 'יסודות עבודה ולימוד',
    'Making plans & invitations': 'עשיית תוכניות והזמנות',
    'Requests & asking for help': 'בקשות ובקשת עזרה',
    'Phone & internet': 'טלפון ואינטרנט',
    'At the restaurant': 'במסעדה',
    'Transportation details': 'פרטי תחבורה',
    'Housing & utilities': 'דיור ושירותים ציבוריים',
    'Connectors & advanced phrases': 'מילות קישור וביטויים מתקדמים',
    'Technology Basics': 'יסודות טכנולוגיה',
    'Weather & Nature': 'מזג אוויר וטבע',
    'Shopping & Money': 'קניות וכסף',
    'Family & Relationships': 'משפחה ומערכות יחסים',
    'Sports & Exercise': 'ספורט ופעילות גופנית',
    'Hobbies & entertainment': 'תחביבים ובידור',
    'Emotions & feelings': 'רגשות ותחושות',
    'Time & dates': 'זמן ותאריכים',
    'Numbers & quantities': 'מספרים וכמויות',
    'Colors & appearance': 'צבעים ומראה',
    'Food & drinks': 'מזון ומשקאות',
    'Clothing & Fashion': 'בגדים ואופנה',
    'Home & Furniture': 'בית ורהיטים',
    'Animals & Pets': 'חיות וחיות מחמד',
    'Communication & Language': 'תקשורת ושפה',
    'Advanced Phrases': 'ביטויים מתקדמים'
  },
  
  'th': {
    // Thai translations
    'hello': 'สวัสดี', 'goodbye': 'ลาก่อน', 'please': 'กรุณา', 'thank you': 'ขอบคุณ',
    'yes': 'ใช่', 'no': 'ไม่', 'I': 'ฉัน', 'you': 'คุณ', 'he': 'เขา', 'she': 'เธอ',
    'Numbers & time basics': 'ตัวเลขและพื้นฐานเวลา',
    'Directions & getting around': 'ทิศทางและการเดินทาง',
    'Food & drink basics': 'พื้นฐานอาหารและเครื่องดื่ม',
    'Shopping & money': 'การช้อปปิ้งและเงิน',
    'Travel & hotel': 'การเดินทางและโรงแรม',
    'Emergencies & health': 'เหตุฉุกเฉินและสุขภาพ',
    'Daily routines & common verbs': 'กิจวัตรประจำวันและคำกริยาที่ใช้บ่อย',
    'Family & people': 'ครอบครัวและผู้คน',
    'Weather & small talk': 'สภาพอากาศและการสนทนาสั้นๆ',
    'Work & study basics': 'พื้นฐานการทำงานและการศึกษา',
    'Making plans & invitations': 'การวางแผนและคำเชิญ',
    'Requests & asking for help': 'คำขอและการขอความช่วยเหลือ',
    'Phone & internet': 'โทรศัพท์และอินเทอร์เน็ต',
    'At the restaurant': 'ที่ร้านอาหาร',
    'Transportation details': 'รายละเอียดการขนส่ง',
    'Housing & utilities': 'ที่อยู่อาศัยและสาธารณูปโภค',
    'Connectors & advanced phrases': 'คำเชื่อมและวลีขั้นสูง',
    'Technology Basics': 'พื้นฐานเทคโนโลยี',
    'Weather & Nature': 'สภาพอากาศและธรรมชาติ',
    'Shopping & Money': 'การช้อปปิ้งและเงิน',
    'Family & Relationships': 'ครอบครัวและความสัมพันธ์',
    'Sports & Exercise': 'กีฬาและการออกกำลังกาย',
    'Hobbies & entertainment': 'งานอดิเรกและความบันเทิง',
    'Emotions & feelings': 'อารมณ์และความรู้สึก',
    'Time & dates': 'เวลาและวันที่',
    'Numbers & quantities': 'ตัวเลขและปริมาณ',
    'Colors & appearance': 'สีและลักษณะ',
    'Food & drinks': 'อาหารและเครื่องดื่ม',
    'Clothing & Fashion': 'เสื้อผ้าและแฟชั่น',
    'Home & Furniture': 'บ้านและเฟอร์นิเจอร์',
    'Animals & Pets': 'สัตว์และสัตว์เลี้ยง',
    'Communication & Language': 'การสื่อสารและภาษา',
    'Advanced Phrases': 'วลีขั้นสูง'
  },
  
  'vi': {
    // Vietnamese translations
    'hello': 'xin chào', 'goodbye': 'tạm biệt', 'please': 'xin vui lòng', 'thank you': 'cảm ơn',
    'yes': 'có', 'no': 'không', 'I': 'tôi', 'you': 'bạn', 'he': 'anh ấy', 'she': 'cô ấy',
    'Numbers & time basics': 'Số và cơ bản về thời gian',
    'Directions & getting around': 'Phương hướng và di chuyển',
    'Food & drink basics': 'Cơ bản về thức ăn và đồ uống',
    'Shopping & money': 'Mua sắm và tiền bạc',
    'Travel & hotel': 'Du lịch và khách sạn',
    'Emergencies & health': 'Tình huống khẩn cấp và sức khỏe',
    'Daily routines & common verbs': 'Thói quen hàng ngày và động từ thông dụng',
    'Family & people': 'Gia đình và con người',
    'Weather & small talk': 'Thời tiết và trò chuyện nhỏ',
    'Work & study basics': 'Cơ bản về công việc và học tập',
    'Making plans & invitations': 'Lập kế hoạch và lời mời',
    'Requests & asking for help': 'Yêu cầu và xin giúp đỡ',
    'Phone & internet': 'Điện thoại và internet',
    'At the restaurant': 'Tại nhà hàng',
    'Transportation details': 'Chi tiết giao thông',
    'Housing & utilities': 'Nhà ở và tiện ích công cộng',
    'Connectors & advanced phrases': 'Từ nối và cụm từ nâng cao',
    'Technology Basics': 'Cơ bản về công nghệ',
    'Weather & Nature': 'Thời tiết và thiên nhiên',
    'Shopping & Money': 'Mua sắm và tiền bạc',
    'Family & Relationships': 'Gia đình và mối quan hệ',
    'Sports & Exercise': 'Thể thao và tập thể dục',
    'Hobbies & entertainment': 'Sở thích và giải trí',
    'Emotions & feelings': 'Cảm xúc và cảm giác',
    'Time & dates': 'Thời gian và ngày tháng',
    'Numbers & quantities': 'Số và số lượng',
    'Colors & appearance': 'Màu sắc và ngoại hình',
    'Food & drinks': 'Thức ăn và đồ uống',
    'Clothing & Fashion': 'Quần áo và thời trang',
    'Home & Furniture': 'Nhà và đồ nội thất',
    'Animals & Pets': 'Động vật và thú cưng',
    'Communication & Language': 'Giao tiếp và ngôn ngữ',
    'Advanced Phrases': 'Cụm từ nâng cao'
  }
};

// Function to translate text
function translateText(text, targetLang) {
  if (!translations[targetLang]) return text;
  
  // Check for exact matches first
  if (translations[targetLang][text]) {
    return translations[targetLang][text];
  }
  
  // Check for common patterns
  const lowerText = text.toLowerCase();
  
  // Numbers
  if (lowerText.match(/^\d+$/)) {
    // Keep numbers as is
    return text;
  }
  
  // Common English words
  for (const [english, translation] of Object.entries(translations[targetLang])) {
    if (lowerText === english.toLowerCase()) {
      return translation;
    }
  }
  
  // If no translation found, return original text
  return text;
}

// Function to process a single file
function processFile(filePath, targetLang) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    let hasChanges = false;
    
    // Translate title if it exists and is in English
    if (data.title && typeof data.title === 'string') {
      const translatedTitle = translateText(data.title, targetLang);
      if (translatedTitle !== data.title) {
        data.title = translatedTitle;
        hasChanges = true;
      }
    }
    
    // Translate items
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.text && typeof item.text === 'string') {
          const translatedText = translateText(item.text, targetLang);
          if (translatedText !== item.text) {
            item.text = translatedText;
            hasChanges = true;
          }
        }
      }
    }
    
    // Write back to file if changes were made
    if (hasChanges) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✓ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`- No changes: ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to process all files in a language folder
function processLanguageFolder(langCode) {
  const langPath = path.join(__dirname, 'src', 'baby-steps', langCode);
  
  if (!fs.existsSync(langPath)) {
    console.log(`Language folder not found: ${langPath}`);
    return;
  }
  
  console.log(`\n=== Processing ${langCode} (${languageMappings[langCode] || langCode}) ===`);
  
  const files = fs.readdirSync(langPath).filter(file => file.endsWith('.json'));
  let updatedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(langPath, file);
    if (processFile(filePath, langCode)) {
      updatedCount++;
    }
  }
  
  console.log(`\n${updatedCount} files updated in ${langCode} folder`);
}

// Main execution
function main() {
  console.log('Starting translation of all language files...\n');
  
  const targetLanguages = Object.keys(languageMappings);
  
  for (const langCode of targetLanguages) {
    processLanguageFolder(langCode);
  }
  
  console.log('\n=== Translation complete ===');
  console.log(`Processed ${targetLanguages.length} languages: ${targetLanguages.join(', ')}`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processLanguageFolder, processFile, translateText };
