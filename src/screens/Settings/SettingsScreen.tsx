import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function SettingsScreen(): React.JSX.Element {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.screenTitle}>Settings</Text>
      <Text>Adjust your preferences here</Text>
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

export default SettingsScreen;


