/*
 High-level script to build the Android release App Bundle (AAB) and copy it to a top-level
 dist/ directory with a readable filename that includes app name and version.
 
 This script generates an Android App Bundle (.aab file) which is required for uploading
 to the Google Play Store. App Bundles are more efficient than APKs as they only include
 the resources needed for specific device configurations.
*/

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
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
  const projectRoot = path.resolve(__dirname, '..');
  const androidDir = path.join(projectRoot, 'android');

  const pkgJsonPath = path.join(projectRoot, 'package.json');
  const { name: appName = 'app', version = '0.0.0' } = JSON.parse(
    fs.readFileSync(pkgJsonPath, 'utf8')
  );

  console.log('🚀 Starting Android App Bundle build...');
  console.log(`📱 App: ${appName}`);
  console.log(`📦 Version: ${version}`);

  // Build release App Bundle using Gradle wrapper
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const buildResult = spawnSync(gradleCmd, ['bundleRelease'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: true,
  });

  if (buildResult.status !== 0) {
    console.error('❌ Failed to build App Bundle with Gradle.');
    process.exit(buildResult.status || 1);
  }

  const outputsDir = path.join(
    androidDir,
    'app',
    'build',
    'outputs',
    'bundle'
  );

  const latestAab = findLatestAab(outputsDir);
  if (!latestAab) {
    console.error('❌ Could not find any AAB file in build outputs.');
    console.log('🔍 Expected location:', outputsDir);
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

  const targetFileName = `${safeAppName}-${version}-release-${timestamp}.aab`;
  const targetPath = path.join(distDir, targetFileName);

  fs.copyFileSync(latestAab, targetPath);

  // Get file size for reporting
  const stats = fs.statSync(targetPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('✅ App Bundle built successfully!');
  console.log(`📁 Source: ${latestAab}`);
  console.log(`📁 Copied to: ${targetPath}`);
  console.log(`📊 File size: ${fileSizeInMB} MB`);
  console.log('');
  console.log('🎯 Next steps:');
  console.log('   1. Upload the .aab file to Google Play Console');
  console.log('   2. Make sure you have a release keystore configured for production');
  console.log('   3. Test the bundle on internal testing track first');
}

main();
