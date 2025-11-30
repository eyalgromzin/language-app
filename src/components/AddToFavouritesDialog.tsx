import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, Alert, ToastAndroid } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../hooks/useTranslation';
import { FAVOURITE_TYPES } from '../common';
import harmfulWordsService from '../services/harmfulWordsService';
import { addUrlToLibrary } from '../config/api';

export interface FavouriteItem {
  url: string;
  name: string;
  typeId?: number;
  typeName?: string;
  levelName?: string;
}


interface AddToFavouritesDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (url: string, typeName: string, name: string, levelName?: string) => void;
  defaultUrl?: string;
  defaultName?: string;
  defaultType?: string;
  defaultLevel?: string;
  learningLanguage?: string | null;
  storageKey?: string; // Storage key for favourites (e.g., 'surf.favourites', 'video.favourites')
}

const AddToFavouritesDialog: React.FC<AddToFavouritesDialogProps> = ({
  visible,
  onClose,
  onSuccess,
  defaultUrl = '',
  defaultName = '',
  defaultType = '',
  defaultLevel = '',
  learningLanguage,
  storageKey = 'surf.favourites',
}) => {
  const { t } = useTranslation();
  
  const [newFavName, setNewFavName] = React.useState<string>(defaultName);
  const [newFavUrl, setNewFavUrl] = React.useState<string>(defaultUrl);
  const [newFavTypeId, setNewFavTypeId] = React.useState<number | null>(null);
  const [newFavLevelName, setNewFavLevelName] = React.useState<string | null>(defaultLevel || null);
  const [showTypeOptions, setShowTypeOptions] = React.useState<boolean>(false);
  const [showLevelOptions, setShowLevelOptions] = React.useState<boolean>(false);
  const [favTypeError, setFavTypeError] = React.useState<boolean>(false);
  const [favLevelError, setFavLevelError] = React.useState<boolean>(false);
  const [isAdding, setIsAdding] = React.useState<boolean>(false);

  // Initialize default values when dialog opens
  React.useEffect(() => {
    if (visible) {
      setNewFavName(defaultName);
      setNewFavUrl(defaultUrl);
      setNewFavLevelName(defaultLevel || null);
      
      // Set default type if provided
      if (defaultType) {
        const type = FAVOURITE_TYPES.find(t => t.name === defaultType);
        if (type) {
          setNewFavTypeId(type.id);
        }
      } else {
        setNewFavTypeId(null);
      }
      
      setFavTypeError(false);
      setFavLevelError(false);
    }
  }, [visible, defaultName, defaultUrl, defaultType, defaultLevel]);

  const toLanguageSymbol = (input: string | null): 'en' | 'es' => {
    const v = (input || '').toLowerCase().trim();
    if (v === 'es' || v === 'spanish') return 'es';
    if (v === 'en' || v === 'english') return 'en';
    if (v === 'español') return 'es';
    return 'en';
  };

  const normalizeFavouritesUrl = (input: string): string => {
    if (!input) return 'about:blank';
    const trimmed = input.trim();
    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
    const hasSpaces = /\s/.test(trimmed);
    const startsWithWww = /^www\./i.test(trimmed);
    const looksLikeDomain = /^[^\s]+\.[^\s]{2,}$/.test(trimmed);
    const looksLikeIp = /^\d{1,3}(\.\d{1,3}){3}(?::\d+)?(\/|$)/.test(trimmed);

    if (hasSpaces || (!hasScheme && !startsWithWww && !looksLikeDomain && !looksLikeIp)) {
      return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    }

    if (!hasScheme && (startsWithWww || looksLikeDomain || looksLikeIp)) {
      return `https://${trimmed}`;
    }

    return hasScheme ? trimmed : 'about:blank';
  };

  const getDomainFromUrlString = (input: string): string | null => {
    try {
      const str = (input || '').trim();
      if (!str) return null;
      const m = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/([^/]+)/.exec(str);
      const host = m ? m[1] : (/^www\./i.test(str) || /[^\s]+\.[^\s]{2,}/.test(str) ? str.split('/')[0] : null);
      if (!host) return null;
      const lower = host.toLowerCase();
      const noWww = lower.startsWith('www.') ? lower.slice(4) : lower;
      return noWww;
    } catch { return null; }
  };

  const validateLevel = (level: string): string => {
    const validLevels = ['easy', 'easy-medium', 'medium', 'medium-hard', 'hard'];
    return validLevels.includes(level) ? level : 'easy';
  };

  const addToFavourites = async (url: string, name: string, typeId: number, typeName: string, levelName?: string) => {
    if (!url) return;
    
    try {
      const checkResult = await harmfulWordsService.checkUrl(url);
      if (checkResult.isHarmful) {
        const message = `This URL contains inappropriate content and cannot be added to favorites. Matched words: ${checkResult.matchedWords.join(', ')}`;
        if (Platform.OS === 'android') {
          ToastAndroid.show(message, ToastAndroid.LONG);
        } else {
          Alert.alert('Content Blocked', message);
        }
        return;
      }
    } catch (error) {
      console.error('Failed to check URL for harmful content:', error);
    }
    
    const normalized = normalizeFavouritesUrl(url);
    const safeName = (name || '').trim() || (getDomainFromUrlString(normalized) || normalized);
    
    try {
      // Load existing favourites
      const raw = await AsyncStorage.getItem(storageKey);
      const existing: FavouriteItem[] = raw ? JSON.parse(raw) : [];
      
      // Create new favourite item
      const newFavourite: FavouriteItem = {
        url: normalized,
        name: safeName,
        typeId,
        typeName,
        levelName: levelName ? validateLevel(levelName) : undefined
      };
      
      // Add to beginning and remove duplicates, limit to 200 items
      const next: FavouriteItem[] = [
        newFavourite,
        ...existing.filter((f) => f.url !== normalized),
      ].slice(0, 200);
      
      // Save back to storage
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      
      // Also add to library if learning language is available
      if (learningLanguage) {
        try {
          const lang = toLanguageSymbol(learningLanguage);
          const safeLevel = levelName ? validateLevel(levelName) : 'easy';
          const media = storageKey === 'video.favourites' ? 'youtube' : 'web';
          
          await addUrlToLibrary(normalized, typeName, safeLevel, safeName, lang, media);
        } catch (libraryError) {
          console.error('Failed to add URL to library:', libraryError);
          // Don't fail the entire operation if library addition fails
        }
      }
    } catch (error) {
      console.error('Failed to save favourites:', error);
    }
  };

  const handleAdd = async () => {
    if (!newFavUrl.trim()) {
      return;
    }
    
    const selected = FAVOURITE_TYPES.find(t => t.id === newFavTypeId);
    if (!selected) { 
      setFavTypeError(true); 
      return; 
    }
    
    if (!newFavLevelName) { 
      setFavLevelError(true); 
      return; 
    }

    // URL validation logic moved from SurfScreen
    const u = normalizeFavouritesUrl(newFavUrl.trim());
    const nm = (newFavName.trim() || '').trim();
    if (!u || u === 'about:blank') {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('screens.surf.invalidUrl'), ToastAndroid.SHORT);
      } else {
        Alert.alert(t('screens.surf.invalidUrl'));
      }
      return;
    }

    setIsAdding(true);
    try {
      await addToFavourites(u, nm || u, selected.id, selected.name, newFavLevelName);
      onClose();
      onSuccess?.(u, selected.name, nm || u, newFavLevelName);
    } catch (error) {
      console.error('Error adding to favourites:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('addFavouriteModal.title')}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isAdding}>
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
                disabled={isAdding}
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
                style={[styles.selectInput, favLevelError && !newFavLevelName ? styles.selectInputError : null]}
                activeOpacity={0.7}
                disabled={isAdding}
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
                      onPress={() => { setNewFavLevelName(lv); setShowLevelOptions(false); setFavLevelError(false); }}
                      style={styles.optionItem}
                    >
                      <Text style={styles.optionText}>{t(`addFavouriteModal.difficultyLevels.${lv}`)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {favLevelError && !newFavLevelName && (
                <Text style={styles.errorText}>{t('addFavouriteModal.pleaseSelectDifficultyLevel')}</Text>
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
                editable={!isAdding}
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
                editable={!isAdding}
              />
            </View>
          </View>
         
          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelButton} disabled={isAdding}>
              <Text style={styles.cancelButtonText}>{t('addFavouriteModal.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.addButton, isAdding && styles.addButtonDisabled]}
              disabled={isAdding}
            >
              <Ionicons name="star" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.addButtonText}>
                {isAdding ? t('common.adding') : t('addFavouriteModal.addToFavourites')}
              </Text>
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
  addButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default AddToFavouritesDialog;
