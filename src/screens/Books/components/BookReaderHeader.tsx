import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeSelector, type ReaderTheme } from './index';

type ThemeColors = {
  headerBg: string;
  headerText: string;
  border: string;
  menuBg: string;
  menuText: string;
};

type BookReaderHeaderProps = {
  bookTitle: string;
  readerTheme: ReaderTheme;
  themeColors: ThemeColors;
  showThemeMenu: boolean;
  onBack: () => void;
  onFavouriteClick: () => void;
  onThemeMenuToggle: () => void;
  onThemeChange: (theme: ReaderTheme) => void;
};

export default function BookReaderHeader({
  bookTitle,
  readerTheme,
  themeColors,
  showThemeMenu,
  onBack,
  onFavouriteClick,
  onThemeMenuToggle,
  onThemeChange,
}: BookReaderHeaderProps): React.JSX.Element {
  return (
    <>
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.headerText }]} numberOfLines={1}>
          {bookTitle || 'Reader'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onFavouriteClick} style={styles.favouriteBtn}>
            <Text style={[styles.favouriteBtnText, { color: themeColors.headerText }]}>★</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onThemeMenuToggle} style={styles.themeBtn}>
            <Text style={[styles.themeBtnText, { color: themeColors.headerText }]}>Aa</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showThemeMenu && (
        <ThemeSelector
          currentTheme={readerTheme}
          onThemeChange={(theme) => {
            onThemeChange(theme);
            onThemeMenuToggle();
          }}
          themeColors={{
            menuBg: themeColors.menuBg,
            menuText: themeColors.menuText,
            border: themeColors.border,
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { paddingVertical: 8, paddingHorizontal: 8 },
  backText: { color: '#007AFF', fontWeight: '700' },
  title: { flex: 1, textAlign: 'center', fontWeight: '700' },
  favouriteBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginRight: 8 },
  favouriteBtnText: { fontWeight: '700', fontSize: 18 },
  themeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  themeBtnText: {
    fontWeight: '700',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'black',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});
