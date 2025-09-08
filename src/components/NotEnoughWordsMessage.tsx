import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface NotEnoughWordsMessageProps {
  message?: string;
}

const { width } = Dimensions.get('window');

const NotEnoughWordsMessage: React.FC<NotEnoughWordsMessageProps> = ({ 
  message = "Not enough words to practice yet. Add more words in one of the learning options" 
}) => {
  const navigation = useNavigation<any>();

  const navigateToScreen = (screenName: string) => {
    navigation.navigate(screenName as never);
  };

  const learningOptions = [
    { name: 'Surf', icon: 'globe-outline', description: 'Browse content' },
    { name: 'Video', icon: 'play-circle-outline', description: 'Watch videos' },
    { name: 'Books', icon: 'book-outline', description: 'Read books' },
    { name: 'Categories', icon: 'grid-outline', description: 'Word categories' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="school-outline" size={48} color="#6366F1" />
        </View>
        
        <Text style={styles.title}>Ready to Learn?</Text>
        <Text style={styles.message}>{message}</Text>
        
        <View style={styles.buttonContainer}>
          {learningOptions.map((option, index) => (
            <TouchableOpacity 
              key={option.name}
              style={styles.button} 
              onPress={() => navigateToScreen(option.name)}
              accessibilityRole="button"
              accessibilityLabel={`Go to ${option.name}`}
              activeOpacity={0.7}
            >
              <Ionicons name={option.icon} size={20} color="#6366F1" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>{option.name}</Text>
              <Text style={styles.buttonDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: width * 0.9,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: (width * 0.8 - 32) / 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonIcon: {
    marginBottom: 8,
  },
  buttonText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  buttonDescription: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default NotEnoughWordsMessage;
