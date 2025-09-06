/*
 * Script to build and install the app on a connected Android device without Metro
 * This creates a standalone APK that can run independently
 */

const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function findLatestApk(apkRootDirectory) {
  if (!fs.existsSync(apkRootDirectory)) return null;

  const apkFilePaths = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.apk')) {
        apkFilePaths.push(fullPath);
      }
    }
  }

  walk(apkRootDirectory);

  if (apkFilePaths.length === 0) return null;

  apkFilePaths.sort((a, b) => {
    const aTime = fs.statSync(a).mtimeMs;
    const bTime = fs.statSync(b).mtimeMs;
    return bTime - aTime;
  });

  return apkFilePaths[0];
}

function checkAdbConnection() {
  console.log('📱 Checking for connected Android devices...');
  
  const adbResult = spawnSync('adb', ['devices'], {
    stdio: 'pipe',
    shell: true,
  });

  if (adbResult.status !== 0) {
    console.error('❌ ADB not found. Please ensure Android SDK is installed and ADB is in your PATH.');
    return false;
  }

  const output = adbResult.stdout.toString();
  console.log('ADB output:', output); // Debug output
  
  const lines = output.split('\n').filter(line => line.trim() && !line.includes('List of devices'));
  
  if (lines.length === 0) {
    console.error('❌ No Android devices connected.');
    console.error('Please connect your device via USB and enable USB debugging.');
    console.error('Make sure to allow USB debugging when prompted on your device.');
    return false;
  }

  const devices = lines.map(line => {
    // Handle both tab and space separators
    const parts = line.split(/\s+/);
    const deviceId = parts[0];
    const status = parts[1] || 'unknown';
    return { deviceId, status };
  });

  console.log('Parsed devices:', devices); // Debug output

  const connectedDevices = devices.filter(device => device.status === 'device');
  
  if (connectedDevices.length === 0) {
    console.error('❌ No devices in "device" state found.');
    console.error('Available devices:');
    devices.forEach(device => {
      console.error(`   ${device.deviceId} - ${device.status}`);
    });
    return false;
  }

  console.log(`✅ Found ${connectedDevices.length} connected device(s):`);
  connectedDevices.forEach(device => {
    console.log(`   📱 ${device.deviceId}`);
  });

  return connectedDevices[0].deviceId; // Return first connected device
}

function buildApk(isDebug = false) {
  const projectRoot = path.resolve(__dirname, '..');
  const androidDir = path.join(projectRoot, 'android');

  const buildType = isDebug ? 'debug' : 'release';
  console.log(`🔨 Building ${buildType} APK...`);

  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const cleanResult = spawnSync(gradleCmd, ['clean'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: true,
  });

  if (cleanResult.status !== 0) {
    console.error('❌ Failed to clean project');
    return null;
  }

  // Build APK
  const buildTask = isDebug ? 'assembleDebug' : 'assembleRelease';
  console.log(`📦 Building ${buildType} APK...`);
  const buildResult = spawnSync(gradleCmd, [buildTask], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: true,
  });

  if (buildResult.status !== 0) {
    console.error(`❌ Failed to build ${buildType} APK`);
    return null;
  }

  // Find the generated APK
  const outputsDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', buildType);
  const apkPath = findLatestApk(outputsDir);

  if (!apkPath) {
    console.error(`❌ Could not find generated ${buildType} APK`);
    return null;
  }

  console.log(`✅ ${buildType} APK built successfully: ${apkPath}`);
  return apkPath;
}

function installApkOnDevice(apkPath, deviceId) {
  console.log(`📲 Installing APK on device ${deviceId}...`);

  const installResult = spawnSync('adb', ['-s', deviceId, 'install', '-r', apkPath], {
    stdio: 'inherit',
    shell: true,
  });

  if (installResult.status !== 0) {
    console.error('❌ Failed to install APK on device');
    return false;
  }

  console.log('✅ APK installed successfully!');
  return true;
}

