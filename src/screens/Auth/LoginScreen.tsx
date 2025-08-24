import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

function LoginScreen({ navigation }: LoginScreenProps): React.JSX.Element {

  const onGoogleLogin = async () => {
    try {
      const mod = await import('@react-native-google-signin/google-signin');
      const GoogleSignin: any = (mod as any).GoogleSignin;
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      GoogleSignin.configure({});
      const userInfo = await GoogleSignin.signIn();
      const email: string | undefined = userInfo?.data?.user?.email;
      const userId: string | undefined = userInfo?.data?.user?.id;
      const firstName = userInfo?.data?.user?.givenName;
      const lastName = userInfo?.data?.user?.familyName;
      const name = `${firstName} ${lastName}`;
      if (email) {
        console.log('[Google] email =', email);
        navigation.replace('Main');
      } else {
        Alert.alert('Google sign-in succeeded but no email returned');
      }

      console.log('[Google] userInfo =', userInfo); 
    } catch (e: any) {
      const message = e?.message || String(e);
      console.log('[Google] sign-in error:', message);
      Alert.alert('Google sign-in failed');
    }
  };



  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
        
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Login with Google"
          onPress={onGoogleLogin}
          style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </Pressable>
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
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  googleButton: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc3545',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  googleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LoginScreen;


