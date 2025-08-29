/*
 Helper script to guide users through setting up a release keystore for production builds.
 This script provides step-by-step instructions and validates the setup.
*/

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function createEnvTemplate() {
  const envTemplate = `# Release Keystore Configuration
# Replace these values with your actual keystore details
KEYSTORE_PASSWORD=your_keystore_password_here
KEY_ALIAS=your_key_alias_here
KEY_PASSWORD=your_key_password_here

# Optional: Add to .gitignore to keep secrets out of version control
`;

  const envPath = path.join(process.cwd(), '.env');
  if (!checkFileExists(envPath)) {
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ Created .env template file');
    console.log('📝 Please edit .env with your actual keystore details');
  } else {
    console.log('⚠️  .env file already exists');
  }
}

function checkKeystoreSetup() {
  const androidDir = path.join(process.cwd(), 'android', 'app');
  const keystorePath = path.join(androidDir, 'release-key.keystore');
  const buildGradlePath = path.join(androidDir, 'build.gradle');
  const envPath = path.join(process.cwd(), '.env');

  console.log('🔍 Checking release keystore setup...\n');

  // Check if keystore exists
  if (checkFileExists(keystorePath)) {
    console.log('✅ Release keystore found');
  } else {
    console.log('❌ Release keystore not found');
    console.log('📁 Expected location:', keystorePath);
  }

  // Check if .env file exists
  if (checkFileExists(envPath)) {
    console.log('✅ .env file found');
  } else {
    console.log('❌ .env file not found');
  }

  // Check build.gradle configuration
  if (checkFileExists(buildGradlePath)) {
    const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
    const hasReleaseConfig = buildGradleContent.includes('signingConfigs') && 
                           buildGradleContent.includes('release');
    
    if (hasReleaseConfig) {
      console.log('✅ Release signing configuration found in build.gradle');
    } else {
      console.log('❌ Release signing configuration missing in build.gradle');
    }
  } else {
    console.log('❌ build.gradle not found');
  }

  console.log('');
}

function generateKeystoreCommand() {
  const androidDir = path.join(process.cwd(), 'android', 'app');
  const keystorePath = path.join(androidDir, 'release-key.keystore');
  
  console.log('🔑 To create a release keystore, run this command:');
  console.log('');
  console.log(`keytool -genkey -v -keystore "${keystorePath}" -alias your-key-alias -keyalg RSA -keysize 2048 -validity 10000`);
  console.log('');
  console.log('📝 You will be prompted for:');
  console.log('   - Keystore password');
  console.log('   - Key password (can be same as keystore password)');
  console.log('   - Certificate information (name, organization, etc.)');
  console.log('');
  console.log('💡 Tip: Use the same password for keystore and key for simplicity');
}

function showBuildGradleConfig() {
  console.log('📝 Add this to your android/app/build.gradle in the signingConfigs block:');
  console.log('');
  console.log('```gradle');
  console.log('signingConfigs {');
  console.log('    debug {');
  console.log('        storeFile file(\'debug.keystore\')');
  console.log('        storePassword \'android\'');
  console.log('        keyAlias \'androiddebugkey\'');
  console.log('        keyPassword \'android\'');
  console.log('    }');
  console.log('    release {');
  console.log('        storeFile file(\'release-key.keystore\')');
  console.log('        storePassword System.getenv("KEYSTORE_PASSWORD")');
  console.log('        keyAlias System.getenv("KEY_ALIAS")');
  console.log('        keyPassword System.getenv("KEY_PASSWORD")');
  console.log('    }');
  console.log('}');
  console.log('```');
  console.log('');
  console.log('And update the release buildType:');
  console.log('');
  console.log('```gradle');
  console.log('buildTypes {');
  console.log('    release {');
  console.log('        signingConfig signingConfigs.release');
  console.log('        minifyEnabled enableProguardInReleaseBuilds');
  console.log('        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"');
  console.log('    }');
  console.log('}');
  console.log('```');
}

function main() {
  console.log('🚀 Release Keystore Setup Guide');
  console.log('================================\n');

  const command = process.argv[2];

  switch (command) {
    case 'check':
      checkKeystoreSetup();
      break;
    case 'create-env':
      createEnvTemplate();
      break;
    case 'generate-command':
      generateKeystoreCommand();
      break;
    case 'show-config':
      showBuildGradleConfig();
      break;
    default:
      console.log('📋 Available commands:');
      console.log('  npm run setup-keystore check          - Check current setup');
      console.log('  npm run setup-keystore create-env     - Create .env template');
      console.log('  npm run setup-keystore generate-command - Show keystore creation command');
      console.log('  npm run setup-keystore show-config   - Show build.gradle configuration');
      console.log('');
      console.log('📖 For complete setup instructions, see ANDROID_APP_BUNDLE_GUIDE.md');
      console.log('');
      checkKeystoreSetup();
  }
}

main();
