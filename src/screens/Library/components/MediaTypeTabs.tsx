import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface MediaTypeTabsProps {
  selectedMedia: 'all' | 'web' | 'youtube' | 'book';
  onMediaChange: (media: 'all' | 'web' | 'youtube' | 'book') => void;
}

const MediaTypeTabs: React.FC<MediaTypeTabsProps> = ({ selectedMedia, onMediaChange }) => {
  const { t } = useTranslation();

  const tabs = [
    { key: 'all', label: t('screens.library.tabs.all'), icon: 'grid-outline' },
    { key: 'web', label: t('screens.library.tabs.web'), icon: 'globe-outline' },
    { key: 'youtube', label: t('screens.library.tabs.youtube'), icon: 'logo-youtube' },
    { key: 'book', label: t('screens.library.tabs.books'), icon: 'book-outline' },
  ] as const;

  return (
    <View style={styles.tabsBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, selectedMedia === tab.key && styles.tabButtonActive]}
            onPress={() => onMediaChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedMedia === tab.key }}
            accessibilityLabel={t('screens.library.accessibility.selectTab', { tab: tab.label })}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={16} 
              color={selectedMedia === tab.key ? '#FFFFFF' : '#6B7280'} 
              style={styles.tabIcon}
            />
            <Text style={[styles.tabText, selectedMedia === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabsBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: '#6366F1',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});

export default MediaTypeTabs;
