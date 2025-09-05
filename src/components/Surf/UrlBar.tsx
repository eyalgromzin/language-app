import React from 'react';
import { TextInput, TouchableOpacity, View, StyleSheet, ScrollView, Keyboard, Text } from 'react-native';
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
  canShare: boolean;
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
  canShare,
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
      <View style={styles.urlBarContainer}>
        <TextInput
          ref={addressInputRef}
          style={styles.urlInput}
          value={addressText}
          onChangeText={setAddressText}
          onSubmitEditing={onSubmit}
          placeholder="Enter website URL"
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
        <TouchableOpacity
          onPress={onFavouritePress}
          style={styles.libraryBtn}
          accessibilityRole="button"
          accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name={isFavourite ? 'star' : 'star-outline'} size={22} color={isFavourite ? '#f59e0b' : '#007AFF'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onBackPress}
          disabled={!canGoBack}
          style={[styles.libraryBtn, !canGoBack && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name="chevron-back" size={22} color={canGoBack ? '#007AFF' : '#999'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onLibraryPress}
          style={styles.libraryBtn}
          accessibilityRole="button"
          accessibilityLabel="Open Library"
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name="albums-outline" size={22} color="#007AFF" />
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
          style={styles.libraryBtn}
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#007AFF" />
        </TouchableOpacity>
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
        canShare={canShare}
        buttonPosition={optionsButtonPosition}
      />
    </>
  );
};

const styles = StyleSheet.create({
  urlBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: 'white',
  },
  libraryBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  suggestionsContainer: {
    marginTop: -8,
    marginHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    fontSize: 14,
    color: '#111827',
  },
});

export default UrlBar;
