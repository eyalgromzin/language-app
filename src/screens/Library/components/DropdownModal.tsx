import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

interface DropdownModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selectedOption: string;
  onOptionSelect: (option: string) => void;
  onClose: () => void;
  translateOption: (option: string, type: 'type' | 'level') => string;
  type: 'type' | 'level';
}

const DropdownModal: React.FC<DropdownModalProps> = ({
  visible,
  title,
  options,
  selectedOption,
  onOptionSelect,
  onClose,
  translateOption,
  type,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.modalCard}>
        <Text style={styles.modalTitle}>{title}</Text>
        <ScrollView>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.dropdownOption, selectedOption === opt && styles.dropdownOptionSelected]}
              onPress={() => {
                onOptionSelect(opt);
                onClose();
              }}
            >
              <Text style={styles.dropdownOptionText}>{translateOption(opt, type)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 120,
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    color: '#1E293B',
  },
  dropdownOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F1F5F9',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#374151',
  },
});

export default DropdownModal;
