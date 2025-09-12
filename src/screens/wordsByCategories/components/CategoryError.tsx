import * as React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

type Styles = {
  wordCategoryErrorContainer: StyleProp<ViewStyle>;
  wordCategoryErrorText: StyleProp<TextStyle>;
  wordCategoryRetryButton: StyleProp<ViewStyle>;
  wordCategoryRetryButtonText: StyleProp<TextStyle>;
};

type Props = {
  error: string;
  styles: Styles;
  onRetry: () => void;
};

export default function CategoryError(props: Props): React.JSX.Element {
  const { t } = useTranslation();
  const { error, styles, onRetry } = props;

  return (
    <View style={styles.wordCategoryErrorContainer}>
      <Text style={styles.wordCategoryErrorText}>
        {error}
      </Text>
      <TouchableOpacity style={styles.wordCategoryRetryButton} onPress={onRetry}>
        <Text style={styles.wordCategoryRetryButtonText}>
          {t('screens.categories.wordCategories.retry')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
