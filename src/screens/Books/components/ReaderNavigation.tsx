import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type ReaderNavigationProps = {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  onPrevious10: () => void;
  onNext10: () => void;
  pagesToJump: number;
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
  onPrevious10,
  onNext10,
  pagesToJump,
  themeColors
}: ReaderNavigationProps): React.JSX.Element {
  const canGoPrevious10 = currentPage > 1;
  const canGoNext10 = currentPage < totalPages;

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

      <TouchableOpacity 
        style={[
          styles.navButton10, 
          { 
            borderColor: themeColors.border,
            opacity: !canGoPrevious10 ? 0.5 : 1
          }
        ]}
        onPress={onPrevious10}
        disabled={!canGoPrevious10}
      >
        <Text style={[styles.navButton10Text, { color: themeColors.headerText }]}>«{pagesToJump}</Text>
      </TouchableOpacity>
      
      <View style={styles.pageInfo}>
        <Text style={[styles.pageNumber, { color: themeColors.headerText }]}>
          Page {currentPage} of {totalPages}
        </Text>
      </View>

      <TouchableOpacity 
        style={[
          styles.navButton10, 
          { 
            borderColor: themeColors.border,
            opacity: !canGoNext10 ? 0.5 : 1
          }
        ]}
        onPress={onNext10}
        disabled={!canGoNext10}
      >
        <Text style={[styles.navButton10Text, { color: themeColors.headerText }]}>{pagesToJump}»</Text>
      </TouchableOpacity>
      
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
  navButton10: {
    width: 50,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 4,
  },
  navButton10Text: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 14,
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
