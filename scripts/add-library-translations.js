const fs = require('fs');
const path = require('path');

// Translation mappings for different languages
const translations = {
  'it': {
    all: 'Tutti',
    types: {
      'article': 'Articolo',
      'story': 'Storia',
      'conversation': 'Conversazione',
      'lyrics': 'Testi',
      'any': 'Qualsiasi'
    },
    levels: {
      'easy / a1': 'Facile / A1',
      'easy-medium / a2': 'Facile-Medio / A2',
      'medium / b1': 'Medio / B1',
      'medium-hard / b2': 'Medio-Difficile / B2',
      'hard / c1': 'Difficile / C1',
      'native / c2': 'Nativo / C2'
    }
  },
  'pt': {
    all: 'Todos',
    types: {
      'article': 'Artigo',
      'story': 'História',
      'conversation': 'Conversa',
      'lyrics': 'Letras',
      'any': 'Qualquer'
    },
    levels: {
      'easy / a1': 'Fácil / A1',
      'easy-medium / a2': 'Fácil-Médio / A2',
      'medium / b1': 'Médio / B1',
      'medium-hard / b2': 'Médio-Difícil / B2',
      'hard / c1': 'Difícil / C1',
      'native / c2': 'Nativo / C2'
    }
  },
  'ru': {
    all: 'Все',
    types: {
      'article': 'Статья',
      'story': 'История',
      'conversation': 'Разговор',
      'lyrics': 'Тексты песен',
      'any': 'Любой'
    },
    levels: {
      'easy / a1': 'Легкий / A1',
      'easy-medium / a2': 'Легкий-Средний / A2',
      'medium / b1': 'Средний / B1',
      'medium-hard / b2': 'Средний-Сложный / B2',
      'hard / c1': 'Сложный / C1',
      'native / c2': 'Носитель / C2'
    }
  },
  'hi': {
    all: 'सभी',
    types: {
      'article': 'लेख',
      'story': 'कहानी',
      'conversation': 'बातचीत',
      'lyrics': 'गीत',
      'any': 'कोई भी'
    },
    levels: {
      'easy / a1': 'आसान / A1',
      'easy-medium / a2': 'आसान-मध्यम / A2',
      'medium / b1': 'मध्यम / B1',
      'medium-hard / b2': 'मध्यम-कठिन / B2',
      'hard / c1': 'कठिन / C1',
      'native / c2': 'मूल / C2'
    }
  },
  'pl': {
    all: 'Wszystkie',
    types: {
      'article': 'Artykuł',
      'story': 'Historia',
      'conversation': 'Rozmowa',
      'lyrics': 'Teksty piosenek',
      'any': 'Dowolny'
    },
    levels: {
      'easy / a1': 'Łatwy / A1',
      'easy-medium / a2': 'Łatwy-Średni / A2',
      'medium / b1': 'Średni / B1',
      'medium-hard / b2': 'Średni-Trudny / B2',
      'hard / c1': 'Trudny / C1',
      'native / c2': 'Natywny / C2'
    }
  },
  'nl': {
    all: 'Alle',
    types: {
      'article': 'Artikel',
      'story': 'Verhaal',
      'conversation': 'Gesprek',
      'lyrics': 'Songteksten',
      'any': 'Elke'
    },
    levels: {
      'easy / a1': 'Makkelijk / A1',
      'easy-medium / a2': 'Makkelijk-Gemiddeld / A2',
      'medium / b1': 'Gemiddeld / B1',
      'medium-hard / b2': 'Gemiddeld-Moeilijk / B2',
      'hard / c1': 'Moeilijk / C1',
      'native / c2': 'Moedertaal / C2'
    }
  },
  'el': {
    all: 'Όλα',
    types: {
      'article': 'Άρθρο',
      'story': 'Ιστορία',
      'conversation': 'Συζήτηση',
      'lyrics': 'Στίχοι',
      'any': 'Οποιοδήποτε'
    },
    levels: {
      'easy / a1': 'Εύκολο / A1',
      'easy-medium / a2': 'Εύκολο-Μέτριο / A2',
      'medium / b1': 'Μέτριο / B1',
      'medium-hard / b2': 'Μέτριο-Δύσκολο / B2',
      'hard / c1': 'Δύσκολο / C1',
      'native / c2': 'Μητρική / C2'
    }
  },
  'sv': {
    all: 'Alla',
    types: {
      'article': 'Artikel',
      'story': 'Berättelse',
      'conversation': 'Konversation',
      'lyrics': 'Sångtexter',
      'any': 'Vilken som helst'
    },
    levels: {
      'easy / a1': 'Lätt / A1',
      'easy-medium / a2': 'Lätt-Medel / A2',
      'medium / b1': 'Medel / B1',
      'medium-hard / b2': 'Medel-Svår / B2',
      'hard / c1': 'Svår / C1',
      'native / c2': 'Modersmål / C2'
    }
  },
  'no': {
    all: 'Alle',
    types: {
      'article': 'Artikkel',
      'story': 'Historie',
      'conversation': 'Samtale',
      'lyrics': 'Sangtekster',
      'any': 'Hvilken som helst'
    },
    levels: {
      'easy / a1': 'Lett / A1',
      'easy-medium / a2': 'Lett-Middels / A2',
      'medium / b1': 'Middels / B1',
      'medium-hard / b2': 'Middels-Vanskelig / B2',
      'hard / c1': 'Vanskelig / C1',
      'native / c2': 'Morsmål / C2'
    }
  },
  'fi': {
    all: 'Kaikki',
    types: {
      'article': 'Artikkeli',
      'story': 'Tarina',
      'conversation': 'Keskustelu',
      'lyrics': 'Sanoitukset',
      'any': 'Mikä tahansa'
    },
    levels: {
      'easy / a1': 'Helppo / A1',
      'easy-medium / a2': 'Helppo-Keskitaso / A2',
      'medium / b1': 'Keskitaso / B1',
      'medium-hard / b2': 'Keskitaso-Vaikea / B2',
      'hard / c1': 'Vaikea / C1',
      'native / c2': 'Äidinkieli / C2'
    }
  },
  'cs': {
    all: 'Všechny',
    types: {
      'article': 'Článek',
      'story': 'Příběh',
      'conversation': 'Rozhovor',
      'lyrics': 'Texty písní',
      'any': 'Jakýkoli'
    },
    levels: {
      'easy / a1': 'Snadný / A1',
      'easy-medium / a2': 'Snadný-Střední / A2',
      'medium / b1': 'Střední / B1',
      'medium-hard / b2': 'Střední-Těžký / B2',
      'hard / c1': 'Těžký / C1',
      'native / c2': 'Rodný / C2'
    }
  },
  'uk': {
    all: 'Всі',
    types: {
      'article': 'Стаття',
      'story': 'Історія',
      'conversation': 'Розмова',
      'lyrics': 'Тексти пісень',
      'any': 'Будь-який'
    },
    levels: {
      'easy / a1': 'Легкий / A1',
      'easy-medium / a2': 'Легкий-Середній / A2',
      'medium / b1': 'Середній / B1',
      'medium-hard / b2': 'Середній-Складний / B2',
      'hard / c1': 'Складний / C1',
      'native / c2': 'Рідна / C2'
    }
  },
  'he': {
    all: 'הכל',
    types: {
      'article': 'מאמר',
      'story': 'סיפור',
      'conversation': 'שיחה',
      'lyrics': 'מילים',
      'any': 'כל'
    },
    levels: {
      'easy / a1': 'קל / A1',
      'easy-medium / a2': 'קל-בינוני / A2',
      'medium / b1': 'בינוני / B1',
      'medium-hard / b2': 'בינוני-קשה / B2',
      'hard / c1': 'קשה / C1',
      'native / c2': 'שפת אם / C2'
    }
  },
  'th': {
    all: 'ทั้งหมด',
    types: {
      'article': 'บทความ',
      'story': 'เรื่องราว',
      'conversation': 'การสนทนา',
      'lyrics': 'เนื้อเพลง',
      'any': 'ใดๆ'
    },
    levels: {
      'easy / a1': 'ง่าย / A1',
      'easy-medium / a2': 'ง่าย-ปานกลาง / A2',
      'medium / b1': 'ปานกลาง / B1',
      'medium-hard / b2': 'ปานกลาง-ยาก / B2',
      'hard / c1': 'ยาก / C1',
      'native / c2': 'เจ้าของภาษา / C2'
    }
  },
  'vi': {
    all: 'Tất cả',
    types: {
      'article': 'Bài viết',
      'story': 'Câu chuyện',
      'conversation': 'Cuộc trò chuyện',
      'lyrics': 'Lời bài hát',
      'any': 'Bất kỳ'
    },
    levels: {
      'easy / a1': 'Dễ / A1',
      'easy-medium / a2': 'Dễ-Trung bình / A2',
      'medium / b1': 'Trung bình / B1',
      'medium-hard / b2': 'Trung bình-Khó / B2',
      'hard / c1': 'Khó / C1',
      'native / c2': 'Bản ngữ / C2'
    }
  }
};

// Function to add translations to a language file
function addTranslationsToFile(langCode) {
  const filePath = path.join(__dirname, '..', 'src', 'i18n', 'locales', `${langCode}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File ${langCode}.json does not exist, skipping...`);
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    // Check if library.filters already exists
    if (!data.screens || !data.screens.library || !data.screens.library.filters) {
      console.log(`Library filters section not found in ${langCode}.json, skipping...`);
      return;
    }

    const langTranslations = translations[langCode];
    if (!langTranslations) {
      console.log(`No translations defined for ${langCode}, skipping...`);
      return;
    }

    // Add the new translation keys
    data.screens.library.filters.all = langTranslations.all;
    data.screens.library.filters.types = langTranslations.types;
    data.screens.library.filters.levels = langTranslations.levels;

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${langCode}.json`);
  } catch (error) {
    console.error(`Error updating ${langCode}.json:`, error.message);
  }
}

// Process all language files
const languageCodes = Object.keys(translations);
console.log(`Processing ${languageCodes.length} language files:`, languageCodes);

languageCodes.forEach(langCode => {
  console.log(`Processing ${langCode}...`);
  addTranslationsToFile(langCode);
});

console.log('Library translation updates completed!');
