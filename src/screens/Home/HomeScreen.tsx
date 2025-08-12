import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

function HomeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.screenContainer}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.bigButton, styles.surfButton]}
          onPress={() => navigation.navigate('Main', { screen: 'Surf' })}
          accessibilityRole="button"
          accessibilityLabel="Go to Surf"
        >
          <Ionicons name="globe-outline" size={26} color="#FFFFFF" style={styles.bigButtonIcon} />
          <Text style={[styles.bigButtonText, styles.bigButtonLabel]}>Surf</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bigButton, styles.practiceButton]}
          onPress={() => navigation.navigate('Main', { screen: 'Practice' })}
          accessibilityRole="button"
          accessibilityLabel="Go to Practice"
        >
          <Ionicons name="trophy-outline" size={26} color="#FFFFFF" style={styles.bigButtonIcon} />
          <Text style={[styles.bigButtonText, styles.bigButtonLabel]}>Practice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bigButton, styles.libraryButton]}
          onPress={() => navigation.navigate('Main', { screen: 'MyWords' })}
          accessibilityRole="button"
          accessibilityLabel="Go to Library"
        >
          <Ionicons name="book-outline" size={26} color="#FFFFFF" style={styles.bigButtonIcon} />
          <Text style={[styles.bigButtonText, styles.bigButtonLabel]}>Library</Text>
        </TouchableOpacity>
      </View>
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
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  bigButton: {
    width: '100%',
    paddingVertical: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  bigButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  bigButtonIcon: {
    fontSize: 24,
    marginRight: 10,
    color: 'white',
  },
  bigButtonLabel: {
    textAlignVertical: 'center',
  },
  surfButton: { backgroundColor: '#007AFF' },
  practiceButton: { backgroundColor: '#34C759' },
  libraryButton: { backgroundColor: '#AF52DE' },
});

export default HomeScreen;


