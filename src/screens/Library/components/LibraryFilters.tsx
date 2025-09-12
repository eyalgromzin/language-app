import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

interface LibraryFiltersProps {
  selectedType: string;
  selectedLevel: string;
  selectedMedia: 'all' | 'web' | 'youtube' | 'book';
  onTypeDropdownToggle: () => void;
  onLevelDropdownToggle: () => void;
  onClearFilters: () => void;
  translateOption: (option: string, type: 'type' | 'level') => string;
}

const LibraryFilters: React.FC<LibraryFiltersProps> = ({
  selectedType,
  selectedLevel,
  selectedMedia,
  onTypeDropdownToggle,
  onLevelDropdownToggle,
  onClearFilters,
  translateOption,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.filtersBar}>
      <View style={styles.filtersRow}>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={onTypeDropdownToggle}
          >
            <Text style={styles.dropdownButtonText}>
              {t('screens.library.filters.type')}: {translateOption(selectedType, 'type')}
            </Text>
          </TouchableOpacity>
        </View>

        {selectedMedia !== 'book' && (
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={onLevelDropdownToggle}
            >
              <Text style={styles.dropdownButtonText}>
                {t('screens.library.filters.level')}: {translateOption(selectedLevel, 'level')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {(selectedType !== 'All' || selectedLevel !== 'All') && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={onClearFilters}
        >
          <Text style={styles.clearFiltersText}>
            {t('screens.library.filters.clearFilters')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  filtersBar: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdownButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearFiltersButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default LibraryFilters;
