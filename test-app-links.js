const linkingService = require('./src/services/linkingService');

// Test video links
console.log('=== VIDEO LINK EXAMPLES ===');
console.log();

const videoExamples = [
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up'
  },
  {
    url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    title: 'PSY - GANGNAM STYLE (강남스타일) M/V'
  },
  {
    url: 'https://www.youtube.com/watch?v=3d6DsjIBzJ4',
    title: 'Learn English - Basic Conversation for Beginners'
  }
];

videoExamples.forEach((example, index) => {
  console.log(`Example ${index + 1}:`);
  console.log(`Original URL: ${example.url}`);
  console.log(`Title: ${example.title}`);
  
  try {
    const shareUrl = linkingService.generateVideoShareUrl(example.url, example.title);
    console.log(`Generated App Link: ${shareUrl}`);
    
    // Test parsing
    const parsed = linkingService.parseAppLink(shareUrl);
    console.log(`Parsed Result:`, parsed);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log();
});

// Test surf links
console.log('=== SURF LINK EXAMPLES ===');
console.log();

const surfExamples = [
  'https://www.duolingo.com',
  'https://www.babbel.com',
  'https://www.bbc.com/news',
  'https://dictionary.cambridge.org'
];

surfExamples.forEach((url, index) => {
  console.log(`Example ${index + 1}:`);
  console.log(`Original URL: ${url}`);
  
  try {
    const shareUrl = linkingService.generateSurfShareUrl(url);
    console.log(`Generated App Link: ${shareUrl}`);
    
    // Test parsing
    const parsed = linkingService.parseAppLink(shareUrl);
    console.log(`Parsed Result:`, parsed);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log();
});

// Test invalid links
console.log('=== INVALID LINK TESTS ===');
console.log();

const invalidLinks = [
  'https://hellolingo.app/invalid',
  'https://hellolingo.app/video',
  'https://hellolingo.app/video?invalid=param',
  'https://example.com/video?url=test'
];

invalidLinks.forEach((link, index) => {
  console.log(`Invalid Link ${index + 1}: ${link}`);
  try {
    const parsed = linkingService.parseAppLink(link);
    console.log(`Parsed Result:`, parsed);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  console.log();
});

console.log('=== TESTING COMPLETE ===');
console.log();
console.log('To test these links:');
console.log('1. Copy any of the generated app links above');
console.log('2. Paste it into your browser');
console.log('3. Your app should open automatically (if installed)');
console.log();
console.log('Or use ADB to test:');
console.log('adb shell am start -W -a android.intent.action.VIEW -d "APP_LINK_HERE" com.languagelearn');
