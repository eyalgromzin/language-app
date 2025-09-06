# Install App on Device Script

This script allows you to build and install your React Native app directly on a connected Android device without needing Metro bundler to run.

## Quick Start

### Prerequisites
- Android device connected via USB
- USB debugging enabled on your device
- ADB (Android Debug Bridge) installed and in your PATH
- Android SDK installed

### Usage

#### Install Release APK
```bash
npm run install:device
```

#### Install Debug APK
```bash
npm run install:debug
```

#### Direct Script Usage
```bash
# Release APK
node scripts/installOnDevice.js

# Debug APK
node scripts/installOnDevice.js --debug

# Show help
node scripts/installOnDevice.js --help
```

## What the Script Does

1. **Device Check**: Verifies that an Android device is connected and accessible via ADB
2. **Build APK**: Builds either a release or debug APK using Gradle
3. **Install**: Installs the APK on the connected device
4. **Launch**: Automatically launches the app on the device
5. **Backup**: Saves a copy of the APK in the `dist/` folder for future use

## Benefits

- **No Metro Required**: The installed app runs completely independently
- **Standalone**: Perfect for testing on devices without development environment
- **Automatic**: Handles the entire build and install process
- **Backup**: Keeps copies of built APKs for distribution

## Troubleshooting

### No Device Found
- Ensure USB debugging is enabled on your device
- Check that the device is connected via USB
- Try running `adb devices` to verify connection
- Allow USB debugging when prompted on your device

### ADB Not Found
- Install Android SDK Platform Tools
- Add ADB to your system PATH
- On Windows: Add `%LOCALAPPDATA%\Android\Sdk\platform-tools` to PATH

### Build Failures
- Ensure all dependencies are installed (`npm install`)
- Check that Android SDK is properly configured
- Verify that your signing configuration is correct for release builds

### App Won't Launch
- The script will attempt to launch the app automatically
- If it fails, you can manually launch the app from your device's app drawer
- Check that the package name is correctly detected

## File Outputs

The script creates APK files in the `dist/` folder with descriptive names:
- `HelloLingo-0.0.1-release-standalone-2024-01-15_10-30-45.apk`
- `HelloLingo-0.0.1-debug-standalone-2024-01-15_10-30-45.apk`

## Advanced Usage

### Multiple Devices
If multiple devices are connected, the script will use the first available device. To target a specific device, you can modify the script or use ADB directly:

```bash
# List devices
adb devices

# Install to specific device
adb -s DEVICE_ID install -r path/to/app.apk
```

### Custom Package Names
The script automatically detects the package name from `AndroidManifest.xml`. If you need to override this, you can modify the `getPackageName()` function in the script.

## Integration with CI/CD

This script can be easily integrated into CI/CD pipelines for automated testing and deployment:

```yaml
# Example GitHub Actions step
- name: Build and Install APK
  run: |
    npm run install:device
    # Run tests or other post-install tasks
```
