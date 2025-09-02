const fs = require('fs');
const path = require('path');

// Get all English files as reference
const englishDir = path.join(__dirname, 'en');
const hindiDir = path.join(__dirname, 'hi');

const englishFiles = fs.readdirSync(englishDir)
  .filter(file => file.endsWith('.json') && file !== 'index.json')
  .sort();

console.log('🔍 Checking for missing Hindi translations...\n');

let totalMissingTranslations = 0;
let filesWithMissingTranslations = 0;
const missingTranslations = [];

englishFiles.forEach(file => {
  const englishPath = path.join(englishDir, file);
  const hindiPath = path.join(hindiDir, file);
  
  if (!fs.existsSync(hindiPath)) {
    console.log(`❌ Missing Hindi file: ${file}`);
    return;
  }
  
  try {
    const englishData = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
    const hindiData = JSON.parse(fs.readFileSync(hindiPath, 'utf8'));
    
    if (!englishData.items || !hindiData.items) {
      console.log(`⚠️  Invalid structure in ${file}`);
      return;
    }
    
    const englishItems = englishData.items;
    const hindiItems = hindiData.items;
    
    if (englishItems.length !== hindiItems.length) {
      console.log(`⚠️  ${file}: English has ${englishItems.length} items, Hindi has ${hindiItems.length} items`);
    }
    
    const missingItems = [];
    
    englishItems.forEach((englishItem, index) => {
      const hindiItem = hindiItems[index];
      
      if (!hindiItem) {
        missingItems.push({
          id: englishItem.id,
          english: englishItem.text,
          type: englishItem.type,
          practiceType: englishItem.practiceType
        });
      } else if (hindiItem.id !== englishItem.id) {
        missingItems.push({
          id: englishItem.id,
          english: englishItem.text,
          type: englishItem.type,
          practiceType: englishItem.practiceType
        });
      }
    });
    
    if (missingItems.length > 0) {
      console.log(`📝 ${file}: ${missingItems.length} missing translations`);
      filesWithMissingTranslations++;
      totalMissingTranslations += missingItems.length;
      
      missingItems.forEach(item => {
        missingTranslations.push({
          file: file,
          ...item
        });
      });
    } else {
      console.log(`✅ ${file}: Complete`);
    }
    
  } catch (error) {
    console.log(`❌ Error processing ${file}: ${error.message}`);
  }
});

console.log('\n📊 Summary:');
console.log(`- Total English files: ${englishFiles.length}`);
console.log(`- Files with missing translations: ${filesWithMissingTranslations}`);
console.log(`- Total missing translations: ${totalMissingTranslations}`);

if (missingTranslations.length > 0) {
  console.log('\n🔍 Missing translations by file:');
  
  const byFile = {};
  missingTranslations.forEach(item => {
    if (!byFile[item.file]) {
      byFile[item.file] = [];
    }
    byFile[item.file].push(item);
  });
  
  Object.keys(byFile).forEach(file => {
    console.log(`\n📁 ${file}:`);
    byFile[file].forEach(item => {
      console.log(`  - ${item.id}: "${item.english}" (${item.type})`);
    });
  });
  
  // Save missing translations to a JSON file for the translation script
  const outputPath = path.join(__dirname, 'missing-hindi-translations.json');
  fs.writeFileSync(outputPath, JSON.stringify(missingTranslations, null, 2));
  console.log(`\n💾 Missing translations saved to: ${outputPath}`);
  
  // Generate translation script content
  console.log('\n📝 Translation script content:');
  console.log('Add these to your translation system:');
  
  missingTranslations.forEach(item => {
    console.log(`"${item.english}" -> Hindi translation needed`);
  });
} else {
  console.log('\n🎉 All Hindi translations are complete!');
}
