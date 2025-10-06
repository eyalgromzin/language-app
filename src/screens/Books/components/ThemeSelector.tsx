import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type ReaderTheme = 'white' | 'beige';

type ThemeSelectorProps = {
  currentTheme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
  themeColors: {
    menuBg: string;
    menuText: string;
    border: string;
  };
};

export default function ThemeSelector({ currentTheme, onThemeChange, themeColors }: ThemeSelectorProps): React.JSX.Element {
  return (
    <View style={[styles.themeMenu, { backgroundColor: themeColors.menuBg, borderColor: themeColors.border }]}>
      {(['white', 'beige'] as ReaderTheme[]).map((theme) => (
        <TouchableOpacity
          key={theme}
          onPress={() => onThemeChange(theme)}
          style={[styles.themeMenuItem, currentTheme === theme ? styles.themeMenuItemActive : null]}
        >
          <View style={[
            styles.themeSwatch, 
            theme === 'white' 
              ? { backgroundColor: '#ffffff', borderColor: '#e5e7eb' } 
              : { backgroundColor: '#f5f1e8', borderColor: '#e5dfcf' }
          ]} />
          <Text style={[styles.themeMenuItemText, { color: themeColors.menuText }]}>
            {theme === 'white' ? 'White' : 'Beige'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  themeMenu: {
    position: 'absolute',
    right: 12,
    top: 56,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    width: 180,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 1000,
  },
  themeMenuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 12 
  },
  themeMenuItemActive: {},
  themeMenuItemText: { 
    marginLeft: 10, 
    fontSize: 14 
  },
  themeSwatch: { 
    width: 20, 
    height: 20, 
    borderRadius: 4, 
    borderWidth: StyleSheet.hairlineWidth 
  },
});
