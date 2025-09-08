import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, SafeAreaView, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SUPPORT_EMAIL = 'support@HelloLingo.app';

function ContactUsScreen(): React.JSX.Element {
  const handleEmailPress = React.useCallback(() => {
    const subject = encodeURIComponent('HelloLingo Support');
    const body = encodeURIComponent('Hi HelloLingo team,\n\n');
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert('Error', 'Unable to open email client. Please contact us directly at support@HelloLingo.app');
    });
  }, []);

  const handleWebsitePress = React.useCallback(() => {
    Linking.openURL('https://HelloLingo.app').catch(() => {
      Alert.alert('Error', 'Unable to open website');
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={32} color="#007AFF" />
          </View>
          <Text style={styles.title}>Get in Touch</Text>
          <Text style={styles.subtitle}>
            We're here to help! Reach out to us for support, feedback, or any questions you might have.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.contactMethod}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={24} color="#007AFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactDescription}>
                Get help with your account, technical issues, or general questions
              </Text>
              <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleEmailPress} 
            accessibilityRole="button" 
            accessibilityLabel="Send email to support"
          >
            <Ionicons name="send" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Send Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.contactMethod}>
            <View style={styles.contactIcon}>
              <Ionicons name="globe-outline" size={24} color="#007AFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Visit Our Website</Text>
              <Text style={styles.contactDescription}>
                Learn more about HelloLingo and discover additional resources
              </Text>
              <Text style={styles.contactValue}>HelloLingo.app</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleWebsitePress} 
            accessibilityRole="button" 
            accessibilityLabel="Visit HelloLingo website"
          >
            <Ionicons name="open-outline" size={20} color="#007AFF" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Visit Website</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#059669" />
            <Text style={styles.infoTitle}>Response Time</Text>
          </View>
          <Text style={styles.infoText}>
            We typically respond to emails within 24 hours during business days. 
            For urgent issues, please include "URGENT" in your subject line.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for using HelloLingo! Your feedback helps us improve the app for everyone.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contactMethod: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  infoCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default ContactUsScreen;


