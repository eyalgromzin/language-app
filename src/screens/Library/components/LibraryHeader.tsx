import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinkingService from '../../../services/linkingService';

interface LibraryHeaderProps {
  onSharePress?: () => void;
}

const LibraryHeader: React.FC<LibraryHeaderProps> = ({ onSharePress }) => {
  const { t } = useTranslation();

  const handleSharePress = () => {
    if (onSharePress) {
      onSharePress();
    } else {
      LinkingService.shareLibrary();
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('screens.library.title')}</Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleSharePress}
            accessibilityRole="button"
            accessibilityLabel={t('screens.library.accessibility.shareLibrary')}
          >
            <Ionicons name="share-outline" size={22} color="#6366F1" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  shareButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
});

export default LibraryHeader;
