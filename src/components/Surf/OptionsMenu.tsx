import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface OptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onSetHomepage: () => void;
  onShowFavourites: () => void;
  onShare: () => void;
  onReportWebsite: () => void;
  canShare: boolean;
  canReport: boolean;
  buttonPosition: { x: number; y: number; width: number; height: number } | null;
}

const OptionsMenu: React.FC<OptionsMenuProps> = ({
  visible,
  onClose,
  onSetHomepage,
  onShowFavourites,
  onShare,
  onReportWebsite,
  canShare,
  canReport,
  buttonPosition,
}) => {
  if (!visible || !buttonPosition) return null;

  const menuItems = [
    {
      title: 'Set homepage',
      icon: 'home-outline',
      onPress: () => {
        onClose();
        onSetHomepage();
      },
    },
    {
      title: 'Favourites list',
      icon: 'star-outline',
      onPress: () => {
        onClose();
        onShowFavourites();
      },
    },
    ...(canShare ? [{
      title: 'Share page',
      icon: 'share-outline',
      onPress: () => {
        onClose();
        onShare();
      },
    }] : []),
    ...(canReport ? [{
      title: 'Report website',
      icon: 'flag-outline',
      onPress: () => {
        onClose();
        onReportWebsite();
      },
    }] : []),
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[
            styles.menuContainer,
            {
              top: buttonPosition.y + buttonPosition.height + 4,
              right: 12,
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon as any} size={16} color="#007AFF" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 180,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
  },
});

export default OptionsMenu;
