import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  userName: string | null;
  userId: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, name: string, userId: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
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
  });

  const checkAuthState = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Check AsyncStorage for stored login state
      const [isLoggedIn, userEmail, userName, userId] = await AsyncStorage.multiGet([
        'user_logged_in',
        'user_email',
        'user_name',
        'user_id',
      ]);

      const isLoggedInValue = isLoggedIn[1];
      const emailValue = userEmail[1];
      const nameValue = userName[1];
      const idValue = userId[1];

      if (isLoggedInValue === 'true' && emailValue) {
        // Verify with Google Sign-In
        try {
          const mod = await import('@react-native-google-signin/google-signin');
          const GoogleSignin: any = (mod as any).GoogleSignin;
          
          // Configure GoogleSignin first
          GoogleSignin.configure({});
          
          const isSignedIn = await GoogleSignin.isSignedIn();
          
          if (isSignedIn) {
            console.log('[Auth] User is authenticated, setting auth state');
            setAuthState({
              isLoading: false,
              isAuthenticated: true,
              userEmail: emailValue,
              userName: nameValue || '',
              userId: idValue || '',
            });
            return;
          } else {
            // Clear stored state if Google says user is not signed in
            console.log('[Auth] Google sign-in expired, clearing stored data');
            await AsyncStorage.multiRemove(['user_logged_in', 'user_email', 'user_name', 'user_id']);
          }
        } catch (googleError) {
          console.log('[Auth] Error verifying Google sign-in:', googleError);
          // Clear data on error
          await AsyncStorage.multiRemove(['user_logged_in', 'user_email', 'user_name', 'user_id']);
        }
      }

      // User is not authenticated
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        userEmail: null,
        userName: null,
        userId: null,
      });
    } catch (error) {
      console.log('[Auth] Error checking auth state:', error);
      // Clear any corrupted data
      await AsyncStorage.multiRemove(['user_logged_in', 'user_email', 'user_name', 'user_id']).catch(() => {});
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        userEmail: null,
        userName: null,
        userId: null,
      });
    }
  };

  const login = async (email: string, name: string, userId: string) => {
    try {
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
      });

      console.log('[Auth] Login state saved successfully');
    } catch (error) {
      console.log('[Auth] Error saving login state:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Sign out from Google
      const mod = await import('@react-native-google-signin/google-signin');
      const GoogleSignin: any = (mod as any).GoogleSignin;
      
      // Configure GoogleSignin first
      GoogleSignin.configure({});
      
      await GoogleSignin.signOut();
      
      // Clear all stored user data
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
      });

      console.log('[Auth] User signed out successfully');
    } catch (error) {
      console.log('[Auth] Error during logout:', error);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
