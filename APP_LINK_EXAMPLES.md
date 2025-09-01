# App Link Examples for HelloLingo

These are example app links you can use to test your app links functionality. Copy and paste these URLs into your browser or share them to test if they open your app correctly.

## Video Links

### Basic Video Link
```
https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ&title=Rick%20Astley%20-%20Never%20Gonna%20Give%20You%20Up
```

### Video with Special Characters in Title
```
https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3D9bZkp7q19f0&title=PSY%20-%20GANGNAM%20STYLE%20%28%EA%B0%95%EB%82%A8%EC%8A%A4%ED%83%80%EC%9D%BC%29%20M%2FV
```

### Educational Video
```
https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3D3d6DsjIBzJ4&title=Learn%20English%20-%20Basic%20Conversation%20for%20Beginners
```

### Language Learning Video
```
https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3D2Y9mUq-wGyo&title=Spanish%20for%20Beginners%20-%20Lesson%201%20%28Greetings%20and%20Introductions%29
```

### French Learning Video
```
https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3DkA5j9U9mN3Y&title=Learn%20French%20in%2025%20Minutes%20-%20All%20the%20Basics%20You%20Need
```

## Surf Links

### Basic Surf Link
```
https://hellolingo.app/surf?url=https%3A//www.duolingo.com
```

### Language Learning Website
```
https://hellolingo.app/surf?url=https%3A//www.babbel.com
```

### News Website (for reading practice)
```
https://hellolingo.app/surf?url=https%3A//www.bbc.com/news
```

### Dictionary Website
```
https://hellolingo.app/surf?url=https%3A//dictionary.cambridge.org
```

### Grammar Website
```
https://hellolingo.app/surf?url=https%3A//www.grammarly.com
```

## Test Links for Development

### Minimal Video Link (no title)
```
https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ
```

### Video with Empty Title
```
https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ&title=
```

### Invalid URL (for error testing)
```
https://hellolingo.app/video?url=invalid-url&title=Test%20Title
```

### Missing URL Parameter
```
https://hellolingo.app/video?title=Test%20Title
```

## How to Test These Links

### 1. Browser Testing
1. Copy any of the links above
2. Paste it into your browser's address bar
3. Press Enter
4. Your app should open automatically (if installed)
5. If app is not installed, it should show a fallback page

### 2. Share Testing
1. Open your app
2. Go to the Video or Surf screen
3. Use the share functionality
4. Share the generated link with yourself
5. Click the shared link to test

### 3. Direct Testing
1. Install your app on a device
2. Copy a link from above
3. Send it to yourself via email, SMS, or messaging app
4. Click the link
5. Verify it opens your app

### 4. Command Line Testing (Android)
```bash
# Test video link
adb shell am start -W -a android.intent.action.VIEW -d "https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ&title=Test%20Video" com.hellolingo

# Test surf link
adb shell am start -W -a android.intent.action.VIEW -d "https://hellolingo.app/surf?url=https%3A//www.duolingo.com" com.hellolingo
```

## URL Encoding Reference

When creating your own links, remember to URL-encode special characters:

| Character | Encoded |
|-----------|---------|
| Space | `%20` |
| & | `%26` |
| = | `%3D` |
| ? | `%3F` |
| / | `%2F` |
| : | `%3A` |
| ( | `%28` |
| ) | `%29` |
| ' | `%27` |
| " | `%22` |

## Example: Creating Your Own Link

Original YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
Title: `My Favorite Song`

Encoded URL: `https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ`
Encoded Title: `My%20Favorite%20Song`

Final App Link:
```
https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ&title=My%20Favorite%20Song
```

## Troubleshooting

### Link Doesn't Open App
1. Verify the `assetlinks.json` file is accessible at `https://hellolingo.app/.well-known/assetlinks.json`
2. Check that your app is installed and the package name matches
3. Ensure you're using the correct certificate fingerprint
4. Try clearing your browser's app link cache

### App Opens but Shows Wrong Content
1. Check that your app's deep link handling is working correctly
2. Verify the URL parsing logic in your app
3. Test with the debug logs enabled

### Link Opens Browser Instead of App
1. Verify the intent filters in your AndroidManifest.xml
2. Check that `android:autoVerify="true"` is set
3. Ensure the domain matches exactly
4. Wait a few minutes for Android to verify the assetlinks.json file
