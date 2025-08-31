# Release Bundle Creation Guide

This guide explains how to create a properly signed Android App Bundle (AAB) for release using the existing `release.keystore` file.

## Prerequisites

1. **Release Keystore**: Ensure you have a `release.keystore` file in the `android/app/` directory
2. **Environment Variables**: Create a `.env` file with your keystore credentials

## Setup

### 1. Create Environment File

Create a `.env` file in your project root with the following variables:

```env
# Release Keystore Configuration
KEYSTORE_PASSWORD=your_keystore_password_here
KEY_ALIAS=your_key_alias_here
KEY_PASSWORD=your_key_password_here
```

**Important**: 
- Replace the placeholder values with your actual keystore credentials
- Keep this file secure and add it to `.gitignore`
- Never commit your actual `.env` file with real credentials

### 2. Verify Keystore File

Ensure your `release.keystore` file exists at:
```
android/app/release.keystore
```

## Creating Release Bundle

Run the following command to create a signed release bundle:

```bash
npm run bundle:release
```

This script will:

1. ✅ Check for the existence of `release.keystore`
2. ✅ Update `build.gradle` with release signing configuration
3. ✅ Load environment variables from `.env`
4. ✅ Clean previous builds
5. ✅ Build the release App Bundle
6. ✅ Copy the bundle to `dist/` directory with timestamp

## Output

The script will generate a signed `.aab` file in the `dist/` directory with the naming format:
```
{app-name}-{version}-release-{timestamp}.aab
```

## Troubleshooting

### Missing Keystore
If you get an error about missing keystore:
```
❌ Release keystore not found at android/app/release.keystore
```

**Solution**: Ensure the `release.keystore` file exists in the `android/app/` directory.

### Missing Environment Variables
If you get an error about missing `.env` file:
```
❌ .env file not found.
```

**Solution**: Create a `.env` file with your keystore credentials as shown above.

### Build Failures
If the build fails, check:
1. Your keystore credentials are correct
2. The keystore file is not corrupted
3. You have sufficient disk space
4. Your Android SDK is properly configured

## Security Notes

- **Backup your keystore**: You cannot update your app on Google Play without the same keystore
- **Secure credentials**: Never commit keystore passwords to version control
- **Environment file**: Add `.env` to your `.gitignore` file

## Next Steps

After creating the bundle:

1. Upload the `.aab` file to Google Play Console
2. Test on internal testing track first
3. Verify the app works correctly before releasing to production

## Alternative Commands

- `npm run aab` - Uses the original app bundle generation script
- `npm run apk:release` - Creates a signed APK instead of AAB
- `npm run setup-keystore` - Sets up a new keystore (if needed)
