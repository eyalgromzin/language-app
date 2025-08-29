/*
 Test script to verify App Bundle generation setup and provide helpful feedback.
 This script checks prerequisites and tests the build process.
*/

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...\n');

  const checks = {
    'Android SDK': false,
    'Gradle': false,
    'Java': false,
    'Node.js': false,
    'Package.json': false,
    'Android directory': false,
    'Build.gradle': false
  };

  // Check Android SDK
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (androidHome && fs.existsSync(androidHome)) {
    checks['Android SDK'] = true;
  }

  // Check Gradle
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  const gradlePath = path.join(process.cwd(), 'android', gradleCmd);
  if (fs.existsSync(gradlePath)) {
    checks['Gradle'] = true;
  }

  // Check Java
  const javaResult = spawnSync('java', ['-version'], { stdio: 'pipe' });
  if (javaResult.status === 0) {
    checks['Java'] = true;
  }

  // Check Node.js
  const nodeResult = spawnSync('node', ['--version'], { stdio: 'pipe' });
  if (nodeResult.status === 0) {
    checks['Node.js'] = true;
  }

  // Check package.json
  if (fs.existsSync('package.json')) {
    checks['Package.json'] = true;
  }

  // Check Android directory
  if (fs.existsSync('android')) {
    checks['Android directory'] = true;
  }

  // Check build.gradle
  if (fs.existsSync('android/app/build.gradle')) {
    checks['Build.gradle'] = true;
  }

  // Display results
  let allPassed = true;
  for (const [check, passed] of Object.entries(checks)) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${check}`);
    if (!passed) allPassed = false;
  }

  console.log('');
  return allPassed;
}

function checkKeystoreSetup() {
  console.log('🔑 Checking keystore setup...\n');

  const androidDir = path.join(process.cwd(), 'android', 'app');
  const keystorePath = path.join(androidDir, 'release-key.keystore');
  const buildGradlePath = path.join(androidDir, 'build.gradle');
  const envPath = path.join(process.cwd(), '.env');

  const checks = {
    'Release keystore': fs.existsSync(keystorePath),
    '.env file': fs.existsSync(envPath),
    'Release signing config': false
  };

  // Check build.gradle configuration
  if (fs.existsSync(buildGradlePath)) {
    const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
    checks['Release signing config'] = buildGradleContent.includes('signingConfigs') && 
                                     buildGradleContent.includes('release');
  }

  // Display results
  let allPassed = true;
  for (const [check, passed] of Object.entries(checks)) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${check}`);
    if (!passed) allPassed = false;
  }

  console.log('');
  return allPassed;
}

function testGradleConnection() {
  console.log('🔧 Testing Gradle connection...\n');

  const androidDir = path.join(process.cwd(), 'android');
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

  console.log('Running: gradle --version');
  const result = spawnSync(gradleCmd, ['--version'], {
    cwd: androidDir,
    stdio: 'pipe',
    shell: true
  });

  if (result.status === 0) {
    console.log('✅ Gradle is working correctly');
    console.log('');
    return true;
  } else {
    console.log('❌ Gradle test failed');
    console.log('Error:', result.stderr.toString());
    console.log('');
    return false;
  }
}

function showNextSteps() {
  console.log('📋 Next Steps:');
  console.log('');
  console.log('1. If keystore setup is incomplete:');
  console.log('   npm run setup-keystore');
  console.log('');
  console.log('2. To generate an App Bundle:');
  console.log('   npm run aab');
  console.log('');
  console.log('3. For debugging build issues:');
  console.log('   npm run clean && npm run aab');
  console.log('');
  console.log('4. To check signing configuration:');
  console.log('   npm run signingReport');
  console.log('');
  console.log('📖 For detailed instructions, see ANDROID_APP_BUNDLE_GUIDE.md');
}

function main() {
  console.log('🧪 App Bundle Generation Test');
  console.log('==============================\n');

  const prereqsPassed = checkPrerequisites();
  const keystorePassed = checkKeystoreSetup();
  const gradlePassed = testGradleConnection();

  console.log('📊 Test Summary:');
  console.log(`   Prerequisites: ${prereqsPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Keystore Setup: ${keystorePassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Gradle Connection: ${gradlePassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  if (prereqsPassed && keystorePassed && gradlePassed) {
    console.log('🎉 All tests passed! You\'re ready to generate App Bundles.');
    console.log('');
    console.log('🚀 Run: npm run aab');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above before generating App Bundles.');
  }

  console.log('');
  showNextSteps();
}

main();
