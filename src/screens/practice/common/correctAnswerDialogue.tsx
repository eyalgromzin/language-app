import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../../hooks/useTranslation';
import { WordEntry } from '../../../types/words';

type CorrectAnswerDialogueProps = {
  visible: boolean;
  onClose: () => void;
  embedded?: boolean;
  correctWord?: string;
  translation?: string;
  current?: WordEntry;
  isChooseTranslationMode?: boolean;
  onFinished?: (isCorrect: boolean) => void;
  onMoveToNext?: () => void;
  onHideFinishedAnimation?: () => void;
};

export default function CorrectAnswerDialogue({
  visible,
  onClose,
  embedded = false,
  correctWord,
  translation,
  current,
  isChooseTranslationMode = false,
  onFinished,
  onMoveToNext,
  onHideFinishedAnimation,
}: CorrectAnswerDialogueProps): React.JSX.Element {
  const { t } = useTranslation();

  const handleOk = () => {
    onClose();
    onHideFinishedAnimation?.();
    if (embedded) {
      onFinished?.(false);
    } else {
      onMoveToNext?.();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.popupOverlay}>
        <View style={styles.popupContainer}>
          <Text style={styles.popupTitle}>{t('common.wrongAnswer')}</Text>
          <Text style={styles.popupMessage}>{t('common.correctAnswerIs')}</Text>
          <View style={styles.correctAnswerContainer}>
            {embedded ? (
              <View style={styles.embeddedAnswerContainer}>
                <Text style={styles.correctAnswerText}>{correctWord}</Text>
                {translation && (
                  <Text style={styles.correctAnswerTranslation}>{translation}</Text>
                )}
              </View>
            ) : (
              <View style={styles.embeddedAnswerContainer}>
                <Text style={styles.correctAnswerText}>
                  {current && (isChooseTranslationMode ? current.translation : current.word)}
                </Text>
                <Text style={styles.correctAnswerTranslation}>
                  {current && (isChooseTranslationMode ? current.word : current.translation)}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.popupOkButton}
            onPress={handleOk}
          >
            <Text style={styles.popupOkButtonText}>{t('common.ok')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: 340,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  popupTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  popupMessage: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  correctAnswerContainer: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
    minWidth: 220,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  embeddedAnswerContainer: {
    alignItems: 'center',
    gap: 8,
  },
  correctAnswerText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16a34a',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  correctAnswerTranslation: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  popupOkButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    minWidth: 120,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  popupOkButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

