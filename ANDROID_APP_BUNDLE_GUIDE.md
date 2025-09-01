# Android App Bundle (AAB) Generation Guide

This guide explains how to generate Android App Bundles (AAB) for uploading to the Google Play Store.

## What is an Android App Bundle?

An Android App Bundle (.aab file) is the recommended publishing format for Android apps on Google Play. Unlike APKs, App Bundles:
- Only include resources needed for specific device configurations
- Result in smaller download sizes for users
- Are required for new apps on Google Play Store
- Support dynamic delivery and feature modules

## Quick Start

### Generate App Bundle
```bash
npm run aab
```

This will:
1. Build a release App Bundle using Gradle
2. Copy the .aab file to the `dist/` directory
3. Name it with app name, version, and timestamp

### Alternative Commands
```bash
# Direct Gradle command
npm run bundle:release

# Clean build first, then generate bundle
npm run clean && npm run aab
```

## Prerequisites

### 1. Release Keystore Setup
Before generating a production App Bundle, you need a release keystore:

#### Create a Release Keystore
```bash
keytool -genkey -v -keystore android/app/release-key.keystore -alias your-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

#### Configure Signing in build.gradle
Add this to `android/app/build.gradle` in the `signingConfigs` block:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        storeFile file('release-key.keystore')
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS")
        keyPassword System.getenv("KEY_PASSWORD")
    }
}
```

And update the release buildType:
```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled enableProguardInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

#### Set Environment Variables
Create a `.env` file in your project root:
```env
KEYSTORE_PASSWORD=your_keystore_password
KEY_ALIAS=your-key-alias
KEY_PASSWORD=your_key_password
```

### 2. Version Management
Update your app version in `android/app/build.gradle`:
```gradle
defaultConfig {
            applicationId "com.hellolingo"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 2  // Increment this for each release
    versionName "1.0.1"  // Update this for user-facing version
}
```

## Build Process

### 1. Development Testing
```bash
# Generate debug bundle for testing
cd android && ./gradlew bundleDebug
```

### 2. Production Build
```bash
# Generate release bundle for Play Store
npm run aab
```

The script will:
- Build the App Bundle using `bundleRelease` Gradle task
- Find the generated .aab file in `android/app/build/outputs/bundle/release/`
- Copy it to `dist/` with a descriptive filename
- Display file size and next steps

## Output

The generated App Bundle will be saved as:
```
dist/LanguageLearn-1.0.1-release-2024-01-15_10-30-45.aab
```

## Uploading to Google Play Console

1. **Go to Google Play Console**
   - Navigate to your app
   - Go to "Release" → "Production" (or testing track)

2. **Upload the AAB file**
   - Click "Create new release"
   - Upload the .aab file from the `dist/` directory
   - Add release notes
   - Review and roll out

3. **Testing Tracks**
   - **Internal testing**: Quick testing with up to 100 users
   - **Closed testing**: Testing with specific users or groups
   - **Open testing**: Public beta testing
   - **Production**: Live release

## Troubleshooting

### Common Issues

#### 1. Build Fails
```bash
# Clean and rebuild
npm run clean
npm run aab
```

#### 2. Signing Issues
- Ensure release keystore exists
- Check environment variables are set
- Verify keystore passwords are correct

#### 3. Version Conflicts
- Increment `versionCode` for each release
- Ensure `versionCode` is higher than previous releases

#### 4. Bundle Too Large
- Enable ProGuard/R8 minification
- Remove unused resources
- Use vector drawables instead of PNGs
- Enable resource shrinking

### Enable ProGuard for Smaller Bundle
In `android/app/build.gradle`:
```gradle
def enableProguardInReleaseBuilds = true
```

## Best Practices

### 1. Version Management
- Use semantic versioning for `versionName`
- Increment `versionCode` for each release
- Keep version numbers in sync across platforms

### 2. Testing
- Always test on internal testing track first
- Test on different device configurations
- Verify all features work correctly

### 3. Security
- Never commit keystore files to version control
- Use environment variables for sensitive data
- Keep backup of your release keystore

### 4. Bundle Optimization
- Enable ProGuard/R8 minification
- Use App Bundle format (not APK)
- Optimize images and resources
- Remove unused dependencies

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run aab` | Generate release App Bundle |
| `npm run bundle:release` | Direct Gradle bundle command |
| `npm run clean` | Clean Android build |
| `npm run signingReport` | View signing configuration |

## File Locations

- **Generated AAB**: `android/app/build/outputs/bundle/release/`
- **Copied AAB**: `dist/`
- **Keystore**: `android/app/release-key.keystore`
- **Build Config**: `android/app/build.gradle`

## Support

For issues with the build process:
1. Check the console output for specific error messages
2. Verify all prerequisites are met
3. Ensure Android SDK and build tools are up to date
4. Check that all dependencies are properly configured