function getPackageName() {
  const projectRoot = path.resolve(__dirname, '..');
  const androidManifestPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  
  if (checkFileExists(androidManifestPath)) {
    try {
      const manifestContent = fs.readFileSync(androidManifestPath, 'utf8');
      const packageMatch = manifestContent.match(/package="([^"]+)"/);
      if (packageMatch) {
        return packageMatch[1];
      }
    } catch (error) {
      console.log('⚠️  Could not read AndroidManifest.xml, using fallback package name');
    }
  }
  
  // Fallback: use package.json name
  const pkgJsonPath = path.join(projectRoot, 'package.json');
  const { name: appName = 'app' } = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  return `com.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

function launchApp(deviceId) {
  const packageName = getPackageName();
  
  console.log(`🚀 Launching app (${packageName})...`);
  
  const launchResult = spawnSync('adb', ['-s', deviceId, 'shell', 'monkey', '-p', packageName, '-c', 'android.intent.category.LAUNCHER', '1'], {
    stdio: 'inherit',
    shell: true,
  });

  if (launchResult.status !== 0) {
    console.log('⚠️  Could not automatically launch app. You can launch it manually from your device.');
    return false;
  }

  console.log('✅ App launched successfully!');
  return true;
}

function copyApkToDist(apkPath, isDebug = false) {
  const projectRoot = path.resolve(__dirname, '..');
  const pkgJsonPath = path.join(projectRoot, 'package.json');
  const { name: appName = 'app', version = '0.0.0' } = JSON.parse(
    fs.readFileSync(pkgJsonPath, 'utf8')
  );

  const safeAppName = String(appName).replace(/[^a-z0-9-_]+/gi, '-');
  const buildType = isDebug ? 'debug' : 'release';
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .replace('Z', '');

  const distDir = path.join(projectRoot, 'dist');
  ensureDirectoryExists(distDir);

  const targetFileName = `${safeAppName}-${version}-${buildType}-standalone-${timestamp}.apk`;
  const targetPath = path.join(distDir, targetFileName);

  fs.copyFileSync(apkPath, targetPath);

  console.log(`📁 APK also saved to: ${targetPath}`);
  return targetPath;
}

function main() {
  // Check for debug mode
  const args = process.argv.slice(2);
  const isDebug = args.includes('--debug');
  const buildType = isDebug ? 'debug' : 'release';

  console.log(`🚀 Building and Installing ${buildType.toUpperCase()} App on Device`);
  console.log('==========================================\n');

  try {
    // Step 1: Check for connected devices
    const deviceId = checkAdbConnection();
    if (!deviceId) {
      process.exit(1);
    }
    console.log('');

    // Step 2: Build APK
    const apkPath = buildApk(isDebug);
    if (!apkPath) {
      process.exit(1);
    }
    console.log('');

    // Step 3: Install APK on device
    if (!installApkOnDevice(apkPath, deviceId)) {
      process.exit(1);
    }
    console.log('');

    // Step 4: Copy APK to dist folder for backup
    const distPath = copyApkToDist(apkPath, isDebug);
    console.log('');

    // Step 5: Launch the app
    launchApp(deviceId);
    console.log('');

    console.log('🎉 Installation completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   📱 Device: ${deviceId}`);
    console.log(`   📦 APK: ${apkPath}`);
    console.log(`   💾 Backup: ${distPath}`);
    console.log(`   🔧 Build Type: ${buildType}`);
    console.log('');
    console.log('✨ Your app is now installed and ready to use!');
    console.log('   The app runs independently without needing Metro bundler.');

  } catch (error) {
    console.error('❌ An error occurred:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node scripts/installOnDevice.js [options]

Options:
  --debug        Build and install debug APK instead of release
  --help, -h     Show this help message

This script will:
1. Check for connected Android devices
2. Build a release APK (or debug APK with --debug flag)
3. Install the APK on the connected device
4. Launch the app
5. Save a backup copy in the dist/ folder

Requirements:
- Android device connected via USB
- USB debugging enabled
- ADB (Android Debug Bridge) installed and in PATH
- Android SDK installed

The installed app will run independently without needing Metro bundler.

Examples:
  npm run install:device     # Install release APK
  npm run install:debug      # Install debug APK
  node scripts/installOnDevice.js --debug  # Install debug APK directly
`);
  process.exit(0);
}

main();
