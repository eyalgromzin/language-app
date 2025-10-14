import React from 'react';
import { View, TextInput, StyleSheet, Text, Platform, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type SearchBarProps = {
  inputUrl: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onOpenPress: () => void;
  urlInputRef: React.RefObject<TextInput> | React.MutableRefObject<TextInput | null>;
  onFocus: () => void;
  onBlur: () => void;
  onOpenLibrary: () => void;
  onToggleHistory: () => void;
  onToggleFavouritesList: () => void;
  showAuxButtons: boolean;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onOptionsButtonPress: (position: { x: number; y: number; width: number; height: number }) => void;
  currentCanonicalUrl: string;
  t: (key: string) => string;
};

const SearchBar: React.FC<SearchBarProps> = ({ 
  inputUrl, 
  onChangeText, 
  onSubmit, 
  onOpenPress, 
  urlInputRef, 
  onFocus, 
  onBlur, 
  onOpenLibrary, 
  onToggleHistory, 
  onToggleFavouritesList, 
  showAuxButtons, 
  isFavourite, 
  onToggleFavourite, 
  onOptionsButtonPress, 
  currentCanonicalUrl, 
  t 
}) => {
  const optionsButtonRef = React.useRef<any>(null);

  return (
    <View style={styles.searchSection}>
      <View style={styles.inputRow}>
        <TextInput
          ref={urlInputRef}
          value={inputUrl}
          onChangeText={onChangeText}
          placeholder={t('screens.video.searchPlaceholder')}
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={Platform.OS === 'ios' ? 'url' : 'default'}
          style={[styles.input, { flex: 1 }]}
          accessibilityLabel={t('screens.video.accessibilityLabels.youtubeUrlInput')}
          onSubmitEditing={onSubmit}
          returnKeyType="go"
          blurOnSubmit={false}
          selectTextOnFocus
          onFocus={() => {
            try {
              onFocus();
              urlInputRef.current?.setNativeProps({ selection: { start: 0, end: inputUrl.length } });
            } catch {}
          }}
          onBlur={onBlur}
          onPressIn={() => {
            try {
              urlInputRef.current?.focus();
              urlInputRef.current?.setNativeProps({ selection: { start: 0, end: inputUrl.length } });
            } catch {}
          }}
        />
        <TouchableOpacity
          style={styles.goButton}
          onPress={onOpenPress}
          accessibilityRole="button"
          accessibilityLabel={t('screens.video.accessibilityLabels.openVideo')}
        >
          <Text style={styles.goButtonText}>{t('screens.video.goButton')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onToggleFavourite}
          style={[styles.libraryBtn, !currentCanonicalUrl && styles.libraryBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel={isFavourite ? t('screens.video.removeFromFavourites') : t('screens.video.addToFavourites')}
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          disabled={!currentCanonicalUrl}
        >
          <Ionicons 
            name={isFavourite ? 'star' : 'star-outline'} 
            size={20} 
            color={!currentCanonicalUrl ? '#cbd5e1' : (isFavourite ? '#f59e0b' : '#64748b')} 
          />
        </TouchableOpacity>
        {showAuxButtons ? (
          <>
            <TouchableOpacity
              onPress={onOpenLibrary}
              style={styles.libraryBtn}
              accessibilityRole="button"
              accessibilityLabel={t('screens.video.accessibilityLabels.openLibrary')}
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            >
              <Ionicons name="albums-outline" size={20} color="#64748b" />
            </TouchableOpacity>
            
            <TouchableOpacity
              ref={optionsButtonRef}
              onPress={() => {
                if (optionsButtonRef.current) {
                  optionsButtonRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                    onOptionsButtonPress({ x: pageX, y: pageY, width, height });
                  });
                }
              }}
              style={styles.libraryBtn}
              accessibilityRole="button"
              accessibilityLabel={t('screens.video.accessibilityLabels.openMenu')}
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#64748b" />
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 0,
    backgroundColor: '#ffffff',
    color: '#2d3748',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  libraryBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  libraryBtnDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  goButton: {
    marginLeft: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#dc2626',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  goButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

export default SearchBar;

