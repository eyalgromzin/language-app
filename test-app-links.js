// Test file to demonstrate HelloLingo app links functionality
// This file shows examples of how to generate and use the app links

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

// Test examples
console.log('=== HelloLingo App Links Test ===\n');

// Test video sharing
const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const videoTitle = 'Rick Astley - Never Gonna Give You Up';
const videoShareUrl = linkingService.generateVideoShareUrl(videoUrl, videoTitle);
console.log('Video Share URL:');
console.log(videoShareUrl);
console.log('');

// Test surf sharing
const surfUrl = 'https://www.example.com';
const surfShareUrl = linkingService.generateSurfShareUrl(surfUrl);
console.log('Surf Share URL:');
console.log(surfShareUrl);
console.log('');

// Test parsing video link
const parsedVideo = linkingService.parseAppLink(videoShareUrl);
console.log('Parsed Video Link:');
console.log(JSON.stringify(parsedVideo, null, 2));
console.log('');

// Test parsing surf link
const parsedSurf = linkingService.parseAppLink(surfShareUrl);
console.log('Parsed Surf Link:');
console.log(JSON.stringify(parsedSurf, null, 2));
console.log('');

// Test invalid link
const invalidUrl = 'https://google.com';
const parsedInvalid = linkingService.parseAppLink(invalidUrl);
console.log('Parsed Invalid Link:');
console.log(parsedInvalid);
console.log('');

console.log('=== Test Complete ===');
console.log('\nTo test the app links:');
console.log('1. Copy one of the generated URLs above');
console.log('2. Open it in a browser or share it');
console.log('3. If the HelloLingo app is installed, it should open and navigate to the appropriate screen');
console.log('4. If the app is not installed, it will open in the browser');
