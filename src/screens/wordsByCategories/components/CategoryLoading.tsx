import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

type Styles = {
  headerRow: StyleProp<ViewStyle>;
  backText: StyleProp<TextStyle>;
  headerTitle: StyleProp<TextStyle>;
  wordCategoryLoadingContainer: StyleProp<ViewStyle>;
  loadingText: StyleProp<TextStyle>;
};

type Props = {
  styles: Styles;
  onBackToCategories: () => void;
};

export default function CategoryLoading(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const { styles, onBackToCategories } = props;

  return (
    <View style={styles.wordCategoryLoadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>
        {t('screens.categories.wordCategories.loadingCategoryData')}
      </Text>
    </View>
  );
}
