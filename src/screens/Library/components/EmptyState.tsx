import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface EmptyStateProps {
  searchQuery: string;
  onClearSearch: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery, onClearSearch }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="library-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? t('screens.library.states.noResults') : t('screens.library.states.noResources')}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? t('screens.library.states.noResultsMessage', { query: searchQuery })
          : t('screens.library.states.noResourcesMessage')
        }
      </Text>
      {searchQuery && (
        <TouchableOpacity
          style={styles.clearSearchEmptyButton}
          onPress={onClearSearch}
        >
          <Text style={styles.clearSearchEmptyText}>{t('screens.library.states.clearSearch')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearSearchEmptyButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchEmptyText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmptyState;
