import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ReaderNavigationProps = {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  themeColors: {
    headerBg: string;
    headerText: string;
    border: string;
  };
};

export default function ReaderNavigation({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  themeColors
}: ReaderNavigationProps): React.JSX.Element {
  return (
    <View style={[styles.navigationBar, { backgroundColor: themeColors.headerBg, borderTopColor: themeColors.border }]}>
      <TouchableOpacity 
        style={[
          styles.navButton, 
          { 
            borderColor: themeColors.border,
            opacity: currentPage <= 1 ? 0.5 : 1
          }
        ]}
        onPress={onPrevious}
        disabled={currentPage <= 1}
      >
        <Text style={[styles.navButtonText, { color: themeColors.headerText }]}>‹</Text>
      </TouchableOpacity>
      
      <View style={styles.pageInfo}>
        <Text style={[styles.pageNumber, { color: themeColors.headerText }]}>
          Page {currentPage} of {totalPages}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.navButton, 
          { 
            borderColor: themeColors.border,
            opacity: currentPage >= totalPages ? 0.5 : 1
          }
        ]}
        onPress={onNext}
        disabled={currentPage >= totalPages}
      >
        <Text style={[styles.navButtonText, { color: themeColors.headerText }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navigationBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  navButtonText: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
  },
  pageInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
});
