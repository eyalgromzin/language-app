const fs = require('fs');
const path = require('path');

// Get all English files as reference
const englishDir = path.join(__dirname, 'en');
const englishFiles = fs.readdirSync(englishDir)
  .filter(file => file.endsWith('.json') && file !== 'index.json')
  .sort();

console.log('📚 English reference files:');
englishFiles.forEach(file => console.log(`  ${file}`));
console.log(`\nTotal English files: ${englishFiles.length}\n`);

// Check each language directory
const languageDirs = fs.readdirSync(__dirname)
  .filter(item => fs.statSync(path.join(__dirname, item)).isDirectory())
  .filter(dir => dir !== 'en')
  .sort();

console.log('🔍 Translation Status Check:\n');

languageDirs.forEach(langDir => {
  const langPath = path.join(__dirname, langDir);
  const langFiles = fs.readdirSync(langPath)
    .filter(file => file.endsWith('.json') && file !== 'index.json')
    .sort();
  
  const missingFiles = englishFiles.filter(file => !langFiles.includes(file));
  const extraFiles = langFiles.filter(file => !englishFiles.includes(file));
  
  console.log(`🌍 ${langDir.toUpperCase()} (${langFiles.length}/${englishFiles.length} files):`);
  
  if (missingFiles.length > 0) {
    console.log(`  ❌ Missing: ${missingFiles.join(', ')}`);
  }
  
  if (extraFiles.length > 0) {
    console.log(`  ⚠️  Extra: ${extraFiles.join(', ')}`);
  }
  
  if (missingFiles.length === 0 && extraFiles.length === 0) {
    console.log(`  ✅ Complete match with English`);
  }
  
  console.log('');
});

console.log('🎯 Summary:');
console.log(`- Reference language: English (${englishFiles.length} files)`);
console.log(`- Languages checked: ${languageDirs.length}`);
console.log(`- Languages with complete translations: ${languageDirs.filter(lang => {
  const langPath = path.join(__dirname, lang);
  const langFiles = fs.readdirSync(langPath)
    .filter(file => file.endsWith('.json') && file !== 'index.json');
  return langFiles.length === englishFiles.length && 
         englishFiles.every(file => langFiles.includes(file));
}).length}`);
