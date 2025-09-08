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
      title: 'Set Homepage',
      subtitle: 'Set current page as homepage',
      icon: 'home-outline',
      iconColor: '#3b82f6',
      onPress: () => {
        onClose();
        onSetHomepage();
      },
    },
    {
      title: 'Favourites List',
      subtitle: 'View saved websites',
      icon: 'star-outline',
      iconColor: '#f59e0b',
      onPress: () => {
        onClose();
        onShowFavourites();
      },
    },
    ...(canShare ? [{
      title: 'Share Page',
      subtitle: 'Share this website',
      icon: 'share-outline',
      iconColor: '#10b981',
      onPress: () => {
        onClose();
        onShare();
      },
    }] : []),
    ...(canReport ? [{
      title: 'Report Website',
      subtitle: 'Report inappropriate content',
      icon: 'flag-outline',
      iconColor: '#ef4444',
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
              top: buttonPosition.y + buttonPosition.height + 8,
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
              <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}15` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    minWidth: 240,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 16,
  },
});

export default OptionsMenu;
