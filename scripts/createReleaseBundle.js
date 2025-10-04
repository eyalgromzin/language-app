/*
 Comprehensive script to create a properly signed Android App Bundle in release mode.
 This script handles the complete process using the existing release keystore.
*/

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function checkReleaseKeystore() {
  const androidDir = path.join(process.cwd(), 'android', 'app');
  const keystorePath = path.join(androidDir, 'release.keystore');
  
  if (checkFileExists(keystorePath)) {
    console.log('✅ Release keystore found at android/app/release.keystore');
    return true;
  }

  console.error('❌ Release keystore not found at android/app/release.keystore');
  console.error('Please ensure the release.keystore file exists in the android/app directory');
  return false;
}

function updateBuildGradle() {
  const buildGradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');
  
  if (!checkFileExists(buildGradlePath)) {
    console.error('❌ build.gradle not found');
    return false;
  }

  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Check if release signing config already exists
  if (content.includes('signingConfigs') && content.includes('release')) {
    console.log('✅ Release signing configuration already exists in build.gradle');
    return true;
  }

  // Add release signing config
  const releaseSigningConfig = `
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file('release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }`;

  // Replace the existing signingConfigs block
  const signingConfigsRegex = /signingConfigs\s*\{[\s\S]*?\}/;
  if (signingConfigsRegex.test(content)) {
    content = content.replace(signingConfigsRegex, releaseSigningConfig);
  } else {
    // If no signingConfigs block exists, add it before buildTypes
    const buildTypesIndex = content.indexOf('buildTypes {');
    if (buildTypesIndex !== -1) {
      content = content.slice(0, buildTypesIndex) + releaseSigningConfig + '\n    ' + content.slice(buildTypesIndex);
    }
  }

  // Update release buildType to use release signing config
  const releaseBuildTypeRegex = /release\s*\{[\s\S]*?signingConfig\s+signingConfigs\.debug[\s\S]*?\}/;
  const releaseBuildTypeReplacement = `release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }`;

  if (releaseBuildTypeRegex.test(content)) {
    content = content.replace(releaseBuildTypeRegex, releaseBuildTypeReplacement);
  }

  fs.writeFileSync(buildGradlePath, content);
  console.log('✅ Updated build.gradle with release signing configuration');
  
  return true;
}

function loadEnvironmentVariables() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!checkFileExists(envPath)) {
    console.error('❌ .env file not found.');
    console.error('Please create a .env file with the following variables:');
    console.error('KEYSTORE_PASSWORD=your_keystore_password');
    console.error('KEY_ALIAS=your_key_alias');
    console.error('KEY_PASSWORD=your_key_password');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      envVars[key.trim()] = value.trim();
    }
  });

  // Set environment variables
  Object.assign(process.env, envVars);
  
  console.log('✅ Loaded environment variables from .env');
  return true;
}

function buildReleaseBundle() {
  const androidDir = path.join(process.cwd(), 'android');
  const projectRoot = process.cwd();

  console.log('🚀 Building release App Bundle...');

  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  const cleanResult = spawnSync('gradlew.bat', ['clean'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: true,
  });

  if (cleanResult.status !== 0) {
    console.error('❌ Failed to clean project');
    return false;
  }

  // Build release bundle
  console.log('📦 Building release bundle...');
  const buildResult = spawnSync('gradlew.bat', ['bundleRelease'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });

  if (buildResult.status !== 0) {
    console.error('❌ Failed to build release bundle');
    return false;
  }

  // Find and copy the generated bundle
  const outputsDir = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release');
  const bundlePath = path.join(outputsDir, 'app-release.aab');

  if (!checkFileExists(bundlePath)) {
    console.error('❌ Release bundle not found at expected location');
    return false;
  }

  // Read package.json for app info
  const pkgJsonPath = path.join(projectRoot, 'package.json');
  const { name: appName = 'app', version = '0.0.0' } = JSON.parse(
    fs.readFileSync(pkgJsonPath, 'utf8')
  );

  const safeAppName = String(appName).replace(/[^a-z0-9-_]+/gi, '-');
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .replace('Z', '');

  const distDir = path.join(projectRoot, 'dist');
  ensureDirectoryExists(distDir);

  const targetFileName = `${safeAppName}-${version}-release-${timestamp}.aab`;
  const targetPath = path.join(distDir, targetFileName);

  fs.copyFileSync(bundlePath, targetPath);

  // Get file size for reporting
  const stats = fs.statSync(targetPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('✅ Release App Bundle built successfully!');
  console.log(`📁 Source: ${bundlePath}`);
  console.log(`📁 Copied to: ${targetPath}`);
  console.log(`📊 File size: ${fileSizeInMB} MB`);
  console.log('');
  console.log('🎯 This bundle is properly signed for production and ready for Google Play Store!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Upload the .aab file to Google Play Console');
  console.log('   2. Test the bundle on internal testing track first');
  console.log('   3. Keep your .env file and keystore secure');
  console.log('   4. Back up your keystore file - you cannot update your app without it');

  return true;
}

function main() {
  console.log('🚀 Creating Release Android App Bundle');
  console.log('=======================================\n');

  try {
    // Step 0: Remove previous release files
    // removePreviousReleaseFiles();
    // console.log('');

    // Step 1: Check for existing release keystore
    if (!checkReleaseKeystore()) {
      process.exit(1);
    }

    // Step 2: Update build.gradle with release signing config
    if (!updateBuildGradle()) {
      process.exit(1);
    }

    // Step 3: Load environment variables
    if (!loadEnvironmentVariables()) {
      process.exit(1);
    }

    // Step 4: Build release bundle
    if (!buildReleaseBundle()) {
      process.exit(1);
    }

    console.log('\n🎉 Release bundle creation completed successfully!');

  } catch (error) {
    console.error('❌ An error occurred:', error.message);
    process.exit(1);
  }
}

main();
