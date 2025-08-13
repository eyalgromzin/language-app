/*
 High-level script to build the Android release APK and copy it to a top-level
 dist/ directory with a readable filename that includes app name and version.
*/

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const androidDir = path.join(projectRoot, 'android');

  const pkgJsonPath = path.join(projectRoot, 'package.json');
  const { name: appName = 'app', version = '0.0.0' } = JSON.parse(
    fs.readFileSync(pkgJsonPath, 'utf8')
  );

  // Build release APK using Gradle wrapper
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const buildResult = spawnSync(gradleCmd, ['assembleRelease'], {
    cwd: androidDir,
    stdio: 'inherit',
    shell: true,
  });

  if (buildResult.status !== 0) {
    console.error('Failed to build APK with Gradle.');
    process.exit(buildResult.status || 1);
  }

  const outputsDir = path.join(
    androidDir,
    'app',
    'build',
    'outputs',
    'apk'
  );

  const latestApk = findLatestApk(outputsDir);
  if (!latestApk) {
    console.error('Could not find any APK in build outputs.');
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

  const targetFileName = `${safeAppName}-${version}-release-${timestamp}.apk`;
  const targetPath = path.join(distDir, targetFileName);

  fs.copyFileSync(latestApk, targetPath);

  console.log('APK built successfully.');
  console.log(`Source: ${latestApk}`);
  console.log(`Copied to: ${targetPath}`);
}

main();



