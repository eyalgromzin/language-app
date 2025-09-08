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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Favourites</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.favouritesList} showsVerticalScrollIndicator={false}>
            {favourites.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No favourites yet</Text>
                <Text style={styles.emptySubtext}>Add websites to your favourites for quick access</Text>
              </View>
            )}
            {favourites.map((f) => (
              <TouchableOpacity
                key={f.url}
                style={styles.favItem}
                onPress={() => onFavouritePress(f.url)}
                activeOpacity={0.7}
              >
                <View style={styles.favItemContent}>
                  <View style={styles.favIconContainer}>
                    <Ionicons name="star" size={18} color="#f59e0b" />
                  </View>
                  <View style={styles.favTextContainer}>
                    <Text numberOfLines={1} style={styles.favText}>{f.name}</Text>
                    {f.typeName && (
                      <Text numberOfLines={1} style={styles.favTypeText}>{f.typeName}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => onRemoveFavourite(f.url)}
                  style={styles.favRemoveBtn}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favouritesList: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  favItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  favItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  favIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  favTextContainer: {
    flex: 1,
  },
  favText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  favTypeText: {
    fontSize: 13,
    color: '#64748b',
  },
  favRemoveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FavouritesModal;
