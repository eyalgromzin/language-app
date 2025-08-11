import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

function LoginScreen({ navigation }: LoginScreenProps): React.JSX.Element {
  const [email, setEmail] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Please enter email and password');
      return;
    }
    setIsSubmitting(true);
    // Fake auth delay
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    navigation.replace('Main');
  };

  const onGoogleLogin = async () => {
    try {
      const mod = await import('@react-native-google-signin/google-signin');
      const GoogleSignin: any = (mod as any).GoogleSignin;
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      GoogleSignin.configure({});
      const userInfo = await GoogleSignin.signIn();
      const email: string | undefined = userInfo?.user?.email;
      if (email) {
        console.log('[Google] email =', email);
        navigation.replace('Main');
      } else {
        Alert.alert('Google sign-in succeeded but no email returned');
      }
    } catch (e: any) {
      const message = e?.message || String(e);
      console.log('[Google] sign-in error:', message);
      Alert.alert('Google sign-in failed');
    }
  };

  const onFacebookLogin = async () => {
    try {
      const mod = await import('react-native-fbsdk-next');
      const LoginManager: any = (mod as any).LoginManager;
      const AccessToken: any = (mod as any).AccessToken;
      const GraphRequest: any = (mod as any).GraphRequest;
      const GraphRequestManager: any = (mod as any).GraphRequestManager;

      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result?.isCancelled) {
        return;
      }
      const tokenData = await AccessToken.getCurrentAccessToken();
      const accessToken: string | undefined = tokenData?.accessToken?.toString?.();
      if (!accessToken) {
        throw new Error('Missing access token');
      }

      const email: string | undefined = await new Promise((resolve, reject) => {
        const request = new GraphRequest(
          '/me',
          { accessToken, parameters: { fields: { string: 'id,name,email' } } },
          (error: unknown, resultData: any) => {
            if (error) reject(error);
            else resolve(resultData?.email);
          }
        );
        new GraphRequestManager().addRequest(request).start();
      });

      if (email) {
        console.log('[Facebook] email =', email);
        navigation.replace('Main');
      } else {
        Alert.alert('Facebook login succeeded but no email returned');
      }
    } catch (e: any) {
      const message = e?.message || String(e);
      console.log('[Facebook] login error:', message);
      Alert.alert('Facebook login failed');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          returnKeyType="go"
          onSubmitEditing={onSubmit}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in with email and password"
          onPress={onSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isSubmitting && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Login with Google"
            onPress={onGoogleLogin}
            style={({ pressed }) => [styles.socialButton, styles.socialButtonGoogle, pressed && styles.buttonPressed]}
          >
            <Text style={[styles.socialButtonText, styles.socialButtonGoogleText]}>Continue with Google</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Login with Facebook"
            onPress={onFacebookLogin}
            style={({ pressed }) => [styles.socialButton, styles.socialButtonFacebook, pressed && styles.buttonPressed]}
          >
            <Text style={[styles.socialButtonText, styles.socialButtonFacebookText]}>Continue with Facebook</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  dividerText: {
    color: '#7a7a7a',
  },
  socialContainer: {
    gap: 10,
  },
  socialButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  socialButtonText: {
    fontWeight: '600',
  },
  socialButtonGoogle: {
    backgroundColor: '#fff',
    borderColor: '#dadce0',
  },
  socialButtonGoogleText: {
    color: '#3c4043',
  },
  socialButtonFacebook: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialButtonFacebookText: {
    color: '#fff',
  },
});

export default LoginScreen;


