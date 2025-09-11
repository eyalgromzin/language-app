import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../../hooks/useTranslation';

interface VideoOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onToggleHistory: () => void;
  onToggleFavouritesList: () => void;
  onShare?: () => void;
  canShare?: boolean;
  buttonPosition: { x: number; y: number; width: number; height: number } | null;
}

const VideoOptionsMenu: React.FC<VideoOptionsMenuProps> = ({
  visible,
  onClose,
  onToggleHistory,
  onToggleFavouritesList,
  onShare,
  canShare = false,
  buttonPosition,
}) => {
  const { t } = useTranslation();
  
  if (!visible || !buttonPosition) return null;

  const menuItems = [
    {
      title: t('screens.video.optionsMenu.history'),
      icon: 'time-outline',
      onPress: () => {
        onClose();
        onToggleHistory();
      },
    },
    {
      title: t('screens.video.optionsMenu.favouritesList'),
      icon: 'star-outline',
      onPress: () => {
        onClose();
        onToggleFavouritesList();
      },
    },
    {
      title: t('screens.video.optionsMenu.shareVideo'),
      icon: 'share-outline',
      onPress: canShare && onShare ? () => {
        onClose();
        onShare();
      } : undefined,
      disabled: !canShare || !onShare,
    },
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
              style={[styles.menuItem, item.disabled && styles.menuItemDisabled]}
              onPress={item.onPress}
              activeOpacity={item.disabled ? 1 : 0.7}
              disabled={item.disabled}
            >
              <Ionicons 
                name={item.icon as any} 
                size={16} 
                color={item.disabled ? "#9CA3AF" : "#007AFF"} 
              />
              <Text style={[styles.menuItemText, item.disabled && styles.menuItemTextDisabled]}>
                {item.title}
              </Text>
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
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
  },
  menuItemTextDisabled: {
    color: '#9CA3AF',
  },
});

export default VideoOptionsMenu;
