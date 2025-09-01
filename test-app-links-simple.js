// Simple test script for HelloLingo app links
// This demonstrates how to generate and test app links

// Mock linking service functions
const linkingService = {
  generateVideoShareUrl: (videoUrl, title) => {
    const baseUrl = 'https://hellolingo.app/video';
    const params = new URLSearchParams();
    params.append('url', encodeURIComponent(videoUrl));
    if (title) {
      params.append('title', encodeURIComponent(title));
    }
    return `${baseUrl}?${params.toString()}`;
  },

  generateSurfShareUrl: (surfUrl) => {
    const baseUrl = 'https://hellolingo.app/surf';
    const params = new URLSearchParams();
    params.append('url', encodeURIComponent(surfUrl));
    return `${baseUrl}?${params.toString()}`;
  },

  parseAppLink: (url) => {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.hostname !== 'hellolingo.app') {
        return null;
      }

      const path = urlObj.pathname;
      const searchParams = urlObj.searchParams;

      if (path === '/video') {
        const videoUrl = searchParams.get('url');
        const title = searchParams.get('title');
        
        if (videoUrl) {
          return {
            type: 'video',
            url: decodeURIComponent(videoUrl),
            title: title ? decodeURIComponent(title) : undefined
          };
        }
      }

      if (path === '/surf') {
        const surfUrl = searchParams.get('url');
        
        if (surfUrl) {
          return {
            type: 'surf',
            url: decodeURIComponent(surfUrl)
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing app link:', error);
      return null;
    }
  }
};

console.log('=== HELLOLINGO APP LINK EXAMPLES ===\n');

// Video link examples
console.log('📹 VIDEO LINK EXAMPLES:');
console.log('─────────────────────────────────');

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
  },
  {
    url: 'https://www.youtube.com/watch?v=2Y9mUq-wGyo',
    title: 'Spanish for Beginners - Lesson 1 (Greetings and Introductions)'
  }
];

videoExamples.forEach((example, index) => {
  console.log(`\n${index + 1}. Video Example:`);
  console.log(`   Original: ${example.url}`);
  console.log(`   Title: ${example.title}`);
  
  const appLink = linkingService.generateVideoShareUrl(example.url, example.title);
  console.log(`   App Link: ${appLink}`);
  
  const parsed = linkingService.parseAppLink(appLink);
  console.log(`   Parsed: ${JSON.stringify(parsed, null, 2)}`);
});

// Surf link examples
console.log('\n\n🌊 SURF LINK EXAMPLES:');
console.log('─────────────────────────────────');

const surfExamples = [
  'https://www.duolingo.com',
  'https://www.babbel.com',
  'https://www.bbc.com/news',
  'https://dictionary.cambridge.org',
  'https://www.grammarly.com'
];

surfExamples.forEach((url, index) => {
  console.log(`\n${index + 1}. Surf Example:`);
  console.log(`   Original: ${url}`);
  
  const appLink = linkingService.generateSurfShareUrl(url);
  console.log(`   App Link: ${appLink}`);
  
  const parsed = linkingService.parseAppLink(appLink);
  console.log(`   Parsed: ${JSON.stringify(parsed, null, 2)}`);
});

// Quick test examples
console.log('\n\n🚀 QUICK TEST LINKS:');
console.log('─────────────────────────────────');

const quickTests = [
  {
    name: 'Basic Video',
    link: 'https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ&title=Test%20Video'
  },
  {
    name: 'Basic Surf',
    link: 'https://hellolingo.app/surf?url=https%3A//www.duolingo.com'
  },
  {
    name: 'Video without title',
    link: 'https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ'
  }
];

quickTests.forEach((test, index) => {
  console.log(`\n${index + 1}. ${test.name}:`);
  console.log(`   ${test.link}`);
});

console.log('\n\n📋 HOW TO TEST:');
console.log('─────────────────────────────────');
console.log('1. Copy any of the app links above');
console.log('2. Paste it into your browser address bar');
console.log('3. Press Enter');
console.log('4. Your HelloLingo app should open automatically (if installed)');
console.log('5. If app is not installed, it will open in the browser');

console.log('\n\n🔧 ADB TESTING (for developers):');
console.log('─────────────────────────────────');
console.log('# Test video link:');
console.log('adb shell am start -W -a android.intent.action.VIEW -d "https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ&title=Test%20Video" com.hellolingo');
console.log('\n# Test surf link:');
console.log('adb shell am start -W -a android.intent.action.VIEW -d "https://hellolingo.app/surf?url=https%3A//www.duolingo.com" com.hellolingo');

console.log('\n\n✅ READY TO TEST!');
console.log('Make sure you have:');
console.log('1. Uploaded assetlinks.json to https://hellolingo.app/.well-known/assetlinks.json');
console.log('2. Installed your app on a device');
console.log('3. Waited a few minutes for Android to verify the assetlinks.json file');
