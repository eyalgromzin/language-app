import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, ActivityIndicator, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const { width } = Dimensions.get('window');

function LoginScreen({ navigation }: LoginScreenProps): React.JSX.Element {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const onGoogleLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const mod = await import('@react-native-google-signin/google-signin');
      const GoogleSignin: any = (mod as any).GoogleSignin;
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      GoogleSignin.configure({
        webClientId: '991572944669-ht962460cmp9t2fa8mgofg3sn7bmb1je.apps.googleusercontent.com',
      });
      const userInfo = await GoogleSignin.signIn();
      const email: string | undefined = userInfo?.data?.user?.email;
      const userId: string | undefined = userInfo?.data?.user?.id;
      const firstName = userInfo?.data?.user?.givenName;
      const lastName = userInfo?.data?.user?.familyName;
      const name = `${firstName} ${lastName}`;
      if (email) {
        console.log('[Google] email =', email);
        
        // Use auth context to handle login
        try {
          await login(email, name, userId || '');
          console.log('[Google] Login successful');
          // Navigation will be handled automatically by AuthContext
        } catch (loginError) {
          console.log('[Google] Error during login:', loginError);
          Alert.alert('Login Error', 'Failed to save login information. Please try again.');
        }
      } else {
        Alert.alert('Google sign-in succeeded but no email returned');
      }

      console.log('[Google] userInfo =', userInfo); 
    } catch (e: any) {
      const message = e?.message || String(e);
      console.log('[Google] sign-in error:', message);
      Alert.alert('Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* App Logo/Branding */}
        <View style={styles.logoContainer}>
          <Ionicons name="school" size={48} color="#6366F1" />
          <Text style={styles.appName}>Hello Lingo</Text>
        </View>
        
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your language learning journey</Text>
        
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Login with Google"
          onPress={onGoogleLogin}
          style={({ pressed }) => [
            styles.googleButton, 
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled
          ]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#fff" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>
        
        <Text style={styles.privacyText}>
          By signing in, you agree to our To terms or service to learn every day and have fun while learning ;)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 280,
    shadowColor: '#4285F4',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 24,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  privacyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});

export default LoginScreen;


