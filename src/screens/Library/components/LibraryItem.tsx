import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface LibraryItemProps {
  item: {
    url: string;
    name?: string;
    type: string;
    level: string;
    media: string;
  };
  translateOption: (option: string, type: 'type' | 'level') => string;
  getDisplayName: (item: { url: string; name?: string | null }) => string;
  onAddToFavourites?: (item: { url: string; name?: string; type: string; level: string; media: string }) => void;
  isFavourite?: boolean;
}

const LibraryItem: React.FC<LibraryItemProps> = ({ item, translateOption, getDisplayName, onAddToFavourites, isFavourite = false }) => {
  const navigation = useNavigation<any>();

  const getMediaIcon = (media: string) => {
    const mediaLower = media.toLowerCase();
    switch (mediaLower) {
      case 'youtube':
        return <Ionicons name="logo-youtube" size={18} color="#FF0000" />;
      case 'web':
        return <Ionicons name="globe-outline" size={18} color="#007AFF" />;
      case 'book':
        return <Ionicons name="book-outline" size={18} color="#8B4513" />;
      default:
        return <Ionicons name="document-outline" size={18} color="#6B7280" />;
    }
  };

  const getLevelColor = (level: string) => {
    const levelLower = level.toLowerCase();
    if (levelLower.includes('easy') || levelLower.includes('a1') || levelLower.includes('a2')) {
      return '#10B981'; // Green for easy levels
    } else if (levelLower.includes('medium') || levelLower.includes('b1') || levelLower.includes('b2')) {
      return '#F59E0B'; // Orange for medium levels
    } else if (levelLower.includes('hard') || levelLower.includes('c1') || levelLower.includes('c2') || levelLower.includes('native')) {
      return '#EF4444'; // Red for hard/native levels
    }
    return '#6B7280'; // Default gray
  };

  const handlePress = () => {
    if ((item.media || '').toLowerCase() === 'youtube') {
      navigation.navigate('Video', { youtubeUrl: item.url, youtubeTitle: item.name });
    } else {
      // Open SurfScreen with the passed URL for all non-youtube media types
      navigation.navigate('Surf', { url: item.url });
    }
  };

  const handleAddToFavourites = (e: any) => {
    e.stopPropagation();
    if (onAddToFavourites) {
      onAddToFavourites(item);
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="link"
      onPress={handlePress}
      style={styles.item}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.mediaIconContainer}>
          {getMediaIcon(item.media)}
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={2}>
            {getDisplayName(item)}
          </Text>
          <View style={styles.itemMeta}>
            <View style={styles.metaRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{translateOption(item.type, 'type')}</Text>
              </View>
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) + '15' }]}>
                <Text style={[styles.levelText, { color: getLevelColor(item.level) }]}>
                  {translateOption(item.level, 'level')}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.itemActions}>
          {onAddToFavourites && (
            <TouchableOpacity
              onPress={handleAddToFavourites}
              style={styles.favouriteButton}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isFavourite ? "star" : "star-outline"} 
                size={20} 
                color={isFavourite ? "#f59e0b" : "#9CA3AF"} 
              />
            </TouchableOpacity>
          )}
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 8,
  },
  itemMeta: {
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favouriteButton: {
    padding: 4,
    borderRadius: 6,
  },
});

export default LibraryItem;
