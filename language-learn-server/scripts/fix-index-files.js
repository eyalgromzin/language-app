const fs = require('fs');
const path = require('path');

function fixIndexFile(languageSymbol) {
  const indexFilePath = path.join(process.cwd(), 'src', 'baby-steps', languageSymbol, 'index.json');
  
  if (!fs.existsSync(indexFilePath)) {
    console.log(`Index file not found for ${languageSymbol}`);
    return;
  }
  
  try {
    const indexData = JSON.parse(fs.readFileSync(indexFilePath, 'utf8'));
    let modified = false;
    
    // Fix the file references in the steps
    for (const step of indexData.steps) {
      const oldFile = step.file;
      
      // Convert from "01_essentials.json" to "01_essentials_1.json" format
      if (oldFile && !oldFile.includes('_1.json') && !oldFile.includes('_2.json')) {
        // Extract the base name without .json
        const baseName = oldFile.replace('.json', '');
        
        // Check if both _1 and _2 versions exist
        const file1Path = path.join(process.cwd(), 'src', 'baby-steps', languageSymbol, `${baseName}_1.json`);
        const file2Path = path.join(process.cwd(), 'src', 'baby-steps', languageSymbol, `${baseName}_2.json`);
        
        if (fs.existsSync(file1Path) && fs.existsSync(file2Path)) {
          // Split into two steps
          const step1 = { ...step };
          const step2 = { ...step };
          
          step1.id = `${baseName}_1`;
          step1.title = `${step.title} - part 1`;
          step1.file = `${baseName}_1.json`;
          
          step2.id = `${baseName}_2`;
          step2.title = `${step.title} - part 2`;
          step2.file = `${baseName}_2.json`;
          
          // Replace the original step with the two new steps
          const stepIndex = indexData.steps.indexOf(step);
          indexData.steps.splice(stepIndex, 1, step1, step2);
          
          modified = true;
          console.log(`Split ${oldFile} into ${step1.file} and ${step2.file}`);
        } else if (fs.existsSync(file1Path)) {
          // Only _1 version exists
          step.id = `${baseName}_1`;
          step.title = `${step.title} - part 1`;
          step.file = `${baseName}_1.json`;
          modified = true;
          console.log(`Updated ${oldFile} to ${step.file}`);
        } else if (fs.existsSync(file2Path)) {
          // Only _2 version exists
          step.id = `${baseName}_2`;
          step.title = `${step.title} - part 2`;
          step.file = `${baseName}_2.json`;
          modified = true;
          console.log(`Updated ${oldFile} to ${step.file}`);
        } else {
          console.log(`No matching files found for ${oldFile}`);
        }
      }
    }
    
    if (modified) {
      // Write the updated index file
      fs.writeFileSync(indexFilePath, JSON.stringify(indexData, null, 2));
      console.log(`✅ Fixed index file for ${languageSymbol}`);
    } else {
      console.log(`No changes needed for ${languageSymbol}`);
    }
    
  } catch (error) {
    console.error(`Error fixing index file for ${languageSymbol}:`, error.message);
  }
}

// Fix the problematic languages
const languagesToFix = ['hi', 'pl', 'th', 'vi'];

console.log('Fixing index files for languages with incorrect file references...\n');

for (const language of languagesToFix) {
  console.log(`\nFixing ${language}:`);
  fixIndexFile(language);
}

console.log('\nIndex file fixes completed!');
