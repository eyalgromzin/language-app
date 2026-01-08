const fs = require('fs');
const path = require('path');

// Translations for babyStepsPath in all languages
const translations = {
  en: {
    title: "Learning Journey",
    subtitle: "Master your language step by step",
    progress: "Progress",
    completed: "completed",
    of: "of",
    loading: "Loading your learning journey...",
    noSteps: "No learning steps available at the moment.",
    clearProgress: "Clear Progress",
    clearProgressMessage: "Are you sure you want to clear all your baby steps progress? This action cannot be undone.",
    cancel: "Cancel",
    progressCleared: "Progress Cleared",
    progressClearedMessage: "Your baby steps progress has been cleared successfully.",
    error: "Error",
    clearProgressError: "Failed to clear progress. Please try again."
  },
  es: {
    title: "Viaje de Aprendizaje",
    subtitle: "Domina tu idioma paso a paso",
    progress: "Progreso",
    completed: "completados",
    of: "de",
    loading: "Cargando tu viaje de aprendizaje...",
    noSteps: "No hay pasos de aprendizaje disponibles en este momento.",
    clearProgress: "Borrar Progreso",
    clearProgressMessage: "¿Estás seguro de que quieres borrar todo tu progreso de primeros pasos? Esta acción no se puede deshacer.",
    cancel: "Cancelar",
    progressCleared: "Progreso Borrado",
    progressClearedMessage: "Tu progreso de primeros pasos se ha borrado exitosamente.",
    error: "Error",
    clearProgressError: "No se pudo borrar el progreso. Por favor, inténtalo de nuevo."
  },
  fr: {
    title: "Parcours d'Apprentissage",
    subtitle: "Maîtrisez votre langue pas à pas",
    progress: "Progrès",
    completed: "terminés",
    of: "sur",
    loading: "Chargement de votre parcours d'apprentissage...",
    noSteps: "Aucune étape d'apprentissage disponible pour le moment.",
    clearProgress: "Effacer les Progrès",
    clearProgressMessage: "Êtes-vous sûr de vouloir effacer tous vos progrès des premiers pas ? Cette action ne peut pas être annulée.",
    cancel: "Annuler",
    progressCleared: "Progrès Effacés",
    progressClearedMessage: "Vos progrès des premiers pas ont été effacés avec succès.",
    error: "Erreur",
    clearProgressError: "Échec de l'effacement des progrès. Veuillez réessayer."
  },
  de: {
    title: "Lernreise",
    subtitle: "Meistern Sie Ihre Sprache Schritt für Schritt",
    progress: "Fortschritt",
    completed: "abgeschlossen",
    of: "von",
    loading: "Lade deine Lernreise...",
    noSteps: "Momentan sind keine Lernschritte verfügbar.",
    clearProgress: "Fortschritt Löschen",
    clearProgressMessage: "Bist du sicher, dass du deinen gesamten Fortschritt bei den ersten Schritten löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.",
    cancel: "Abbrechen",
    progressCleared: "Fortschritt Gelöscht",
    progressClearedMessage: "Dein Fortschritt bei den ersten Schritten wurde erfolgreich gelöscht.",
    error: "Fehler",
    clearProgressError: "Das Löschen des Fortschritts ist fehlgeschlagen. Bitte versuche es erneut."
  },
  it: {
    title: "Percorso di Apprendimento",
    subtitle: "Padroneggia la tua lingua passo dopo passo",
    progress: "Progresso",
    completed: "completati",
    of: "di",
    loading: "Caricamento del tuo percorso di apprendimento...",
    noSteps: "Nessun passo di apprendimento disponibile al momento.",
    clearProgress: "Cancella Progresso",
    clearProgressMessage: "Sei sicuro di voler cancellare tutti i tuoi progressi dei primi passi? Questa azione non può essere annullata.",
    cancel: "Annulla",
    progressCleared: "Progresso Cancellato",
    progressClearedMessage: "I tuoi progressi dei primi passi sono stati cancellati con successo.",
    error: "Errore",
    clearProgressError: "Impossibile cancellare il progresso. Riprova."
  },
  pt: {
    title: "Jornada de Aprendizagem",
    subtitle: "Domine seu idioma passo a passo",
    progress: "Progresso",
    completed: "concluídos",
    of: "de",
    loading: "Carregando sua jornada de aprendizagem...",
    noSteps: "Nenhum passo de aprendizagem disponível no momento.",
    clearProgress: "Limpar Progresso",
    clearProgressMessage: "Tem certeza de que deseja limpar todo o seu progresso dos primeiros passos? Esta ação não pode ser desfeita.",
    cancel: "Cancelar",
    progressCleared: "Progresso Limpo",
    progressClearedMessage: "Seu progresso dos primeiros passos foi limpo com sucesso.",
    error: "Erro",
    clearProgressError: "Falha ao limpar o progresso. Por favor, tente novamente."
  },
  ru: {
    title: "Путь Обучения",
    subtitle: "Осваивайте язык шаг за шагом",
    progress: "Прогресс",
    completed: "завершено",
    of: "из",
    loading: "Загрузка вашего пути обучения...",
    noSteps: "В данный момент нет доступных шагов обучения.",
    clearProgress: "Очистить Прогресс",
    clearProgressMessage: "Вы уверены, что хотите очистить весь прогресс первых шагов? Это действие нельзя отменить.",
    cancel: "Отмена",
    progressCleared: "Прогресс Очищен",
    progressClearedMessage: "Ваш прогресс первых шагов успешно очищен.",
    error: "Ошибка",
    clearProgressError: "Не удалось очистить прогресс. Пожалуйста, попробуйте снова."
  },
  hi: {
    title: "सीखने की यात्रा",
    subtitle: "अपनी भाषा को कदम दर कदम में महारत हासिल करें",
    progress: "प्रगति",
    completed: "पूर्ण",
    of: "में से",
    loading: "आपकी सीखने की यात्रा लोड हो रही है...",
    noSteps: "इस समय कोई सीखने के कदम उपलब्ध नहीं हैं।",
    clearProgress: "प्रगति साफ़ करें",
    clearProgressMessage: "क्या आप वाकई अपने सभी पहले कदमों की प्रगति को साफ़ करना चाहते हैं? इस क्रिया को पूर्ववत नहीं किया जा सकता।",
    cancel: "रद्द करें",
    progressCleared: "प्रगति साफ़ की गई",
    progressClearedMessage: "आपके पहले कदमों की प्रगति सफलतापूर्वक साफ़ कर दी गई है।",
    error: "त्रुटि",
    clearProgressError: "प्रगति साफ़ करने में विफल। कृपया पुनः प्रयास करें।"
  },
  pl: {
    title: "Podróż Nauczania",
    subtitle: "Opanuj swój język krok po kroku",
    progress: "Postęp",
    completed: "ukończonych",
    of: "z",
    loading: "Ładowanie twojej podróży nauczania...",
    noSteps: "W tej chwili nie ma dostępnych kroków nauczania.",
    clearProgress: "Wyczyść Postęp",
    clearProgressMessage: "Czy na pewno chcesz wyczyścić cały postęp pierwszych kroków? Ta akcja nie może zostać cofnięta.",
    cancel: "Anuluj",
    progressCleared: "Postęp Wyczyszczony",
    progressClearedMessage: "Twój postęp pierwszych kroków został pomyślnie wyczyszczony.",
    error: "Błąd",
    clearProgressError: "Nie udało się wyczyścić postępu. Spróbuj ponownie."
  },
  nl: {
    title: "Leerreis",
    subtitle: "Beheers je taal stap voor stap",
    progress: "Voortgang",
    completed: "voltooid",
    of: "van",
    loading: "Je leerreis wordt geladen...",
    noSteps: "Momenteel zijn er geen leerstappen beschikbaar.",
    clearProgress: "Voortgang Wissen",
    clearProgressMessage: "Weet je zeker dat je al je voortgang van de eerste stappen wilt wissen? Deze actie kan niet ongedaan worden gemaakt.",
    cancel: "Annuleren",
    progressCleared: "Voortgang Gewist",
    progressClearedMessage: "Je voortgang van de eerste stappen is succesvol gewist.",
    error: "Fout",
    clearProgressError: "Kon voortgang niet wissen. Probeer het opnieuw."
  },
  el: {
    title: "Ταξίδι Μάθησης",
    subtitle: "Κατακτήστε τη γλώσσα σας βήμα βήμα",
    progress: "Πρόοδος",
    completed: "ολοκληρώθηκαν",
    of: "από",
    loading: "Φόρτωση του ταξιδιού μάθησης σας...",
    noSteps: "Δεν υπάρχουν διαθέσιμα βήματα μάθησης αυτή τη στιγμή.",
    clearProgress: "Διαγραφή Προόδου",
    clearProgressMessage: "Είστε σίγουροι ότι θέλετε να διαγράψετε όλη την πρόοδο των πρώτων βημάτων σας; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.",
    cancel: "Ακύρωση",
    progressCleared: "Η Πρόοδος Διαγράφηκε",
    progressClearedMessage: "Η πρόοδος των πρώτων βημάτων σας διαγράφηκε με επιτυχία.",
    error: "Σφάλμα",
    clearProgressError: "Αποτυχία διαγραφής προόδου. Παρακαλώ δοκιμάστε ξανά."
  },
  sv: {
    title: "Läranderesan",
    subtitle: "Bemästra ditt språk steg för steg",
    progress: "Framsteg",
    completed: "slutförda",
    of: "av",
    loading: "Laddar din läranderesa...",
    noSteps: "Inga lärandesteg är tillgängliga för tillfället.",
    clearProgress: "Rensa Framsteg",
    clearProgressMessage: "Är du säker på att du vill rensa alla dina framsteg från de första stegen? Denna åtgärd kan inte ångras.",
    cancel: "Avbryt",
    progressCleared: "Framsteg Rensade",
    progressClearedMessage: "Dina framsteg från de första stegen har rensats framgångsrikt.",
    error: "Fel",
    clearProgressError: "Misslyckades med att rensa framsteg. Vänligen försök igen."
  },
  no: {
    title: "Læringsreisen",
    subtitle: "Mestre språket ditt steg for steg",
    progress: "Fremgang",
    completed: "fullført",
    of: "av",
    loading: "Laster din læringsreise...",
    noSteps: "Ingen læringstrinn er tilgjengelige for øyeblikket.",
    clearProgress: "Tøm Fremgang",
    clearProgressMessage: "Er du sikker på at du vil tømme all fremgang fra de første trinnene? Denne handlingen kan ikke angres.",
    cancel: "Avbryt",
    progressCleared: "Fremgang Tømt",
    progressClearedMessage: "Din fremgang fra de første trinnene er tømt vellykket.",
    error: "Feil",
    clearProgressError: "Kunne ikke tømme fremgang. Vennligst prøv igjen."
  },
  fi: {
    title: "Oppimismatka",
    subtitle: "Hallitse kielesi askel askeleelta",
    progress: "Edistyminen",
    completed: "valmistunut",
    of: "/",
    loading: "Ladataan oppimismatkaasi...",
    noSteps: "Ei saatavilla olevia oppimisaskeleita tällä hetkellä.",
    clearProgress: "Tyhjennä Edistyminen",
    clearProgressMessage: "Oletko varma, että haluat tyhjentää kaikki ensimmäisten askelten edistymisesi? Tätä toimintoa ei voi kumota.",
    cancel: "Peruuta",
    progressCleared: "Edistyminen Tyhjennetty",
    progressClearedMessage: "Ensimmäisten askelten edistymisesi on tyhjennetty onnistuneesti.",
    error: "Virhe",
    clearProgressError: "Edistymisen tyhjentäminen epäonnistui. Yritä uudelleen."
  },
  cs: {
    title: "Cesta Učení",
    subtitle: "Ovládněte svůj jazyk krok za krokem",
    progress: "Pokrok",
    completed: "dokončeno",
    of: "z",
    loading: "Načítání vaší cesty učení...",
    noSteps: "V tuto chvíli nejsou k dispozici žádné kroky učení.",
    clearProgress: "Vymazat Pokrok",
    clearProgressMessage: "Opravdu chcete vymazat veškerý pokrok prvních kroků? Tuto akci nelze vrátit zpět.",
    cancel: "Zrušit",
    progressCleared: "Pokrok Vymazán",
    progressClearedMessage: "Váš pokrok prvních kroků byl úspěšně vymazán.",
    error: "Chyba",
    clearProgressError: "Nepodařilo se vymazat pokrok. Zkuste to prosím znovu."
  },
  uk: {
    title: "Шлях Навчання",
    subtitle: "Опановуйте свою мову крок за кроком",
    progress: "Прогрес",
    completed: "завершено",
    of: "з",
    loading: "Завантаження вашого шляху навчання...",
    noSteps: "Наразі немає доступних кроків навчання.",
    clearProgress: "Очистити Прогрес",
    clearProgressMessage: "Ви впевнені, що хочете очистити весь прогрес перших кроків? Цю дію неможливо скасувати.",
    cancel: "Скасувати",
    progressCleared: "Прогрес Очищено",
    progressClearedMessage: "Ваш прогрес перших кроків успішно очищено.",
    error: "Помилка",
    clearProgressError: "Не вдалося очистити прогрес. Будь ласка, спробуйте ще раз."
  },
  th: {
    title: "เส้นทางการเรียนรู้",
    subtitle: "เชี่ยวชาญภาษาของคุณทีละขั้นตอน",
    progress: "ความคืบหน้า",
    completed: "เสร็จสิ้น",
    of: "จาก",
    loading: "กำลังโหลดเส้นทางการเรียนรู้ของคุณ...",
    noSteps: "ไม่มีขั้นตอนการเรียนรู้ที่พร้อมใช้งานในขณะนี้",
    clearProgress: "ล้างความคืบหน้า",
    clearProgressMessage: "คุณแน่ใจหรือไม่ว่าต้องการล้างความคืบหน้าขั้นตอนแรกทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้",
    cancel: "ยกเลิก",
    progressCleared: "ล้างความคืบหน้าแล้ว",
    progressClearedMessage: "ล้างความคืบหน้าขั้นตอนแรกของคุณเรียบร้อยแล้ว",
    error: "ข้อผิดพลาด",
    clearProgressError: "ไม่สามารถล้างความคืบหน้าได้ กรุณาลองอีกครั้ง"
  },
  vi: {
    title: "Hành Trình Học Tập",
    subtitle: "Thành thạo ngôn ngữ của bạn từng bước một",
    progress: "Tiến Độ",
    completed: "hoàn thành",
    of: "trên",
    loading: "Đang tải hành trình học tập của bạn...",
    noSteps: "Hiện tại không có bước học tập nào khả dụng.",
    clearProgress: "Xóa Tiến Độ",
    clearProgressMessage: "Bạn có chắc chắn muốn xóa tất cả tiến độ các bước đầu tiên không? Hành động này không thể hoàn tác.",
    cancel: "Hủy",
    progressCleared: "Đã Xóa Tiến Độ",
    progressClearedMessage: "Tiến độ các bước đầu tiên của bạn đã được xóa thành công.",
    error: "Lỗi",
    clearProgressError: "Không thể xóa tiến độ. Vui lòng thử lại."
  },
  he: {
    title: "מסע הלמידה",
    subtitle: "שלוט בשפה שלך צעד אחר צעד",
    progress: "התקדמות",
    completed: "הושלמו",
    of: "מתוך",
    loading: "טוען את מסע הלמידה שלך...",
    noSteps: "אין צעדי למידה זמינים כרגע.",
    clearProgress: "נקה התקדמות",
    clearProgressMessage: "האם אתה בטוח שברצונך למחוק את כל ההתקדמות שלך בצעדים הראשונים? לא ניתן לבטל פעולה זו.",
    cancel: "ביטול",
    progressCleared: "ההתקדמות נוקתה",
    progressClearedMessage: "ההתקדמות שלך בצעדים הראשונים נוקתה בהצלחה.",
    error: "שגיאה",
    clearProgressError: "נכשל בניקוי ההתקדמות. אנא נסה שוב."
  }
};

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

// Function to add babyStepsPath to a locale file
function addBabyStepsPathTranslation(langCode) {
  const filePath = path.join(localesDir, `${langCode}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${langCode}.json not found, skipping...`);
    return;
  }

  try {
    // Read the existing file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    // Check if babyStepsPath already exists
    if (jsonData.screens && jsonData.screens.babyStepsPath) {
      console.log(`ℹ️  ${langCode}.json already has babyStepsPath, skipping...`);
      return;
    }

    // Add babyStepsPath section
    if (!jsonData.screens) {
      jsonData.screens = {};
    }

    jsonData.screens.babyStepsPath = translations[langCode] || translations['en'];

    // Write back to file with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2) + '\n');
    console.log(`✅ Added babyStepsPath to ${langCode}.json`);
  } catch (error) {
    console.error(`❌ Error processing ${langCode}.json:`, error.message);
  }
}

// Process all languages
console.log('Adding babyStepsPath translations to all locale files...\n');

const languages = Object.keys(translations);
languages.forEach(lang => {
  addBabyStepsPathTranslation(lang);
});

console.log('\n✨ Done! All translations have been added.');
