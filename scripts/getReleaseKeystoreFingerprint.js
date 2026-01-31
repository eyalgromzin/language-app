const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env file
function loadEnvFile() {
  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, '.env');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, value] = trimmed.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim().replace(/^['"]|['"]$/g, '');
        }
      }
    }
  }
}

function getReleaseKeystoreFingerprint() {
  // Load environment variables
  loadEnvFile();
  
  const keystorePath = path.join(process.cwd(), 'android', 'app', 'release.keystore');
  
  if (!fs.existsSync(keystorePath)) {
    console.error('❌ Release keystore not found at:', keystorePath);
    console.log('Please run "npm run setup-keystore" first to create the release keystore.');
    return false;
  }

  const keyAlias = process.env.KEY_ALIAS || 'release';
  const storePass = process.env.KEYSTORE_PASSWORD;
  const keyPass = process.env.KEY_PASSWORD;

  if (!storePass || !keyPass) {
    console.error('❌ Keystore credentials not found in environment variables');
    console.log('Please ensure .env file contains KEYSTORE_PASSWORD, KEY_ALIAS, and KEY_PASSWORD');
    return false;
  }

  try {
    console.log('🔍 Getting SHA-1 fingerprint from release keystore...');
    
    // Get SHA-1 fingerprint from the release keystore
    const keytoolCommand = `keytool -list -v -keystore "${keystorePath}" -alias ${keyAlias} -storepass ${storePass} -keypass ${keyPass}`;
    
    const output = execSync(keytoolCommand, { encoding: 'utf8' });
    
    // Extract SHA-1 fingerprint from the output
    const sha1Match = output.match(/SHA1:\s*([A-F0-9:]+)/i);
    
    if (sha1Match) {
      const sha1Fingerprint = sha1Match[1];
      console.log('✅ SHA-1 Fingerprint for Release Keystore:');
      console.log(`   ${sha1Fingerprint}`);
      console.log('');
      console.log('📋 Next steps:');
      console.log('1. Go to Google Cloud Console (https://console.cloud.google.com/)');
      console.log('2. Navigate to your project');
      console.log('3. Go to APIs & Services > Credentials');
      console.log('4. Find your Android OAuth 2.0 client ID');
      console.log('5. Add this SHA-1 fingerprint to the "SHA-1 certificate fingerprints" section');
      console.log('6. Save the changes');
      console.log('');
      console.log('⚠️  Important: This SHA-1 fingerprint is required for Google Sign-In to work in release builds.');
      
      return sha1Fingerprint;
    } else {
      console.error('❌ Could not extract SHA-1 fingerprint from keystore output');
      console.log('Raw output:', output);
      return false;
    }
  } catch (error) {
    console.error('❌ Error getting keystore fingerprint:', error.message);
    return false;
  }
}

function main() {
  console.log('🔐 Release Keystore SHA-1 Fingerprint Generator');
  console.log('===============================================\n');
  
  const fingerprint = getReleaseKeystoreFingerprint();
  
  if (fingerprint) {
    console.log('✅ Process completed successfully!');
  } else {
    console.log('❌ Failed to get fingerprint. Please check the keystore setup.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getReleaseKeystoreFingerprint };
