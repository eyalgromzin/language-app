import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type HelperMessageProps = {
  t: (key: string) => string;
};

const HelperMessage: React.FC<HelperMessageProps> = ({ t }) => {
  return (
    <View style={styles.helperContainer}>
      <Text style={styles.helper}>{t('screens.video.enterYouTubeUrlOrSearch')}</Text>
      <Text style={styles.helperSubtext}>{t('screens.video.pasteYouTubeLink')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  helperContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  helper: {
    color: '#475569',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 8,
  },
  helperSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    maxWidth: 280,
  },
});

export default HelperMessage;

