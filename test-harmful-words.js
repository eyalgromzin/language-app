// Simple test script to verify harmful words feature
const harmfulWords = [
  // Porn-related words
  'porn', 'pornography', 'xxx', 'adult', 'sex', 'sexual', 'nude', 'naked', 'erotic',
  'pornhub', 'xvideos', 'xnxx', 'redtube', 'youporn', 'tube8', 'spankbang',
  
  // Palestine and war-related words
  'palestine', 'palestinian', 'gaza', 'hamas', 'israel', 'israeli', 'war', 'bomb',
  'terrorist', 'terrorism', 'jihad', 'hezbollah', 'fatah', 'plo', 'intifada',
  'occupation', 'settlement', 'west bank', 'jerusalem', 'tel aviv', 'ramallah',
  
  // Curses and harmful words
  'fuck', 'shit', 'bitch', 'asshole', 'dick', 'cock', 'pussy', 'cunt', 'whore',
  'slut', 'bastard', 'motherfucker', 'fucker', 'damn', 'hell', 'god damn',
  
  // Suicide and bad feelings
  'suicide', 'kill myself', 'self harm', 'cutting', 'depression', 'anxiety',
  'hopeless', 'worthless', 'die', 'death', 'dead', 'hate myself', 'end it all',
  'no reason to live', 'better off dead', 'want to die', 'tired of living'
];

function checkUrl(url) {
  const lowerUrl = url.toLowerCase();
  const matchedWords = harmfulWords.filter(word => lowerUrl.includes(word.toLowerCase()));
  
  return {
    isHarmful: matchedWords.length > 0,
    matchedWords
  };
}

// Test cases
const testUrls = [
  'https://example.com/educational-content',
  'https://pornhub.com/video123',
  'https://news.com/war-updates',
  'https://example.com/fuck-this',
  'https://health.com/suicide-prevention',
  'https://example.com/palestine-news',
  'https://example.com/learning-english'
];

console.log('Testing harmful words filter:');
console.log('=============================\n');

testUrls.forEach(url => {
  const result = checkUrl(url);
  console.log(`URL: ${url}`);
  console.log(`Harmful: ${result.isHarmful}`);
  if (result.matchedWords.length > 0) {
    console.log(`Matched words: ${result.matchedWords.join(', ')}`);
  }
  console.log('---');
});

console.log('\nTest completed!');
