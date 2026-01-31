/*
 High-level script to build the Android release APK and AAB (Android App Bundle) 
 and copy them to a top-level dist/ directory with readable filenames that include 
 app name and version.
*/

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Load .env file
function loadEnvFile() {
  const projectRoot = path.resolve(__dirname, '..');
  const envPath = path.join(projectRoot, '.env');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, value] = trimmed.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }
  }
}

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
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

function findLatestAab(aabRootDirectory) {
  if (!fs.existsSync(aabRootDirectory)) return null;

  const aabFilePaths = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.aab')) {
        aabFilePaths.push(fullPath);
      }
    }
  }

  walk(aabRootDirectory);

  if (aabFilePaths.length === 0) return null;

  aabFilePaths.sort((a, b) => {
    const aTime = fs.statSync(a).mtimeMs;
    const bTime = fs.statSync(b).mtimeMs;
    return bTime - aTime;
  });

  return aabFilePaths[0];
}

function main() {
  // Load environment variables from .env file
  loadEnvFile();

  const projectRoot = path.resolve(__dirname, '..');
  const androidDir = path.join(projectRoot, 'android');

  const pkgJsonPath = path.join(projectRoot, 'package.json');
  const { name: appName = 'app', version = '0.0.0' } = JSON.parse(
    fs.readFileSync(pkgJsonPath, 'utf8')
  );

  console.log('🚀 Starting Android build process...');
  console.log(`📱 App: ${appName}`);
  console.log(`📦 Version: ${version}`);

  // Build release APK using Gradle wrapper
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  
  console.log('📦 Building APK...');
  const apkBuildResult = spawnSync(gradleCmd, ['assembleRelease'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: true,
  });

  if (apkBuildResult.status !== 0) {
    console.error('❌ Failed to build APK with Gradle.');
    process.exit(apkBuildResult.status || 1);
  }

  console.log('📦 Building AAB (Android App Bundle)...');
  const aabBuildResult = spawnSync(gradleCmd, ['bundleRelease'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: true,
  });

  if (aabBuildResult.status !== 0) {
    console.error('❌ Failed to build AAB with Gradle.');
    process.exit(aabBuildResult.status || 1);
  }

  // Process APK file
  const apkOutputsDir = path.join(
    androidDir,
    'app',
    'build',
    'outputs',
    'apk'
  );

  const latestApk = findLatestApk(apkOutputsDir);
  if (!latestApk) {
    console.error('❌ Could not find any APK in build outputs.');
    process.exit(1);
  }

  // Process AAB file
  const aabOutputsDir = path.join(
    androidDir,
    'app',
    'build',
    'outputs',
    'bundle'
  );

  const latestAab = findLatestAab(aabOutputsDir);
  if (!latestAab) {
    console.error('❌ Could not find any AAB in build outputs.');
    process.exit(1);
  }

  const safeAppName = String(appName).replace(/[^a-z0-9-_]+/gi, '-');
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .replace('Z', '');

  const distDir = path.join(projectRoot, 'dist');
  ensureDirectoryExists(distDir);

  // Copy APK file
  const apkTargetFileName = `${safeAppName}-${version}-release-${timestamp}.apk`;
  const apkTargetPath = path.join(distDir, apkTargetFileName);
  fs.copyFileSync(latestApk, apkTargetPath);

  // Copy AAB file
  const aabTargetFileName = `${safeAppName}-${version}-release-${timestamp}.aab`;
  const aabTargetPath = path.join(distDir, aabTargetFileName);
  fs.copyFileSync(latestAab, aabTargetPath);

  // Get file sizes for reporting
  const apkStats = fs.statSync(apkTargetPath);
  const aabStats = fs.statSync(aabTargetPath);
  const apkSizeInMB = (apkStats.size / (1024 * 1024)).toFixed(2);
  const aabSizeInMB = (aabStats.size / (1024 * 1024)).toFixed(2);

  console.log('✅ Build completed successfully!');
  console.log('');
  console.log('📱 APK:');
  console.log(`   Source: ${latestApk}`);
  console.log(`   Copied to: ${apkTargetPath}`);
  console.log(`   Size: ${apkSizeInMB} MB`);
  console.log('');
  console.log('📦 AAB (Android App Bundle):');
  console.log(`   Source: ${latestAab}`);
  console.log(`   Copied to: ${aabTargetPath}`);
  console.log(`   Size: ${aabSizeInMB} MB`);
  console.log('');
  console.log('🎯 Next steps:');
  console.log('   • APK: Install directly on devices or distribute via sideloading');
  console.log('   • AAB: Upload to Google Play Console for Play Store distribution');
}

main();



