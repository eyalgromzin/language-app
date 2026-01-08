const fs = require('fs');
const path = require('path');

const translations = {
  en: {
    title: "You're All Set!",
    subtitle: "Review your settings and start learning",
    yourSettings: "Your Settings",
    notSelected: "Not selected",
    correctAnswers: "{{count}} correct answers",
    totalCorrectAnswers: "{{count}} total correct answers",
    settingUp: "Setting up",
    startLearning: "Start Learning",
    languagesMissing: "Language selection is missing. Please go back and select your languages.",
    accessibility: {
      goBack: "Go back to practice settings",
      completeSetup: "Complete setup and start learning"
    }
  },
  he: {
    title: "הכל מוכן!",
    subtitle: "בדקו את ההגדרות שלכם והתחילו ללמוד",
    yourSettings: "ההגדרות שלך",
    notSelected: "לא נבחר",
    correctAnswers: "{{count}} תשובות נכונות",
    totalCorrectAnswers: "{{count}} סך תשובות נכונות",
    settingUp: "מגדיר",
    startLearning: "התחל ללמוד",
    languagesMissing: "בחירת השפה חסרה. אנא חזרו ובחרו את השפות שלכם.",
    accessibility: {
      goBack: "חזרה להגדרות תרגול",
      completeSetup: "השלימו את ההגדרה והתחילו ללמוד"
    }
  },
  fr: {
    title: "Tout est prêt !",
    subtitle: "Vérifiez vos paramètres et commencez à apprendre",
    yourSettings: "Vos paramètres",
    notSelected: "Non sélectionné",
    correctAnswers: "{{count}} réponses correctes",
    totalCorrectAnswers: "{{count}} total de réponses correctes",
    settingUp: "Configuration",
    startLearning: "Commencer l'apprentissage",
    languagesMissing: "La sélection de la langue est manquante. Veuillez revenir en arrière et sélectionner vos langues.",
    accessibility: {
      goBack: "Retour aux paramètres de pratique",
      completeSetup: "Terminer la configuration et commencer l'apprentissage"
    }
  },
  de: {
    title: "Alles bereit!",
    subtitle: "Überprüfen Sie Ihre Einstellungen und beginnen Sie mit dem Lernen",
    yourSettings: "Ihre Einstellungen",
    notSelected: "Nicht ausgewählt",
    correctAnswers: "{{count}} richtige Antworten",
    totalCorrectAnswers: "{{count}} gesamt richtige Antworten",
    settingUp: "Einrichtung",
    startLearning: "Lernen beginnen",
    languagesMissing: "Sprachauswahl fehlt. Bitte gehen Sie zurück und wählen Sie Ihre Sprachen.",
    accessibility: {
      goBack: "Zurück zu den Übungseinstellungen",
      completeSetup: "Einrichtung abschließen und mit dem Lernen beginnen"
    }
  },
  es: {
    title: "¡Todo listo!",
    subtitle: "Revisa tu configuración y comienza a aprender",
    yourSettings: "Tu configuración",
    notSelected: "No seleccionado",
    correctAnswers: "{{count}} respuestas correctas",
    totalCorrectAnswers: "{{count}} total de respuestas correctas",
    settingUp: "Configurando",
    startLearning: "Comenzar a aprender",
    languagesMissing: "Falta la selección de idioma. Por favor, vuelve atrás y selecciona tus idiomas.",
    accessibility: {
      goBack: "Volver a la configuración de práctica",
      completeSetup: "Completar configuración y comenzar a aprender"
    }
  },
  it: {
    title: "Tutto pronto!",
    subtitle: "Rivedi le tue impostazioni e inizia a imparare",
    yourSettings: "Le tue impostazioni",
    notSelected: "Non selezionato",
    correctAnswers: "{{count}} risposte corrette",
    totalCorrectAnswers: "{{count}} totale risposte corrette",
    settingUp: "Configurazione",
    startLearning: "Inizia ad imparare",
    languagesMissing: "Selezione della lingua mancante. Torna indietro e seleziona le tue lingue.",
    accessibility: {
      goBack: "Torna alle impostazioni di pratica",
      completeSetup: "Completa la configurazione e inizia ad imparare"
    }
  },
  pt: {
    title: "Tudo pronto!",
    subtitle: "Revise suas configurações e comece a aprender",
    yourSettings: "Suas configurações",
    notSelected: "Não selecionado",
    correctAnswers: "{{count}} respostas corretas",
    totalCorrectAnswers: "{{count}} total de respostas corretas",
    settingUp: "Configurando",
    startLearning: "Começar a aprender",
    languagesMissing: "Seleção de idioma está faltando. Por favor, volte e selecione seus idiomas.",
    accessibility: {
      goBack: "Voltar às configurações de prática",
      completeSetup: "Concluir configuração e começar a aprender"
    }
  },
  ru: {
    title: "Всё готово!",
    subtitle: "Проверьте свои настройки и начните обучение",
    yourSettings: "Ваши настройки",
    notSelected: "Не выбрано",
    correctAnswers: "{{count}} правильных ответов",
    totalCorrectAnswers: "{{count}} всего правильных ответов",
    settingUp: "Настройка",
    startLearning: "Начать обучение",
    languagesMissing: "Выбор языка отсутствует. Пожалуйста, вернитесь назад и выберите свои языки.",
    accessibility: {
      goBack: "Вернуться к настройкам практики",
      completeSetup: "Завершить настройку и начать обучение"
    }
  },
  pl: {
    title: "Wszystko gotowe!",
    subtitle: "Sprawdź swoje ustawienia i zacznij naukę",
    yourSettings: "Twoje ustawienia",
    notSelected: "Nie wybrano",
    correctAnswers: "{{count}} poprawnych odpowiedzi",
    totalCorrectAnswers: "{{count}} łączna liczba poprawnych odpowiedzi",
    settingUp: "Konfiguracja",
    startLearning: "Rozpocznij naukę",
    languagesMissing: "Brak wyboru języka. Wróć i wybierz swoje języki.",
    accessibility: {
      goBack: "Wróć do ustawień ćwiczeń",
      completeSetup: "Zakończ konfigurację i rozpocznij naukę"
    }
  },
  nl: {
    title: "Alles klaar!",
    subtitle: "Controleer je instellingen en begin met leren",
    yourSettings: "Jouw instellingen",
    notSelected: "Niet geselecteerd",
    correctAnswers: "{{count}} juiste antwoorden",
    totalCorrectAnswers: "{{count}} totaal juiste antwoorden",
    settingUp: "Instellen",
    startLearning: "Begin met leren",
    languagesMissing: "Taalselectie ontbreekt. Ga terug en selecteer je talen.",
    accessibility: {
      goBack: "Terug naar oefeningen instellingen",
      completeSetup: "Voltooi instelling en begin met leren"
    }
  },
  cs: {
    title: "Vše připraveno!",
    subtitle: "Zkontrolujte nastavení a začněte se učit",
    yourSettings: "Vaše nastavení",
    notSelected: "Nevybráno",
    correctAnswers: "{{count}} správných odpovědí",
    totalCorrectAnswers: "{{count}} celkových správných odpovědí",
    settingUp: "Nastavování",
    startLearning: "Začít se učit",
    languagesMissing: "Chybí výběr jazyka. Vraťte se zpět a vyberte své jazyky.",
    accessibility: {
      goBack: "Zpět na nastavení cvičení",
      completeSetup: "Dokončit nastavení a začít se učit"
    }
  },
  el: {
    title: "Είστε έτοιμοι!",
    subtitle: "Ελέγξτε τις ρυθμίσεις σας και ξεκινήστε να μαθαίνετε",
    yourSettings: "Οι ρυθμίσεις σας",
    notSelected: "Δεν επιλέχθηκε",
    correctAnswers: "{{count}} σωστές απαντήσεις",
    totalCorrectAnswers: "{{count}} σύνολο σωστών απαντήσεων",
    settingUp: "Ρύθμιση",
    startLearning: "Έναρξη μάθησης",
    languagesMissing: "Η επιλογή γλώσσας λείπει. Παρακαλώ επιστρέψτε και επιλέξτε τις γλώσσες σας.",
    accessibility: {
      goBack: "Επιστροφή στις ρυθμίσεις άσκησης",
      completeSetup: "Ολοκλήρωση ρύθμισης και έναρξη μάθησης"
    }
  },
  sv: {
    title: "Allt klart!",
    subtitle: "Granska dina inställningar och börja lära",
    yourSettings: "Dina inställningar",
    notSelected: "Inte vald",
    correctAnswers: "{{count}} rätta svar",
    totalCorrectAnswers: "{{count}} totalt rätta svar",
    settingUp: "Konfigurerar",
    startLearning: "Börja lära",
    languagesMissing: "Språkval saknas. Gå tillbaka och välj dina språk.",
    accessibility: {
      goBack: "Tillbaka till övningsinställningar",
      completeSetup: "Slutför inställning och börja lära"
    }
  },
  fi: {
    title: "Kaikki valmiina!",
    subtitle: "Tarkista asetuksesi ja aloita oppiminen",
    yourSettings: "Asetuksesi",
    notSelected: "Ei valittu",
    correctAnswers: "{{count}} oikeaa vastausta",
    totalCorrectAnswers: "{{count}} yhteensä oikeita vastauksia",
    settingUp: "Asetetaan",
    startLearning: "Aloita oppiminen",
    languagesMissing: "Kielivalinta puuttuu. Palaa takaisin ja valitse kielesi.",
    accessibility: {
      goBack: "Takaisin harjoitusasetuksiin",
      completeSetup: "Viimeistele asetukset ja aloita oppiminen"
    }
  },
  no: {
    title: "Alt klart!",
    subtitle: "Sjekk innstillingene dine og begynn å lære",
    yourSettings: "Dine innstillinger",
    notSelected: "Ikke valgt",
    correctAnswers: "{{count}} riktige svar",
    totalCorrectAnswers: "{{count}} totalt riktige svar",
    settingUp: "Setter opp",
    startLearning: "Begynn å lære",
    languagesMissing: "Språkvalg mangler. Vennligst gå tilbake og velg språkene dine.",
    accessibility: {
      goBack: "Tilbake til øvelsesinnstillinger",
      completeSetup: "Fullfør oppsett og begynn å lære"
    }
  },
  hi: {
    title: "सब तैयार है!",
    subtitle: "अपनी सेटिंग की समीक्षा करें और सीखना शुरू करें",
    yourSettings: "आपकी सेटिंग्स",
    notSelected: "चयनित नहीं",
    correctAnswers: "{{count}} सही उत्तर",
    totalCorrectAnswers: "{{count}} कुल सही उत्तर",
    settingUp: "सेटअप हो रहा है",
    startLearning: "सीखना शुरू करें",
    languagesMissing: "भाषा चयन गायब है। कृपया वापस जाएं और अपनी भाषाओं का चयन करें।",
    accessibility: {
      goBack: "अभ्यास सेटिंग्स पर वापस जाएं",
      completeSetup: "सेटअप पूरा करें और सीखना शुरू करें"
    }
  },
  th: {
    title: "พร้อมแล้ว!",
    subtitle: "ตรวจสอบการตั้งค่าและเริ่มเรียนรู้",
    yourSettings: "การตั้งค่าของคุณ",
    notSelected: "ไม่ได้เลือก",
    correctAnswers: "{{count}} คำตอบที่ถูกต้อง",
    totalCorrectAnswers: "{{count}} คำตอบที่ถูกต้องทั้งหมด",
    settingUp: "กำลังตั้งค่า",
    startLearning: "เริ่มเรียนรู้",
    languagesMissing: "การเลือกภาษายังไม่สมบูรณ์ กรุณากลับไปและเลือกภาษาของคุณ",
    accessibility: {
      goBack: "กลับไปที่การตั้งค่าการฝึกฝน",
      completeSetup: "ตั้งค่าให้เสร็จสิ้นและเริ่มเรียนรู้"
    }
  },
  uk: {
    title: "Все готово!",
    subtitle: "Перевірте свої налаштування та почніть навчання",
    yourSettings: "Ваші налаштування",
    notSelected: "Не вибрано",
    correctAnswers: "{{count}} правильних відповідей",
    totalCorrectAnswers: "{{count}} всього правильних відповідей",
    settingUp: "Налаштування",
    startLearning: "Почати навчання",
    languagesMissing: "Вибір мови відсутній. Будь ласка, поверніться назад і виберіть свої мови.",
    accessibility: {
      goBack: "Повернутися до налаштувань практики",
      completeSetup: "Завершити налаштування та почати навчання"
    }
  },
  vi: {
    title: "Sẵn sàng rồi!",
    subtitle: "Xem lại cài đặt và bắt đầu học",
    yourSettings: "Cài đặt của bạn",
    notSelected: "Chưa chọn",
    correctAnswers: "{{count}} câu trả lời đúng",
    totalCorrectAnswers: "{{count}} tổng số câu trả lời đúng",
    settingUp: "Đang thiết lập",
    startLearning: "Bắt đầu học",
    languagesMissing: "Thiếu lựa chọn ngôn ngữ. Vui lòng quay lại và chọn ngôn ngữ của bạn.",
    accessibility: {
      goBack: "Quay lại cài đặt luyện tập",
      completeSetup: "Hoàn tất thiết lập và bắt đầu học"
    }
  }
};

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

Object.keys(translations).forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${lang} - file not found`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Add completionScreen translations
  if (!data.screens.startup.completionScreen) {
    data.screens.startup.completionScreen = translations[lang];
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`✓ Updated ${lang}.json`);
  } else {
    console.log(`- ${lang}.json already has completionScreen translations`);
  }
});

console.log('\nAll translation files updated!');
