import React from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import { normalizeUrl, toLanguageSymbol } from '../../../common';

type AddBookModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (url: string, typeName: string, displayName: string) => Promise<void>;
  bookTitle: string;
  learningLanguage?: string | null;
  itemTypes: string[];
};

export default function AddBookModal({
  visible,
  onClose,
  onAdd,
  bookTitle,
  learningLanguage,
  itemTypes
}: AddBookModalProps): React.JSX.Element {
  const [newBookName, setNewBookName] = React.useState<string>('');
  const [newBookUrl, setNewBookUrl] = React.useState<string>('');
  const [selectedTypeName, setSelectedTypeName] = React.useState<string | null>(null);
  const [showTypeOptions, setShowTypeOptions] = React.useState<boolean>(false);
  const [typeError, setTypeError] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (visible) {
      setNewBookName(bookTitle || '');
      setNewBookUrl('');
      setSelectedTypeName(null);
      setShowTypeOptions(false);
      setTypeError(false);
    }
  }, [visible, bookTitle]);

  const handleAdd = async () => {
    const url = normalizeUrl(newBookUrl);
    if (!url) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Invalid URL', ToastAndroid.SHORT);
      } else {
        Alert.alert('Invalid URL');
      }
      return;
    }
    if (!selectedTypeName) {
      setTypeError(true);
      return;
    }
    const name = (newBookName || bookTitle || 'Book').trim();
    await onAdd(url, selectedTypeName, name);
    onClose();
  };

  if (!visible) return <></>;

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>Add book to library</Text>
        {learningLanguage && (
          <Text style={[styles.inputLabel, { marginTop: 0 }]}>
            Learning language: {toLanguageSymbol(learningLanguage)}
          </Text>
        )}
        
        <Text style={styles.inputLabel}>Book type</Text>
        <TouchableOpacity
          onPress={() => setShowTypeOptions((prev) => !prev)}
          style={[styles.modalInput, typeError && !selectedTypeName ? { borderColor: '#ef4444' } : null]}
          activeOpacity={0.7}
        >
          <Text style={{ color: selectedTypeName ? '#111827' : '#9ca3af' }}>
            {selectedTypeName || 'Select type'}
          </Text>
        </TouchableOpacity>
        
        {showTypeOptions && (
          <View style={[styles.modalInput, { paddingVertical: 0, marginTop: 8 }]}>
            {itemTypes.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => {
                  setSelectedTypeName(type);
                  setShowTypeOptions(false);
                  setTypeError(false);
                }}
                style={{ paddingVertical: 10 }}
              >
                <Text style={{ color: '#111827' }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {typeError && !selectedTypeName && (
          <Text style={styles.errorText}>Type is required</Text>
        )}
        
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.modalInput}
          value={newBookName}
          onChangeText={setNewBookName}
          placeholder="Enter a name"
        />
        
        <Text style={styles.inputLabel}>Download URL</Text>
        <TextInput
          style={styles.modalInput}
          value={newBookUrl}
          onChangeText={setNewBookUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://example.com/my-book.epub"
        />
        
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.modalCloseBtn, { backgroundColor: '#007AFF' }]}
          >
            <Text style={[styles.modalCloseText, { color: 'white' }]}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

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
});
