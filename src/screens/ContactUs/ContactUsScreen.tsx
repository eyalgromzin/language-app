import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const SUPPORT_EMAIL = 'support@HelloLingo.app';

function ContactUsScreen(): React.JSX.Element {
  const handleEmailPress = React.useCallback(() => {
    const subject = encodeURIComponent('LanguageLearn Support');
    const body = encodeURIComponent('Hi LanguageLearn team,\n\n');
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    Linking.openURL(mailtoUrl).catch(() => {
      // no-op if unable to open the mail client
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contact Us</Text>
      <Text style={styles.text}>We would love to hear from you. For questions, feedback, or issues, reach us at:</Text>
      <Text style={styles.email}>{SUPPORT_EMAIL}</Text>
      <TouchableOpacity style={styles.button} onPress={handleEmailPress} accessibilityRole="button" accessibilityLabel="Send email to support">
        <Text style={styles.buttonText}>Send Email</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
  email: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactUsScreen;


