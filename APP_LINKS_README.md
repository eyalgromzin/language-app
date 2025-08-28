# HelloLingo App Links Support

This document describes the app links functionality implemented for the HelloLingo app with the domain `hellolingo.app`.

## Overview

The app now supports deep linking, allowing users to share and open content directly in the HelloLingo app. When someone clicks on a HelloLingo app link, it will open the app and navigate to the appropriate screen with the shared content.

## Supported Link Types

### 1. Video Links
Share YouTube videos with the HelloLingo app.

**Format:** `https://hellolingo.app/video?url=YOUTUBE_URL&title=VIDEO_TITLE`

**Example:**
```
https://hellolingo.app/video?url=https%3A//www.youtube.com/watch%3Fv%3DdQw4w9WgXcQ&title=Rick%20Astley%20-%20Never%20Gonna%20Give%20You%20Up
```

**Parameters:**
- `url` (required): The YouTube video URL
- `title` (optional): The video title

### 2. Surf Links
Share web pages with the HelloLingo app's surf feature.

**Format:** `https://hellolingo.app/surf?url=WEB_URL`

**Example:**
```
https://hellolingo.app/surf?url=https%3A//www.example.com
```

**Parameters:**
- `url` (required): The web page URL to open

## Implementation Details

### Android Configuration
Added intent filters in `android/app/src/main/AndroidManifest.xml`:
```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" />
    <data android:host="hellolingo.app" />
</intent-filter>
```

### iOS Configuration
Added URL schemes in `ios/LanguageLearn/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
         <string>hellolingo.app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>https</string>
      <string>http</string>
    </array>
  </dict>
</array>
```

### React Native Implementation

#### Linking Service (`src/services/linkingService.ts`)
- `parseAppLink(url)`: Parses incoming app links
- `generateVideoShareUrl(videoUrl, title)`: Generates shareable video links
- `generateSurfShareUrl(surfUrl)`: Generates shareable surf links
- `shareVideo(videoUrl, title)`: Shares video with native share dialog
- `shareSurfUrl(surfUrl)`: Shares surf URL with native share dialog

#### Deep Link Handling
- Added linking configuration in `App.tsx`
- Deep links are handled in the `MainTabs` component
- Video links navigate to the Video screen with the video URL
- Surf links navigate to the Surf screen with the web URL

## Share Functionality

### Video Screen
- Added share button in the search bar
- Share button appears when a valid video URL is loaded
- Uses the native share dialog to share HelloLingo app links

### Surf Screen
- Added share option in the options menu
- Share option appears when a web page is loaded
- Uses the native share dialog to share HelloLingo app links

## Testing

Run the test file to see examples:
```bash
node test-app-links.js
```

This will generate example URLs and show how the parsing works.

## Usage Examples

### Sharing a Video
1. Open a YouTube video in the HelloLingo app
2. Tap the share button in the search bar
3. Choose how to share (message, email, social media, etc.)
4. Recipients can tap the link to open the video directly in HelloLingo

### Sharing a Web Page
1. Open a web page in the HelloLingo app's surf feature
2. Tap the options menu (three dots)
3. Tap "Share page"
4. Choose how to share
5. Recipients can tap the link to open the page directly in HelloLingo

## Technical Notes

- Links use URL encoding for special characters
- The app handles both initial app launch from links and incoming links while the app is running
- Deep links are processed through React Navigation's linking system
- Share functionality uses React Native's native Share API
- Error handling is implemented for invalid URLs and failed sharing attempts

## Future Enhancements

- Add support for sharing practice sessions
- Add support for sharing word lists
- Add analytics for link usage
- Add custom link previews for social media sharing
