import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface NotEnoughWordsMessageProps {
  message?: string;
}

const NotEnoughWordsMessage: React.FC<NotEnoughWordsMessageProps> = ({ 
  message = "Not enough words to practice yet. Add more words in one of the learning options" 
}) => {
  const navigation = useNavigation<any>();

  const navigateToScreen = (screenName: string) => {
    navigation.navigate(screenName as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigateToScreen('Surf')}
          accessibilityRole="button"
          accessibilityLabel="Go to Surf"
        >
          <Text style={styles.buttonText}>Surf</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigateToScreen('Video')}
          accessibilityRole="button"
          accessibilityLabel="Go to Video"
        >
          <Text style={styles.buttonText}>Video</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigateToScreen('Books')}
          accessibilityRole="button"
          accessibilityLabel="Go to Books"
        >
          <Text style={styles.buttonText}>Books</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigateToScreen('Categories')}
          accessibilityRole="button"
          accessibilityLabel="Go to Categories"
        >
          <Text style={styles.buttonText}>Categories</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotEnoughWordsMessage;
