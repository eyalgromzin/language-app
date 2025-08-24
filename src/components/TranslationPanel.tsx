import React from 'react';
import { ActivityIndicator, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Tts from 'react-native-tts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLangCode } from '../utils/translation';

export type TranslationPanelState = {
  word: string;
  translation: string;
  sentence?: string;
  images: string[];
  imagesLoading: boolean;
  translationLoading: boolean;
};

type Props = {
  panel: TranslationPanelState | null;
  onSave: () => void;
  onClose: () => void;
};

function TranslationPanel(props: Props): React.JSX.Element | null {
  const { panel, onSave, onClose } = props;
  if (!panel) return null;

  // Animation value for plus button rotation
  const spinValue = React.useRef(new Animated.Value(0)).current;

  const spinPlus = React.useCallback((onComplete?: () => void) => {
    // Reset to 0 and animate to 360 degrees
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(onComplete);
  }, [spinValue]);

  const handlePlusPress = React.useCallback(() => {
    spinPlus(() => {
      onSave();
      onClose();
    });
  }, [spinPlus, onSave, onClose]);

  // Create rotation interpolate
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const speakWord = React.useCallback(async () => {
    if (!panel?.word) return;
    try {
      Tts.stop();
      
      // Get the learning language and set TTS language for proper accent
      const learningLanguage = await AsyncStorage.getItem('language.learning');
      if (learningLanguage) {
        const langCode = getLangCode(learningLanguage);
        if (langCode) {
          await Tts.setDefaultLanguage(langCode);
        }
      }
      
      Tts.speak(panel.word);
    } catch (err) {
      // no-op
    }
  }, [panel?.word]);

  React.useEffect(() => {
    speakWord();
    return () => {
      try {
        Tts.stop();
      } catch {
        // no-op
      }
    };
  }, [speakWord]);

  return (
    <View style={styles.bottomPanel}>
      <View style={styles.bottomHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <Text style={styles.bottomWord} numberOfLines={1}>
            {panel.word}
          </Text>
          <TouchableOpacity
            onPress={speakWord}
            style={styles.speakerBtnWrap}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Speak word"
          >
            <Text style={styles.speakerIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handlePlusPress}
            style={styles.addBtnWrap}
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
            accessibilityRole="button"
            accessibilityLabel="Add word"
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Text style={styles.addBtnText}>+</Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      {panel.translationLoading ? (
        <View style={styles.translationLoadingRow}>
          <ActivityIndicator size="small" color="#555" />
        </View>
      ) : (
        <Text style={styles.translationText} numberOfLines={3}>
          {panel.translation}
        </Text>
      )}
      {!!panel.sentence && (
        <Text style={styles.sentenceText} numberOfLines={3}>
          {panel.sentence}
        </Text>
      )}
      {panel.imagesLoading ? (
        <View style={[styles.imageRow, styles.imageRowLoader]}>
          <ActivityIndicator size="small" color="#555" />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
          {(panel.images || []).map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.imageItem} resizeMode="cover" />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 12,
    zIndex: 999,
  },
  bottomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bottomWord: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: 12,
  },
  speakerBtnWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#efefef',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  speakerIcon: {
    fontSize: 16,
    color: '#000',
    opacity: 0.9,
    includeFontPadding: false,
  },
  addBtnWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  addBtnText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
    includeFontPadding: false,
  },
  closeBtn: {
    fontSize: 20,
    color: '#000',
    opacity: 0.9,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  translationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  sentenceText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  imageRow: {
    flexGrow: 0,
  },
  imageRowLoader: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translationLoadingRow: {
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginBottom: 8,
  },
  imageItem: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#eee',
  },
});

export default TranslationPanel;


