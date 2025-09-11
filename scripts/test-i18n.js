const fs = require('fs');
const path = require('path');

console.log('🧪 Testing i18n Implementation...\n');

// Test 1: Check if all translation files exist
const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const expectedLanguages = [
  'en', 'es', 'he', 'fr', 'de', 'it', 'pt', 'ru', 'hi', 
  'pl', 'nl', 'el', 'sv', 'no', 'fi', 'cs', 'uk', 'th', 'vi'
];

console.log('📁 Checking translation files...');
let allFilesExist = true;
expectedLanguages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${lang}.json exists`);
  } else {
    console.log(`❌ ${lang}.json missing`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('✅ All translation files exist\n');
} else {
  console.log('❌ Some translation files are missing\n');
}

// Test 2: Check if translation files have required keys
console.log('🔑 Checking translation keys...');
const enFile = path.join(localesDir, 'en.json');
if (fs.existsSync(enFile)) {
  const enTranslations = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  const requiredKeys = [
    'navigation.surf',
    'navigation.video', 
    'navigation.practice',
    'screens.settings.title',
    'screens.startup.welcome',
    'common.loading',
    'menu.myWords'
  ];
  
  let allKeysExist = true;
  requiredKeys.forEach(key => {
    const keys = key.split('.');
    let current = enTranslations;
    let exists = true;
    
    for (const k of keys) {
      if (current && current[k]) {
        current = current[k];
      } else {
        exists = false;
        break;
      }
    }
    
    if (exists) {
      console.log(`✅ Key "${key}" exists`);
    } else {
      console.log(`❌ Key "${key}" missing`);
      allKeysExist = false;
    }
  });
  
  if (allKeysExist) {
    console.log('✅ All required translation keys exist\n');
  } else {
    console.log('❌ Some translation keys are missing\n');
  }
} else {
  console.log('❌ English translation file not found\n');
}

// Test 3: Check if i18n configuration exists
console.log('⚙️ Checking i18n configuration...');
const i18nConfig = path.join(__dirname, '..', 'src', 'i18n', 'index.ts');
if (fs.existsSync(i18nConfig)) {
  console.log('✅ i18n configuration exists');
} else {
  console.log('❌ i18n configuration missing');
}

// Test 4: Check if useTranslation hook exists
console.log('🪝 Checking useTranslation hook...');
const useTranslationHook = path.join(__dirname, '..', 'src', 'hooks', 'useTranslation.ts');
if (fs.existsSync(useTranslationHook)) {
  console.log('✅ useTranslation hook exists');
} else {
  console.log('❌ useTranslation hook missing');
}

console.log('\n🎉 i18n implementation test completed!');
console.log('\n📋 Summary:');
console.log('- Translation files: Check individual results above');
console.log('- Translation keys: Check individual results above');
console.log('- Configuration: Check individual results above');
console.log('- Hook: Check individual results above');
console.log('\n💡 To test language switching:');
console.log('1. Run the app: npm start');
console.log('2. Go to Settings');
console.log('3. Change the "Language" setting');
console.log('4. Verify all text updates immediately');
