import React from 'react';
import { TextInput, TouchableOpacity, View, StyleSheet, ScrollView, Keyboard, Text, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OptionsMenu from './OptionsMenu';

interface UrlBarProps {
  addressText: string;
  setAddressText: (text: string) => void;
  onSubmit: () => void;
  onFavouritePress: () => void;
  onBackPress: () => void;
  onLibraryPress: () => void;
  onOptionsPress: () => void;
  onSetHomepage: () => void;
  onShowFavourites: () => void;
  onShare: () => void;
  onReportWebsite: () => void;
  canShare: boolean;
  canReport: boolean;
  canGoBack: boolean;
  isFavourite: boolean;
  isAddressFocused: boolean;
  setIsAddressFocused: (focused: boolean) => void;
  filteredDomains: string[];
  onSelectSuggestion: (domain: string) => void;
  addressInputRef: React.RefObject<TextInput | null>;
}

const UrlBar: React.FC<UrlBarProps> = ({
  addressText,
  setAddressText,
  onSubmit,
  onFavouritePress,
  onBackPress,
  onLibraryPress,
  onOptionsPress,
  onSetHomepage,
  onShowFavourites,
  onShare,
  onReportWebsite,
  canShare,
  canReport,
  canGoBack,
  isFavourite,
  isAddressFocused,
  setIsAddressFocused,
  filteredDomains,
  onSelectSuggestion,
  addressInputRef,
}) => {
  const [showOptionsMenu, setShowOptionsMenu] = React.useState(false);
  const [optionsButtonPosition, setOptionsButtonPosition] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const optionsButtonRef = React.useRef<any>(null);
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.urlBarContainer}>
        <View style={styles.urlInputContainer}>
          <Ionicons name="globe-outline" size={18} color="#6b7280" style={styles.urlIcon} />
          <TextInput
            ref={addressInputRef}
            style={styles.urlInput}
            value={addressText}
            onChangeText={setAddressText}
            onSubmitEditing={onSubmit}
            placeholder="Search or enter website URL"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            selectTextOnFocus
            onFocus={() => {
              setIsAddressFocused(true);
              try {
                addressInputRef.current?.setNativeProps({ selection: { start: 0, end: addressText.length } });
              } catch (e) {}
            }}
            onPressIn={() => {
              try {
                addressInputRef.current?.focus();
                addressInputRef.current?.setNativeProps({ selection: { start: 0, end: addressText.length } });
              } catch (e) {}
            }}
          />
        </View>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            onPress={onBackPress}
            disabled={!canGoBack}
            style={[styles.actionBtn, !canGoBack && styles.actionBtnDisabled]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={canGoBack ? '#000000' : '#9ca3af'} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onFavouritePress}
            style={[styles.actionBtn, isFavourite && styles.actionBtnActive]}
            accessibilityRole="button"
            accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name={isFavourite ? 'star' : 'star-outline'} size={20} color={isFavourite ? '#ffffff' : '#6b7280'} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onLibraryPress}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Open Library"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="albums-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          <TouchableOpacity
            ref={optionsButtonRef}
            onPress={() => {
              if (optionsButtonRef.current) {
                optionsButtonRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                  setOptionsButtonPosition({ x: pageX, y: pageY, width, height });
                  setShowOptionsMenu(true);
                });
              }
            }}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="More options"
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
      {isAddressFocused && filteredDomains.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
            {filteredDomains.map((d) => (
              <TouchableOpacity key={d} style={styles.suggestionItem} onPress={() => onSelectSuggestion(d)}>
                <Ionicons name="globe-outline" size={16} color="#4b5563" style={{ marginRight: 8 }} />
                <Text style={styles.suggestionText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <OptionsMenu
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        onSetHomepage={onSetHomepage}
        onShowFavourites={onShowFavourites}
        onShare={onShare}
        onReportWebsite={onReportWebsite}
        canShare={canShare}
        canReport={canReport}
        buttonPosition={optionsButtonPosition}
      />
    </>
  );
};

const styles = StyleSheet.create({
  urlBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  urlInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
  },
  urlIcon: {
    marginRight: 8,
  },
  urlInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 0,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  actionBtnDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  suggestionsContainer: {
    marginTop: -1,
    marginHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
});

export default UrlBar;
