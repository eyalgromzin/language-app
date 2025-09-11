const fs = require('fs');
const path = require('path');

// Base English translations
const baseTranslations = {
  "navigation": {
    "surf": "Surf",
    "video": "Video", 
    "practice": "Practice",
    "babySteps": "Baby Steps",
    "categories": "Categories",
    "library": "Library",
    "books": "Books"
  },
  "screens": {
    "home": {
      "title": "HelloLingo",
      "subtitle": "Let's personalize your language learning journey"
    },
    "settings": {
      "title": "Settings",
      "subtitle": "Customize your learning experience",
      "languageSettings": "Language Settings",
      "learningLanguage": "Learning Language",
      "learningLanguageDescription": "The language you want to learn",
      "nativeLanguage": "Native Language",
      "nativeLanguageDescription": "Your primary language",
      "practiceSettings": "Practice Settings",
      "practiceCompletion": "Practice Completion",
      "practiceCompletionDescription": "Number of correct answers needed to complete a practice type",
      "wordMastery": "Word Mastery",
      "wordMasteryDescription": "Total correct answers before a word is considered mastered",
      "account": "Account",
      "signOut": "Sign Out",
      "logout": "Logout",
      "logoutConfirm": "Are you sure you want to logout?",
      "cancel": "Cancel",
      "logoutError": "There was an error logging out. Please try again."
    },
    "startup": {
      "welcome": "Welcome to HelloLingo!",
      "personalize": "Let's personalize your language learning journey",
      "languageSetup": "Language Setup",
      "whichLanguageToLearn": "Which language do you want to learn?",
      "yourNativeLanguage": "Your native language",
      "selectLanguage": "Select a language...",
      "selectNativeLanguage": "Select your native language...",
      "selectLanguages": "Select languages",
      "chooseBothLanguages": "Please choose both languages to continue.",
      "startLearning": "Start Learning",
      "settingUpAccount": "Setting up your account...",
      "error": "Error",
      "failedToSavePreferences": "Failed to save preferences. Please try again.",
      "loadingLanguages": "Loading available languages...",
      "loadingLanguageOptions": "Loading language options...",
      "noLanguagesAvailable": "No languages available"
    },
    "video": {
      "searchPlaceholder": "Search...",
      "goButton": "Go",
      "nowPlayingByOthers": "Now playing by other people",
      "enterYouTubeUrl": "Enter a YouTube URL or ID...",
      "history": "History",
      "favouritesList": "Favourites list",
      "moreOptions": "More options"
    },
    "practice": {
      "title": "Practice",
      "missingLetters": "Missing letters",
      "missingWords": "Missing words",
      "matchGame": "Match game",
      "chooseWord": "Choose word",
      "chooseTranslation": "Choose translation",
      "translate": "Translate",
      "memoryGame": "Memory game",
      "hearingPractice": "Hearing practice",
      "formulateSentence": "Formulate sentence",
      "surpriseMe": "Surprise me"
    },
    "library": {
      "title": "Library",
      "loadingResources": "Loading your learning resources..."
    },
    "books": {
      "title": "Books",
      "reader": "Reader"
    },
    "categories": {
      "title": "Categories"
    },
    "myWords": {
      "title": "My Words"
    },
    "progress": {
      "title": "Progress"
    },
    "contactUs": {
      "title": "Contact Us"
    }
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "ok": "OK",
    "yes": "Yes",
    "no": "No",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "add": "Add",
    "remove": "Remove",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "continue": "Continue",
    "finish": "Finish",
    "retry": "Retry",
    "refresh": "Refresh",
    "search": "Search",
    "filter": "Filter",
    "sort": "Sort",
    "select": "Select",
    "choose": "Choose",
    "confirm": "Confirm",
    "warning": "Warning",
    "info": "Info",
    "help": "Help",
    "about": "About",
    "version": "Version",
    "settings": "Settings",
    "preferences": "Preferences",
    "language": "Language",
    "languages": "Languages"
  },
  "menu": {
    "openMenu": "Open menu",
    "myWords": "My Words",
    "progress": "Progress",
    "settings": "Settings",
    "shareApp": "Share App",
    "contactUs": "Contact Us",
    "logout": "Logout",
    "shareMessage": "I am learning languages with HelloLingo! Give it a try and see if it helps you too."
  },
  "alerts": {
    "wordAlreadyExists": "Word already exists",
    "wordAlreadyInList": "is already in your word list.",
    "wordAdded": "Word added!",
    "wordAddedToList": "has been added to your word list.",
    "errorAddingWord": "Failed to add word to your list.",
    "errorOccurred": "An error occurred",
    "tryAgain": "Please try again"
  },
  "notEnoughWords": {
    "readyToLearn": "Ready to Learn?",
    "notEnoughWordsMessage": "Not enough words to practice yet. Add more words in one of the learning options",
    "browseContent": "Browse content",
    "watchVideos": "Watch videos",
    "readBooks": "Read books",
    "wordCategories": "Word categories"
  },
  "surf": {
    "searchPlaceholder": "Search or enter website URL",
    "moreOptions": "More options",
    "setHomepage": "Set Homepage",
    "setHomepageSubtitle": "Set current page as homepage",
    "favouritesList": "Favourites List",
    "favouritesListSubtitle": "View saved websites",
    "sharePage": "Share Page",
    "sharePageSubtitle": "Share this website",
    "reportWebsite": "Report Website",
    "reportWebsiteSubtitle": "Report inappropriate content",
    "noPageToShare": "No page to share",
    "failedToSharePage": "Failed to share page",
    "noPageToReport": "No page to report",
    "websiteReported": "Website Reported",
    "websiteReportedMessage": "Website reported, we're checking it",
    "failedToReportWebsite": "Failed to report website",
    "invalidUrl": "Invalid URL",
    "addedToFavourites": "Added to favourites",
    "accessibilityLabels": {
      "goBack": "Go back",
      "addToFavourites": "Add to favourites",
      "removeFromFavourites": "Remove from favourites",
      "openLibrary": "Open Library",
      "moreOptions": "More options"
    }
  }
};

// Languages to generate (excluding already created ones)
const languagesToGenerate = [
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'hi', name: 'Hindi' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'el', name: 'Greek' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'cs', name: 'Czech' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' }
];

// Create locales directory if it doesn't exist
const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

// Generate translation files
languagesToGenerate.forEach(lang => {
  const filePath = path.join(localesDir, `${lang.code}.json`);
  
  // For now, just copy the English version as a placeholder
  // In a real implementation, you would use a translation service or manual translation
  const translations = JSON.stringify(baseTranslations, null, 2);
  
  fs.writeFileSync(filePath, translations);
  console.log(`Generated ${lang.code}.json`);
});

console.log('Translation files generated successfully!');
console.log('Note: These are placeholder translations. Please replace with actual translations for each language.');
