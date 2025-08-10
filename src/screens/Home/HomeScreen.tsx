import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function HomeScreen(): React.JSX.Element {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Home</Text>
      <Text>Welcome to LanguageLearn</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default HomeScreen;


