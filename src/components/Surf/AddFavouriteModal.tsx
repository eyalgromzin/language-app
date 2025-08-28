import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

interface AddFavouriteModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: () => void;
  newFavName: string;
  setNewFavName: (name: string) => void;
  newFavUrl: string;
  setNewFavUrl: (url: string) => void;
  newFavTypeId: number | null;
  setNewFavTypeId: (id: number | null) => void;
  newFavLevelName: string | null;
  setNewFavLevelName: (level: string | null) => void;
  showTypeOptions: boolean;
  setShowTypeOptions: (show: boolean) => void;
  showLevelOptions: boolean;
  setShowLevelOptions: (show: boolean) => void;
  favTypeError: boolean;
  setFavTypeError: (error: boolean) => void;
  learningLanguage: string | null;
  FAVOURITE_TYPES: ReadonlyArray<{ id: number; name: string }>;
}

const AddFavouriteModal: React.FC<AddFavouriteModalProps> = ({
  visible,
  onClose,
  onAdd,
  newFavName,
  setNewFavName,
  newFavUrl,
  setNewFavUrl,
  newFavTypeId,
  setNewFavTypeId,
  newFavLevelName,
  setNewFavLevelName,
  showTypeOptions,
  setShowTypeOptions,
  showLevelOptions,
  setShowLevelOptions,
  favTypeError,
  setFavTypeError,
  learningLanguage,
  FAVOURITE_TYPES,
}) => {
  const toLanguageSymbol = (input: string | null): 'en' | 'es' => {
    const v = (input || '').toLowerCase().trim();
    if (v === 'es' || v === 'spanish') return 'es';
    if (v === 'en' || v === 'english') return 'en';
    if (v === 'español') return 'es';
    return 'en';
  };

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
          {learningLanguage && (
            <Text style={[styles.inputLabel, { marginTop: 0 }]}>
              Learning language: {toLanguageSymbol(learningLanguage)}
            </Text>
          )}
          <Text style={styles.inputLabel}>Type</Text>
          <TouchableOpacity
            onPress={() => setShowTypeOptions(!showTypeOptions)}
            style={[styles.modalInput, favTypeError && !newFavTypeId ? { borderColor: '#ef4444' } : null]}
            activeOpacity={0.7}
          >
            <Text style={{ color: newFavTypeId ? '#111827' : '#9ca3af' }}>
              {newFavTypeId ? (FAVOURITE_TYPES.find(t => t.id === newFavTypeId)?.name || '') : 'Select type'}
            </Text>
          </TouchableOpacity>
          {showTypeOptions && (
            <View style={[styles.modalInput, { paddingVertical: 0, marginTop: 8 }]}> 
              {FAVOURITE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => { setNewFavTypeId(t.id); setShowTypeOptions(false); setFavTypeError(false); }}
                  style={{ paddingVertical: 10 }}
                >
                  <Text style={{ color: '#111827' }}>{t.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {favTypeError && !newFavTypeId && (
            <Text style={styles.errorText}>Type is required</Text>
          )}
          <Text style={styles.inputLabel}>Level</Text>
          <TouchableOpacity
            onPress={() => setShowLevelOptions(!showLevelOptions)}
            style={styles.modalInput}
            activeOpacity={0.7}
          >
            <Text style={{ color: newFavLevelName ? '#111827' : '#9ca3af' }}>
              {newFavLevelName || 'Select level'}
            </Text>
          </TouchableOpacity>
          {showLevelOptions && (
            <View style={[styles.modalInput, { paddingVertical: 0, marginTop: 8 }]}> 
              {['easy','easy-medium','medium','medium-hard','hard'].map((lv) => (
                <TouchableOpacity
                  key={lv}
                  onPress={() => { setNewFavLevelName(lv); setShowLevelOptions(false); }}
                  style={{ paddingVertical: 10 }}
                >
                  <Text style={{ color: '#111827' }}>{lv}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.modalInput}
            value={newFavName}
            onChangeText={setNewFavName}
            placeholder="Enter a name"
          />
          <Text style={styles.inputLabel}>URL</Text>
          <TextInput
            style={styles.modalInput}
            value={newFavUrl}
            onChangeText={setNewFavUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
         
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onAdd}
              style={[styles.modalCloseBtn, { backgroundColor: '#007AFF' }]}
            >
              <Text style={[styles.modalCloseText, { color: 'white' }]}>Add</Text>
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
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
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

export default AddFavouriteModal;
