import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLoginGate } from '../contexts/LoginGateContext';
import { useAuth } from '../contexts/AuthContext';

function LoginGateModal(): React.JSX.Element {
  const { isLoginGateVisible, hideLoginGate } = useLoginGate();
  const { login } = useAuth();

  console.log('[LoginGateModal] Rendering with isLoginGateVisible:', isLoginGateVisible);

  const onGoogleLogin = async () => {
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
        console.log('[LoginGate] Google login email =', email);
        
        try {
          await login(email, name, userId || '');
          console.log('[LoginGate] Login successful');
          hideLoginGate();
        } catch (loginError) {
          console.log('[LoginGate] Error during login:', loginError);
          Alert.alert('Login Error', 'Failed to save login information. Please try again.');
        }
      } else {
        Alert.alert('Google sign-in succeeded but no email returned');
      }
    } catch (e: any) {
      const message = e?.message || String(e);
      console.log('[LoginGate] Google sign-in error:', message);
      Alert.alert('Google sign-in failed');
    }
  };

  const onCancel = () => {
    hideLoginGate();
  };

  return (
    <Modal
      visible={isLoginGateVisible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.content}>
            <Text style={styles.title}>Continue Learning</Text>
            <Text style={styles.subtitle}>
              You've added 3 words! Sign in to continue adding more words and track your progress.
            </Text>
            
            <View style={styles.buttonContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in with Google"
                onPress={onGoogleLogin}
                style={({ pressed }) => [styles.loginButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.loginButtonText}>Sign in with Google</Text>
              </Pressable>
              
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Maybe later"
                onPress={onCancel}
                style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.cancelButtonText}>Maybe later</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  loginButton: {
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dc3545',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 16,
  },
});

export default LoginGateModal;
