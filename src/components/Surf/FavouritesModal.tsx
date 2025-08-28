import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface FavouriteItem {
  url: string;
  name: string;
  typeId?: number;
  typeName?: string;
  levelName?: string;
}

interface FavouritesModalProps {
  visible: boolean;
  onClose: () => void;
  favourites: FavouriteItem[];
  onFavouritePress: (url: string) => void;
  onRemoveFavourite: (url: string) => void;
}

const FavouritesModal: React.FC<FavouritesModalProps> = ({
  visible,
  onClose,
  favourites,
  onFavouritePress,
  onRemoveFavourite,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Favourites</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {favourites.length === 0 && (
              <Text style={styles.emptyText}>No favourites yet</Text>
            )}
            {favourites.map((f) => (
              <TouchableOpacity
                key={f.url}
                style={styles.favItem}
                onPress={() => onFavouritePress(f.url)}
              >
                <Ionicons name="star" size={16} color="#f59e0b" style={{ marginRight: 8 }} />
                <Text numberOfLines={1} style={styles.favText}>{f.name}</Text>
                <TouchableOpacity
                  onPress={() => onRemoveFavourite(f.url)}
                  style={styles.favRemoveBtn}
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <Ionicons name="close" size={18} color="#6b7280" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ alignItems: 'flex-end', marginTop: 10 }}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyText: {
    color: '#6b7280',
    marginVertical: 8,
  },
  favItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  favText: {
    flex: 1,
    color: '#111827',
  },
  favRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 13,
    color: '#374151',
  },
});

export default FavouritesModal;
