import { Platform } from 'react-native';

// App version interface
export interface AppVersion {
  version: string;
  versionCode?: string;
  buildNumber?: string;
}

// Default version fallback
const DEFAULT_VERSION = '1.0.0';

/**
 * Get the current app version
 * This function attempts to read the version from package.json
 * and falls back to platform-specific version detection
 */
export const getAppVersion = (): string => {
  try {
    // In React Native, we can't directly import package.json
    // So we'll use a combination of approaches
    
    // Method 1: Try to get from native modules (if available)
    if (Platform.OS === 'ios') {
      // For iOS, we could use react-native-device-info or similar
      // For now, return default
      return DEFAULT_VERSION;
    } else if (Platform.OS === 'android') {
      // For Android, we could use react-native-device-info or similar
      // For now, return default
      return DEFAULT_VERSION;
    }
    
    return DEFAULT_VERSION;
  } catch (error) {
    console.warn('[AppVersion] Could not determine app version:', error);
    return DEFAULT_VERSION;
  }
};

/**
 * Get app version info for cache invalidation
 */
export const getAppVersionInfo = (): AppVersion => {
  const version = getAppVersion();
  
  return {
    version,
    versionCode: version, // In a real app, this might be different
    buildNumber: version, // In a real app, this might be different
  };
};

/**
 * Check if app version has changed
 * @param previousVersion Previous version string
 * @returns true if version has changed
 */
export const hasVersionChanged = (previousVersion: string): boolean => {
  const currentVersion = getAppVersion();
  return currentVersion !== previousVersion;
};

/**
 * Get version string for cache keys
 */
export const getVersionString = (): string => {
  return getAppVersion();
};
