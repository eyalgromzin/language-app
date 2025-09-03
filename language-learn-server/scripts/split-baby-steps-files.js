const fs = require('fs');
const path = require('path');

// Path to the baby-steps directory
const babyStepsDir = path.join(__dirname, '..', 'src', 'baby-steps');

// Function to split a file into two parts
function splitFile(filePath, fileName) {
  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Extract words and sentences
    const words = data.items.filter(item => item.type === 'word');
    const sentences = data.items.filter(item => item.type === 'sentence');
    
    // Get the number and name from the filename
    const match = fileName.match(/^(\d+)_(.+)\.json$/);
    if (!match) {
      console.log(`Skipping ${fileName} - doesn't match expected format`);
      return;
    }
    
    const number = match[1];
    const name = match[2];
    
    // Split words and sentences into two groups
    const words1 = words.slice(0, 5);
    const words2 = words.slice(5, 10);
    const sentences1 = sentences.slice(0, 5);
    const sentences2 = sentences.slice(5, 10);
    
    // Create first file content
    const file1Content = {
      ...data,
      id: `${data.id}_1`,
      title: `${data.title} (Part 1)`,
      items: [...words1, ...sentences1]
    };
    
    // Create second file content
    const file2Content = {
      ...data,
      id: `${data.id}_2`,
      title: `${data.title} (Part 2)`,
      items: [...words2, ...sentences2]
    };
    
    // Write first file
    const file1Path = path.join(path.dirname(filePath), `${number}_${name}_1.json`);
    fs.writeFileSync(file1Path, JSON.stringify(file1Content, null, 2));
    console.log(`Created: ${number}_${name}_1.json (${words1.length} words, ${sentences1.length} sentences)`);
    
    // Write second file
    const file2Path = path.join(path.dirname(filePath), `${number}_${name}_2.json`);
    fs.writeFileSync(file2Path, JSON.stringify(file2Content, null, 2));
    console.log(`Created: ${number}_${name}_2.json (${words2.length} words, ${sentences2.length} sentences)`);
    
    // Remove original file
    fs.unlinkSync(filePath);
    console.log(`Removed original: ${fileName}`);
    
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error.message);
  }
}

// Function to process all files in a directory
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(itemPath);
    } else if (stat.isFile() && item.endsWith('.json') && item !== 'index.json') {
      // Process JSON files (excluding index.json)
      splitFile(itemPath, item);
    }
  }
}

// Main execution
console.log('Starting to split baby-steps files...');
console.log(`Processing directory: ${babyStepsDir}`);

// Process the baby-steps directory
processDirectory(babyStepsDir);

console.log('Finished splitting baby-steps files!');
