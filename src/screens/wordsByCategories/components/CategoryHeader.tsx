import * as React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import type { WordCategoryType, LocalizedText } from '../../../types/words';
import { getCategoryIcon, getTextInLanguage } from '../../../utils/categoryUtils';

type Styles = {
  headerRow: StyleProp<ViewStyle>;
  backButton: StyleProp<ViewStyle>;
  backText: StyleProp<TextStyle>;
  headerTitleContainer: StyleProp<ViewStyle>;
  categoryIconContainer: StyleProp<ViewStyle>;
  headerTitle: StyleProp<TextStyle>;
};

type Props = {
  category: WordCategoryType;
  styles: Styles;
  SOURCE_LANGUAGE: string;
  TARGET_LANGUAGE: string;
  onBackToCategories: () => void;
};

export default function CategoryHeader(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const {
    category,
    styles,
    SOURCE_LANGUAGE,
    TARGET_LANGUAGE,
    onBackToCategories,
  } = props;

  // Check if learning language is Hebrew (RTL)
  const isRTL = SOURCE_LANGUAGE === 'he' || SOURCE_LANGUAGE === 'iw';
  const chevronIcon = isRTL ? 'chevron-forward' : 'chevron-back';

  return (
    <View style={styles.headerRow}>
      <TouchableOpacity 
        onPress={onBackToCategories} 
        accessibilityRole="button" 
        accessibilityLabel={t('screens.categories.wordCategories.back')} 
        activeOpacity={0.7}
      >
        <View style={styles.backButton}>
          <Ionicons name={chevronIcon} size={20} color="#3B82F6" />
          <Text style={styles.backText}>{t('screens.categories.wordCategories.back')}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <View style={styles.categoryIconContainer}>
          <Ionicons 
            name={getCategoryIcon(category.emoji, category.id)} 
            size={24} 
            color="#3B82F6" 
          />
        </View>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {getTextInLanguage(category.name, SOURCE_LANGUAGE) || getTextInLanguage(category.name, TARGET_LANGUAGE) || category.id}
        </Text>
      </View>
      <View style={{ width: 80 }} />
    </View>
  );
}
