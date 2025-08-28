import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

type FavouritesModalProps = {
  visible: boolean;
  newFavName: string;
  newFavUrl: string;
  newFavLevelName: string | null;
  showLevelOptions: boolean;
  onClose: () => void;
  onSave: () => void;
  onNameChange: (name: string) => void;
  onUrlChange: (url: string) => void;
  onLevelChange: (level: string) => void;
  onToggleLevelOptions: () => void;
};

const FavouritesModal: React.FC<FavouritesModalProps> = ({
  visible,
  newFavName,
  newFavUrl,
  newFavLevelName,
  showLevelOptions,
  onClose,
  onSave,
  onNameChange,
  onUrlChange,
  onLevelChange,
  onToggleLevelOptions,
}) => {
  const levels = ['easy', 'easy-medium', 'medium', 'medium-hard', 'hard'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add to favourites</Text>
          
          <Text style={styles.inputLabel}>Level</Text>
          <TouchableOpacity
            onPress={onToggleLevelOptions}
            style={styles.modalInput}
            activeOpacity={0.7}
          >
            <Text style={{ color: newFavLevelName ? '#111827' : '#9ca3af' }}>
              {newFavLevelName || 'Select level'}
            </Text>
          </TouchableOpacity>
          
          {showLevelOptions && (
            <View style={[styles.modalInput, { paddingVertical: 0, marginTop: 8 }]}>
              {levels.map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => {
                    onLevelChange(level);
                    onToggleLevelOptions();
                  }}
                  style={{ paddingVertical: 10 }}
                >
                  <Text style={{ color: '#111827' }}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.modalInput}
            value={newFavName}
            onChangeText={onNameChange}
            placeholder="Enter a name"
          />
          
          <Text style={styles.inputLabel}>URL</Text>
          <TextInput
            style={styles.modalInput}
            value={newFavUrl}
            onChangeText={onUrlChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} style={[styles.modalCloseBtn, { backgroundColor: '#007AFF' }]}>
              <Text style={[styles.modalCloseText, { color: 'white' }]}>OK</Text>
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
  inputLabel: {
    fontSize: 12,
    color: '#374151',
    marginTop: 8,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
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
