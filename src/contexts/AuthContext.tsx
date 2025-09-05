import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import harmfulWordsService from '../services/harmfulWordsService';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  userName: string | null;
  userId: string | null;
  isSetupCompleted: boolean;
  hasCheckedAuth: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, name: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
  completeSetup: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    userEmail: null,
    userName: null,
    userId: null,
    isSetupCompleted: false,
    hasCheckedAuth: false,
  });

  const checkAuthState = async () => {
    try {
      console.log('[Auth] Starting authentication check...');
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Initialize harmful words service on app startup
      try {
        console.log('[Auth] Initializing harmful words service...');
        await harmfulWordsService.getHarmfulWords();
        console.log('[Auth] Harmful words service initialized successfully');
      } catch (error) {
        console.log('[Auth] Failed to initialize harmful words service:', error);
        // Don't fail the auth check if harmful words service fails
      }
      
      // Check AsyncStorage for stored login state and setup completion
      const [isLoggedIn, userEmail, userName, userId, setupCompleted] = await AsyncStorage.multiGet([
        'user_logged_in',
        'user_email',
        'user_name',
        'user_id',
        'setup.completed',
      ]);

      const isLoggedInValue = isLoggedIn[1];
      const emailValue = userEmail[1];
      const nameValue = userName[1];
      const idValue = userId[1];
      const isSetupCompletedValue = setupCompleted[1] === 'true';

      console.log('[Auth] Stored auth data:', {
        isLoggedIn: isLoggedInValue,
        hasEmail: !!emailValue,
        hasName: !!nameValue,
        setupCompleted: isSetupCompletedValue
      });

      if (isLoggedInValue === 'true' && emailValue) {
        console.log('[Auth] Found stored login credentials, attempting auto login');
        
        // Try to verify with Google Sign-In, but don't fail auto login if it doesn't work
        try {
          const mod = await import('@react-native-google-signin/google-signin');
          const GoogleSignin: any = (mod as any).GoogleSignin;
          
          // Configure GoogleSignin first
          GoogleSignin.configure({});
          
          const isSignedIn = await GoogleSignin.isSignedIn();
          
          if (isSignedIn) {
            console.log('[Auth] Google Sign-In verification successful');
          } else {
            console.log('[Auth] Google Sign-In expired, but keeping user logged in for auto login');
            // Try to refresh the Google sign-in silently
            try {
              await GoogleSignin.signInSilently();
              console.log('[Auth] Silent sign-in successful');
            } catch (silentError) {
              console.log('[Auth] Silent sign-in failed, but proceeding with auto login:', silentError);
              // Continue with auto login even if silent refresh fails
            }
          }
        } catch (googleError) {
          console.log('[Auth] Error verifying Google sign-in, but proceeding with auto login:', googleError);
          // Continue with auto login even if Google verification fails
        }

        // Auto login the user regardless of Google verification result
        console.log('[Auth] Auto login successful, setting auth state');
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          userEmail: emailValue,
          userName: nameValue || '',
          userId: idValue || '',
          isSetupCompleted: isSetupCompletedValue,
          hasCheckedAuth: true,
        });
        return;
      }

      // User is not authenticated - auto-authenticate to skip login screen
      console.log('[Auth] No stored credentials found, auto-authenticating user to skip login');
      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        userEmail: 'auto@user.com',
        userName: 'Auto User',
        userId: 'auto-user-id',
        isSetupCompleted: true,
        hasCheckedAuth: true,
      });
    } catch (error) {
      console.log('[Auth] Error checking auth state:', error);
      // Clear any corrupted data
      await AsyncStorage.multiRemove(['user_logged_in', 'user_email', 'user_name', 'user_id']).catch(() => {});
      // Auto-authenticate to skip login screen even on error
      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        userEmail: 'auto@user.com',
        userName: 'Auto User',
        userId: 'auto-user-id',
        isSetupCompleted: true,
        hasCheckedAuth: true,
      });
    }
  };

  const login = async (email: string, name: string, userId: string) => {
    try {
      // Check if setup is already completed
      const setupCompleted = await AsyncStorage.getItem('setup.completed');
      const isSetupCompletedValue = setupCompleted === 'true';

      await AsyncStorage.multiSet([
        ['user_logged_in', 'true'],
        ['user_email', email],
        ['user_name', name],
        ['user_id', userId],
      ]);

      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        userEmail: email,
        userName: name,
        userId: userId,
        isSetupCompleted: isSetupCompletedValue,
        hasCheckedAuth: true,
      });

      console.log('[Auth] Login state saved successfully');
    } catch (error) {
      console.log('[Auth] Error saving login state:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Try to sign out from Google, but don't fail if it doesn't work
      try {
        const mod = await import('@react-native-google-signin/google-signin');
        const GoogleSignin: any = (mod as any).GoogleSignin;
        
        // Configure GoogleSignin first
        GoogleSignin.configure({});
        
        await GoogleSignin.signOut();
        console.log('[Auth] Google Sign-Out successful');
      } catch (googleError) {
        console.log('[Auth] Error during Google sign-out (continuing with local logout):', googleError);
      }
      
      // Always clear stored user data regardless of Google sign-out result
      await AsyncStorage.multiRemove([
        'user_logged_in',
        'user_email',
        'user_name',
        'user_id'
      ]);

      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        userEmail: null,
        userName: null,
        userId: null,
        isSetupCompleted: false,
        hasCheckedAuth: true,
      });

      console.log('[Auth] User signed out successfully');
    } catch (error) {
      console.log('[Auth] Error during logout:', error);
      throw error;
    }
  };

  const completeSetup = async () => {
    try {
      await AsyncStorage.setItem('setup.completed', 'true');
      setAuthState(prev => ({
        ...prev,
        isSetupCompleted: true,
      }));
      console.log('[Auth] Setup completed successfully');
    } catch (error) {
      console.log('[Auth] Error completing setup:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuthState,
    completeSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
