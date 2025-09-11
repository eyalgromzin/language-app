import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../../hooks/useTranslation';

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
  const { t } = useTranslation();
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('addFavouriteModal.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {learningLanguage && (
              <View style={styles.languageInfo}>
                <Ionicons name="language-outline" size={16} color="#3b82f6" />
                <Text style={styles.languageText}>
                  {t('addFavouriteModal.learning')} {toLanguageSymbol(learningLanguage)}
                </Text>
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('addFavouriteModal.contentType')}</Text>
              <TouchableOpacity
                onPress={() => setShowTypeOptions(!showTypeOptions)}
                style={[styles.selectInput, favTypeError && !newFavTypeId ? styles.selectInputError : null]}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectInputText, { color: newFavTypeId ? '#1e293b' : '#94a3b8' }]}>
                  {newFavTypeId ? t(`addFavouriteModal.favouriteTypes.${FAVOURITE_TYPES.find(type => type.id === newFavTypeId)?.name}`) : t('addFavouriteModal.selectContentType')}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </TouchableOpacity>
              {showTypeOptions && (
                <View style={styles.optionsContainer}> 
                  {FAVOURITE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => { setNewFavTypeId(type.id); setShowTypeOptions(false); setFavTypeError(false); }}
                      style={styles.optionItem}
                    >
                      <Text style={styles.optionText}>{t(`addFavouriteModal.favouriteTypes.${type.name}`)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {favTypeError && !newFavTypeId && (
                <Text style={styles.errorText}>{t('addFavouriteModal.pleaseSelectContentType')}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('addFavouriteModal.difficultyLevel')}</Text>
              <TouchableOpacity
                onPress={() => setShowLevelOptions(!showLevelOptions)}
                style={styles.selectInput}
                activeOpacity={0.7}
              >
                <Text style={[styles.selectInputText, { color: newFavLevelName ? '#1e293b' : '#94a3b8' }]}>
                  {newFavLevelName ? t(`addFavouriteModal.difficultyLevels.${newFavLevelName}`) : t('addFavouriteModal.selectDifficultyLevel')}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#94a3b8" />
              </TouchableOpacity>
              {showLevelOptions && (
                <View style={styles.optionsContainer}> 
                  {['easy','easy-medium','medium','medium-hard','hard'].map((lv) => (
                    <TouchableOpacity
                      key={lv}
                      onPress={() => { setNewFavLevelName(lv); setShowLevelOptions(false); }}
                      style={styles.optionItem}
                    >
                      <Text style={styles.optionText}>{t(`addFavouriteModal.difficultyLevels.${lv}`)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('addFavouriteModal.name')}</Text>
              <TextInput
                style={styles.textInput}
                value={newFavName}
                onChangeText={setNewFavName}
                placeholder={t('addFavouriteModal.enterDescriptiveName')}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('addFavouriteModal.url')}</Text>
              <TextInput
                style={styles.textInput}
                value={newFavUrl}
                onChangeText={setNewFavUrl}
                placeholder={t('addFavouriteModal.urlPlaceholder')}
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          </View>
         
          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>{t('addFavouriteModal.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onAdd}
              style={styles.addButton}
            >
              <Ionicons name="star" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.addButtonText}>{t('addFavouriteModal.addToFavourites')}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '90%',
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
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  languageText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
    marginLeft: 6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  selectInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  selectInputText: {
    fontSize: 16,
    flex: 1,
  },
  optionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  optionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  addButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default AddFavouriteModal;
