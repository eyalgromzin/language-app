const fs = require('fs');
const path = require('path');

// English translations for bookReader
const englishBookReaderTranslations = {
  "addToFavourites": "Add to Favourites",
  "addToFavouritesQuestion": "Would you like to add a download URL for all to use also?",
  "no": "No",
  "yes": "Yes",
  "failedToDisplayBook": "Failed to display book",
  "addedToLibrary": "Added to library",
  "added": "Added",
  "addedToFavourites": "Added to favourites",
  "success": "Success",
  "bookAddedToFavourites": "Book added to favourites"
};

// Manual translations for key languages
const translations = {
  "es": {
    "addToFavourites": "Agregar a Favoritos",
    "addToFavouritesQuestion": "¿Le gustaría agregar una URL de descarga para que todos la usen también?",
    "no": "No",
    "yes": "Sí",
    "failedToDisplayBook": "No se pudo mostrar el libro",
    "addedToLibrary": "Agregado a la biblioteca",
    "added": "Agregado",
    "addedToFavourites": "Agregado a favoritos",
    "success": "Éxito",
    "bookAddedToFavourites": "Libro agregado a favoritos"
  },
  "fr": {
    "addToFavourites": "Ajouter aux favoris",
    "addToFavouritesQuestion": "Voulez-vous ajouter une URL de téléchargement pour que tous l'utilisent aussi ?",
    "no": "Non",
    "yes": "Oui",
    "failedToDisplayBook": "Impossible d'afficher le livre",
    "addedToLibrary": "Ajouté à la bibliothèque",
    "added": "Ajouté",
    "addedToFavourites": "Ajouté aux favoris",
    "success": "Succès",
    "bookAddedToFavourites": "Livre ajouté aux favoris"
  },
  "de": {
    "addToFavourites": "Zu Favoriten hinzufügen",
    "addToFavouritesQuestion": "Möchten Sie auch eine Download-URL hinzufügen, die alle verwenden können?",
    "no": "Nein",
    "yes": "Ja",
    "failedToDisplayBook": "Buch konnte nicht angezeigt werden",
    "addedToLibrary": "Zur Bibliothek hinzugefügt",
    "added": "Hinzugefügt",
    "addedToFavourites": "Zu Favoriten hinzugefügt",
    "success": "Erfolg",
    "bookAddedToFavourites": "Buch zu Favoriten hinzugefügt"
  },
  "it": {
    "addToFavourites": "Aggiungi ai preferiti",
    "addToFavouritesQuestion": "Vorresti aggiungere un URL di download per l'uso di tutti?",
    "no": "No",
    "yes": "Sì",
    "failedToDisplayBook": "Impossibile visualizzare il libro",
    "addedToLibrary": "Aggiunto alla biblioteca",
    "added": "Aggiunto",
    "addedToFavourites": "Aggiunto ai preferiti",
    "success": "Successo",
    "bookAddedToFavourites": "Libro aggiunto ai preferiti"
  },
  "pt": {
    "addToFavourites": "Adicionar aos Favoritos",
    "addToFavouritesQuestion": "Gostaria de adicionar uma URL de download para todos usarem também?",
    "no": "Não",
    "yes": "Sim",
    "failedToDisplayBook": "Falha ao exibir o livro",
    "addedToLibrary": "Adicionado à biblioteca",
    "added": "Adicionado",
    "addedToFavourites": "Adicionado aos favoritos",
    "success": "Sucesso",
    "bookAddedToFavourites": "Livro adicionado aos favoritos"
  },
  "ru": {
    "addToFavourites": "Добавить в избранное",
    "addToFavouritesQuestion": "Хотите ли вы также добавить URL для скачивания для использования всеми?",
    "no": "Нет",
    "yes": "Да",
    "failedToDisplayBook": "Не удалось отобразить книгу",
    "addedToLibrary": "Добавлено в библиотеку",
    "added": "Добавлено",
    "addedToFavourites": "Добавлено в избранное",
    "success": "Успех",
    "bookAddedToFavourites": "Книга добавлена в избранное"
  },
  "he": {
    "addToFavourites": "הוסף למועדפים",
    "addToFavouritesQuestion": "האם תרצה להוסיף כתובת URL להורדה לשימוש של כולם גם?",
    "no": "לא",
    "yes": "כן",
    "failedToDisplayBook": "כישלון בהצגת הספר",
    "addedToLibrary": "נוסף לספרייה",
    "added": "נוסף",
    "addedToFavourites": "נוסף למועדפים",
    "success": "הצלחה",
    "bookAddedToFavourites": "הספר נוסף למועדפים"
  },
  "hi": {
    "addToFavourites": "पसंदीदा में जोड़ें",
    "addToFavouritesQuestion": "क्या आप सभी के उपयोग के लिए एक डाउनलोड URL भी जोड़ना चाहेंगे?",
    "no": "नहीं",
    "yes": "हां",
    "failedToDisplayBook": "पुस्तक प्रदर्शित करने में विफल",
    "addedToLibrary": "लाइब्रेरी में जोड़ा गया",
    "added": "जोड़ा गया",
    "addedToFavourites": "पसंदीदा में जोड़ा गया",
    "success": "सफलता",
    "bookAddedToFavourites": "पुस्तक पसंदीदा में जोड़ी गई"
  },
  "pl": {
    "addToFavourites": "Dodaj do ulubionych",
    "addToFavouritesQuestion": "Czy chciałbyś dodać adres URL pobierania do użytku wszystkich?",
    "no": "Nie",
    "yes": "Tak",
    "failedToDisplayBook": "Nie udało się wyświetlić książkę",
    "addedToLibrary": "Dodano do biblioteki",
    "added": "Dodano",
    "addedToFavourites": "Dodano do ulubionych",
    "success": "Powodzenie",
    "bookAddedToFavourites": "Książka dodana do ulubionych"
  },
  "nl": {
    "addToFavourites": "Toevoegen aan Favorieten",
    "addToFavouritesQuestion": "Wil je ook een download-URL toevoegen voor iedereen?",
    "no": "Nee",
    "yes": "Ja",
    "failedToDisplayBook": "Kan het boek niet weergeven",
    "addedToLibrary": "Toegevoegd aan bibliotheek",
    "added": "Toegevoegd",
    "addedToFavourites": "Toegevoegd aan favorieten",
    "success": "Succes",
    "bookAddedToFavourites": "Boek toegevoegd aan favorieten"
  },
  "el": {
    "addToFavourites": "Προσθήκη στα Αγαπημένα",
    "addToFavouritesQuestion": "Θα ήθελες να προσθέσεις μια διεύθυνση URL λήψης για χρήση από όλους;",
    "no": "Όχι",
    "yes": "Ναι",
    "failedToDisplayBook": "Αποτυχία εμφάνισης του βιβλίου",
    "addedToLibrary": "Προστέθηκε στη βιβλιοθήκη",
    "added": "Προστέθηκε",
    "addedToFavourites": "Προστέθηκε στα αγαπημένα",
    "success": "Επιτυχία",
    "bookAddedToFavourites": "Το βιβλίο προστέθηκε στα αγαπημένα"
  },
  "sv": {
    "addToFavourites": "Lägg till i Favoriter",
    "addToFavouritesQuestion": "Vill du också lägga till en nedladdnings-URL för alla att använda?",
    "no": "Nej",
    "yes": "Ja",
    "failedToDisplayBook": "Det gick inte att visa boken",
    "addedToLibrary": "Tillagd i biblioteket",
    "added": "Tillagd",
    "addedToFavourites": "Tillagd i favoriter",
    "success": "Framgång",
    "bookAddedToFavourites": "Boken lades till i favoriter"
  },
  "no": {
    "addToFavourites": "Legg til i Favoritter",
    "addToFavouritesQuestion": "Vil du også legge til en nedlastings-URL for alle å bruke?",
    "no": "Nei",
    "yes": "Ja",
    "failedToDisplayBook": "Kunne ikke vise boken",
    "addedToLibrary": "Lagt til i biblioteket",
    "added": "Lagt til",
    "addedToFavourites": "Lagt til i favoritter",
    "success": "Suksess",
    "bookAddedToFavourites": "Boken ble lagt til i favoritter"
  },
  "fi": {
    "addToFavourites": "Lisää suosikkeihin",
    "addToFavouritesQuestion": "Haluatko myös lisätä latauslinkin kaikkien käyttöön?",
    "no": "Ei",
    "yes": "Kyllä",
    "failedToDisplayBook": "Kirjan näyttäminen epäonnistui",
    "addedToLibrary": "Lisätty kirjastoon",
    "added": "Lisätty",
    "addedToFavourites": "Lisätty suosikkeihin",
    "success": "Onnistui",
    "bookAddedToFavourites": "Kirja lisätty suosikkeihin"
  },
  "cs": {
    "addToFavourites": "Přidat do Oblíbených",
    "addToFavouritesQuestion": "Chcete také přidat URL ke stažení, aby ji mohli používat všichni?",
    "no": "Ne",
    "yes": "Ano",
    "failedToDisplayBook": "Selhalo zobrazení knihy",
    "addedToLibrary": "Přidáno do knihovny",
    "added": "Přidáno",
    "addedToFavourites": "Přidáno do oblíbených",
    "success": "Úspěch",
    "bookAddedToFavourites": "Kniha přidána do oblíbených"
  },
  "uk": {
    "addToFavourites": "Додати до вибраного",
    "addToFavouritesQuestion": "Чи хочете ви також додати URL для завантаження для використання всіма?",
    "no": "Ні",
    "yes": "Так",
    "failedToDisplayBook": "Не вдалося відобразити книгу",
    "addedToLibrary": "Додано в бібліотеку",
    "added": "Додано",
    "addedToFavourites": "Додано до вибраного",
    "success": "Успіх",
    "bookAddedToFavourites": "Книга додана до вибраного"
  },
  "th": {
    "addToFavourites": "เพิ่มเข้าที่โปรด",
    "addToFavouritesQuestion": "คุณต้องการเพิ่ม URL การดาวน์โหลดสำหรับให้ทุกคนใช้งานได้หรือไม่?",
    "no": "ไม่",
    "yes": "ใช่",
    "failedToDisplayBook": "ไม่สามารถแสดงหนังสือได้",
    "addedToLibrary": "เพิ่มเข้าห้องสมุดแล้ว",
    "added": "เพิ่มแล้ว",
    "addedToFavourites": "เพิ่มเข้าที่โปรดแล้ว",
    "success": "สำเร็จ",
    "bookAddedToFavourites": "เพิ่มหนังสือเข้าที่โปรดแล้ว"
  },
  "vi": {
    "addToFavourites": "Thêm vào Yêu thích",
    "addToFavouritesQuestion": "Bạn có muốn thêm URL tải xuống để mọi người sử dụng cũng không?",
    "no": "Không",
    "yes": "Có",
    "failedToDisplayBook": "Không thể hiển thị sách",
    "addedToLibrary": "Đã thêm vào thư viện",
    "added": "Đã thêm",
    "addedToFavourites": "Đã thêm vào yêu thích",
    "success": "Thành công",
    "bookAddedToFavourites": "Sách đã được thêm vào yêu thích"
  },
  "en": englishBookReaderTranslations
};

const localesDir = path.join(__dirname, '../src/i18n/locales');
const languages = ['es', 'he', 'fr', 'de', 'it', 'pt', 'ru', 'hi', 'pl', 'nl', 'el', 'sv', 'no', 'fi', 'cs', 'uk', 'th', 'vi', 'en'];

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Ensure the screens.books.bookReader path exists
  if (!content.screens) content.screens = {};
  if (!content.screens.books) content.screens.books = {};
  if (!content.screens.books.bookReader) {
    content.screens.books.bookReader = translations[lang] || englishBookReaderTranslations;
  } else {
    // Update with new translations
    content.screens.books.bookReader = { ...content.screens.books.bookReader, ...translations[lang] };
  }
  
  // Write back with proper formatting
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n', 'utf8');
  console.log(`Updated ${lang}.json`);
});

console.log('All translation files updated with bookReader translations!');
