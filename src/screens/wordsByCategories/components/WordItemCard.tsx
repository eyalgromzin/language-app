import * as React from 'react';
import { View, Text, TouchableOpacity, Animated, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import type { WordItem, LocalizedText } from '../../../types/words';
import { getTextInLanguage } from '../../../utils/categoryUtils';

type Styles = {
  itemCard: StyleProp<ViewStyle>;
  itemHeaderRow: StyleProp<ViewStyle>;
  itemText: StyleProp<TextStyle>;
  itemTextFlex: StyleProp<ViewStyle>;
  addBtnWrap: StyleProp<ViewStyle>;
  addBtnText: StyleProp<TextStyle>;
  itemSeparator: StyleProp<TextStyle>;
  itemTarget: StyleProp<TextStyle>;
  itemTranslationLine: StyleProp<TextStyle>;
  itemExample: StyleProp<TextStyle>;
  itemExampleRow: StyleProp<ViewStyle>;
  speakerBtnWrap: StyleProp<ViewStyle>;
};

type Props = {
  item: WordItem;
  styles: Styles;
  SOURCE_LANGUAGE: string;
  TARGET_LANGUAGE: string;
  onSpeakText: (text: string, language: string) => void;
  onAddToMyWords: (item: WordItem) => void;
  rotationInterpolate: Animated.AnimatedInterpolation<string>;
};

export default function WordItemCard(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const {
    item,
    styles,
    SOURCE_LANGUAGE,
    TARGET_LANGUAGE,
    onSpeakText,
    onAddToMyWords,
    rotationInterpolate,
  } = props;

  const source = getTextInLanguage(item.text, SOURCE_LANGUAGE);
  const target = getTextInLanguage(item.text, TARGET_LANGUAGE);
  const exampleSource = item.example ? getTextInLanguage(item.example, SOURCE_LANGUAGE) : '';
  const exampleTarget = item.example ? getTextInLanguage(item.example, TARGET_LANGUAGE) : '';

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeaderRow}>
        {item.type === 'sentence' ? (
          <View style={styles.itemTextFlex}>
            <TouchableOpacity
              onPress={() => onSpeakText(source, SOURCE_LANGUAGE)}
              style={[styles.speakerBtnWrap, { marginRight: 12 }]}
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
              accessibilityRole="button"
              accessibilityLabel={t('screens.categories.wordCategories.speakSourceText')}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-medium" size={16} color="#64748B" />
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.itemText}>
              {source} -
            </Text>
          </View>
        ) : (
          <View style={styles.itemTextFlex}>
            <TouchableOpacity
              onPress={() => onSpeakText(source, SOURCE_LANGUAGE)}
              style={[styles.speakerBtnWrap, { marginRight: 8 }]}
              hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
              accessibilityRole="button"
              accessibilityLabel={t('screens.categories.wordCategories.speakSourceText')}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-medium" size={16} color="#64748B" />
            </TouchableOpacity>
            <Text numberOfLines={1} style={styles.itemText}>
              {source}
              <Text style={styles.itemSeparator}> — </Text>
              <Text style={styles.itemTarget}>{target}</Text>
            </Text>
          </View>
        )}
        <TouchableOpacity
          onPress={() => onAddToMyWords(item)}
          style={styles.addBtnWrap}
          accessibilityRole="button"
          accessibilityLabel={t('screens.categories.wordCategories.addToMyWords')}
          hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          activeOpacity={0.85}
        >
          <Animated.View style={{ transform: [{ rotate: rotationInterpolate }] }}>
            <Text style={styles.addBtnText}>+</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
      {item.type === 'sentence' ? (
        <Text style={styles.itemTranslationLine}>{target}</Text>
      ) : null}
      {(exampleSource || exampleTarget) ? (
        <View style={styles.itemExampleRow}>
          {exampleSource && (
            <Text style={styles.itemExample}>{exampleSource}</Text>
          )}
          {exampleTarget && (
            <Text style={styles.itemExample}>
              {exampleTarget}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
