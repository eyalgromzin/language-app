# Website App Links Setup Guide

## Overview
To enable app links for your Android app, you need to add a Digital Asset Links file to your website. This file tells Android that your app is authorized to handle links from your domain.

## What You Need to Do

### 1. Create the Digital Asset Links File

Create a file named `assetlinks.json` in the `.well-known` directory at the root of your website. The file should be accessible at:
```
https://hellolingo.app/.well-known/assetlinks.json
```

### 2. File Content

The `assetlinks.json` file should contain:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.hellolingo",
      "sha256_cert_fingerprints": [
        "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C"
      ]
    }
  }
]
```

### 3. Website Directory Structure

Your website should have this structure:
```
hellolingo.app/
├── .well-known/
│   └── assetlinks.json
├── index.html
└── ... (other website files)
```

### 4. Important Notes

#### For Debug/Development
- The SHA256 fingerprint provided is from your debug keystore
- This will work for development and testing
- For production, you'll need the fingerprint from your release keystore

#### For Production Release
When you're ready to release your app to the Play Store, you'll need to:

1. **Get your release certificate fingerprint:**
   ```bash
   keytool -list -v -keystore your-release-keystore.jks -alias your-key-alias
   ```

2. **Update the assetlinks.json file** with the release certificate fingerprint

3. **Add both debug and release fingerprints** to support both development and production:
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.hellolingo",
         "sha256_cert_fingerprints": [
           "DEBUG_FINGERPRINT_HERE",
           "RELEASE_FINGERPRINT_HERE"
         ]
       }
     }
   ]
   ```

### 5. Testing

After uploading the file to your website:

1. **Verify the file is accessible:**
   - Visit `https://hellolingo.app/.well-known/assetlinks.json` in your browser
   - You should see the JSON content

2. **Test app links:**
   - Try opening a link like `https://hellolingo.app/video?url=YOUTUBE_URL&title=VIDEO_TITLE`
   - It should open your app instead of the browser

3. **Use Google's verification tool:**
   - Visit: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://hellolingo.app&relation=delegate_permission/common.handle_all_urls
   - This should return your assetlinks.json content

### 6. Common Issues

#### File Not Found (404)
- Make sure the file is in the correct location: `.well-known/assetlinks.json`
- Check that your web server serves the `.well-known` directory
- Ensure the file has the correct MIME type (application/json)

#### Wrong Certificate Fingerprint
- Double-check that you're using the correct keystore
- For debug builds, use the debug keystore fingerprint
- For release builds, use the release keystore fingerprint

#### Wrong Package Name
- Ensure the package_name matches your app's applicationId in build.gradle
- Your app uses: `com.hellolingo`

### 7. Security Considerations

- The assetlinks.json file is public and can be viewed by anyone
- It only contains the certificate fingerprint, not the private key
- This is the intended behavior for app link verification

## Next Steps

1. Upload the `assetlinks.json` file to your website at `https://hellolingo.app/.well-known/assetlinks.json`
2. Test the app links functionality
3. When ready for production, update with your release certificate fingerprint
4. Consider adding analytics to track app link usage
