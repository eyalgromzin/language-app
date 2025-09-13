import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, SafeAreaView, ScrollView, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

function ContactUsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { supportEmail } = useAuth();
  
  const handleEmailPress = React.useCallback(() => {
    const email = supportEmail || 'support@hellolingo.app';
    const subject = encodeURIComponent(t('screens.contactUs.emailSubject'));
    const body = encodeURIComponent(t('screens.contactUs.emailBody'));
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(t('common.error'), t('screens.contactUs.unableToOpenEmail'));
    });
  }, [t, supportEmail]);

  const handleWebsitePress = React.useCallback(() => {
    Linking.openURL('https://HelloLingo.app').catch(() => {
      Alert.alert(t('common.error'), t('screens.contactUs.unableToOpenWebsite'));
    });
  }, [t]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={32} color="#007AFF" />
          </View>
          <Text style={styles.title}>{t('screens.contactUs.getInTouch')}</Text>
          <Text style={styles.subtitle}>
            {t('screens.contactUs.subtitle')}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.contactMethod}>
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={24} color="#007AFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t('screens.contactUs.emailSupport')}</Text>
              <Text style={styles.contactDescription}>
                {t('screens.contactUs.emailDescription')}
              </Text>
              <Text style={styles.contactValue}>{supportEmail || 'support@hellolingo.app'}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleEmailPress} 
            accessibilityRole="button" 
             accessibilityLabel={t('screens.contactUs.sendEmailAccessibility')}
          >
            <Ionicons name="send" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>{t('screens.contactUs.sendEmail')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.contactMethod}>
            <View style={styles.contactIcon}>
              <Ionicons name="globe-outline" size={24} color="#007AFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{t('screens.contactUs.visitOurWebsite')}</Text>
              <Text style={styles.contactDescription}>
                {t('screens.contactUs.websiteDescription')}
              </Text>
               <Text style={styles.contactValue}>{t('screens.contactUs.websiteUrl')}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleWebsitePress} 
            accessibilityRole="button" 
             accessibilityLabel={t('screens.contactUs.visitWebsiteAccessibility')}
          >
            <Ionicons name="open-outline" size={20} color="#007AFF" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>{t('screens.contactUs.visitWebsite')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={24} color="#059669" />
            <Text style={styles.infoTitle}>{t('screens.contactUs.responseTime')}</Text>
          </View>
          <Text style={styles.infoText}>
            {t('screens.contactUs.responseTimeDescription')}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('screens.contactUs.footerText')}
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


