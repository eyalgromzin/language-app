/*
  Generates iOS and Android app icons from a single source image using
  @bam.tech/react-native-make's CLI integration: `react-native set-icon`.

  Usage:
    npm run icons

  Notes:
  - Looks for `arc/images/appIcon.png` first (as requested), then falls back to `src/images/appIcon.png`.
  - For Android adaptive icons, we apply a white background by default. Adjust if desired.
*/

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const sharp = require('sharp');
const fse = require('fs-extra');

function resolveIconPath() {
  const candidates = [
    path.resolve(process.cwd(), 'src/assets/logo_512.png'),
    path.resolve(process.cwd(), 'src/assets/logo.png'),
    path.resolve(process.cwd(), 'src/images/logo10.png'),
    path.resolve(process.cwd(), 'arc/images/appIcon.png'),
    path.resolve(process.cwd(), 'src/images/appIcon.png'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('Icon not found. Expected at `src/assets/logo_512.png`, `src/assets/logo.png`, `src/images/logo10.png`, `arc/images/appIcon.png` or `src/images/appIcon.png`.');
}

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: 'inherit', env: process.env });
}

async function ensureSquareIcon(inputPath) {
  // Ensure a squared PNG in a temp location for the CLI which requires square input
  const tempDir = path.join(process.cwd(), 'scripts', '.tmp');
  await fse.ensureDir(tempDir);
  const squaredPath = path.join(tempDir, 'appIcon-square.png');

  // Use cover to crop/scale to 1024x1024, rotate to respect EXIF
  await sharp(inputPath).rotate().resize(1024, 1024, { fit: 'cover' }).png().toFile(squaredPath);
  return squaredPath;
}

async function main() {
  const originalIconPath = resolveIconPath();
  console.log(`Using icon: ${originalIconPath}`);

  const squaredIconPath = await ensureSquareIcon(originalIconPath);
  console.log(`Prepared squared icon: ${squaredIconPath}`);

  // iOS icons
  run(`npx --yes react-native set-icon --platform ios --path "${squaredIconPath}"`);

  // Android icons (adaptive with background). Change color if needed.
  const backgroundColor = '#FFFFFF';
  run(
    `npx --yes react-native set-icon --platform android --path "${squaredIconPath}" --background "${backgroundColor}"`
  );

  console.log('\nApp icons updated for iOS and Android.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});


