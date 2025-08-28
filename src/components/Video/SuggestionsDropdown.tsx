import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type HistoryEntry = {
  url: string;
  title: string;
};

type FavouriteItem = {
  url: string;
  name: string;
  typeId?: number;
  typeName?: string;
  levelName?: string;
};

type SuggestionsDropdownProps = {
  showHistory: boolean;
  showFavourites: boolean;
  isInputFocused: boolean;
  savedHistory: HistoryEntry[];
  favourites: FavouriteItem[];
  onSelectHistory: (entry: HistoryEntry) => void;
  onSelectFavourite: (fav: FavouriteItem) => void;
};

const SuggestionsDropdown: React.FC<SuggestionsDropdownProps> = ({
  showHistory,
  showFavourites,
  isInputFocused,
  savedHistory,
  favourites,
  onSelectHistory,
  onSelectFavourite,
}) => {
  if (showHistory && !isInputFocused && savedHistory.length > 0) {
    return (
      <View style={styles.suggestionsContainer}>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
          {savedHistory.map((h) => (
            <TouchableOpacity key={h.url} style={styles.suggestionItem} onPress={() => onSelectHistory(h)}>
              <Ionicons name="time-outline" size={16} color="#4b5563" style={{ marginRight: 8 }} />
              <Text style={styles.suggestionText} numberOfLines={1}>
                {h.title?.trim() ? h.title : h.url}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (showFavourites && !isInputFocused && favourites.length > 0) {
    return (
      <View style={styles.suggestionsContainer}>
        <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 240 }}>
          {favourites.map((f) => (
            <TouchableOpacity key={f.url} style={styles.suggestionItem} onPress={() => onSelectFavourite(f)}>
              <Ionicons name="star" size={16} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={styles.suggestionText} numberOfLines={1}>
                {f.name || f.url}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  suggestionsContainer: {
    marginTop: -4,
    marginBottom: 8,
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
    flexShrink: 1,
  },
});

export default SuggestionsDropdown;
