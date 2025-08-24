import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import AnimatedToast from './AnimatedToast';

const ToastDemo: React.FC = () => {
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showFailToast, setShowFailToast] = useState(false);

  const handleSuccessPress = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleFailPress = () => {
    setShowFailToast(true);
    setTimeout(() => setShowFailToast(false), 3000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Animated Toast Demo</Text>
      
      <TouchableOpacity style={styles.successButton} onPress={handleSuccessPress}>
        <Text style={styles.buttonText}>Show Success Toast</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.failButton} onPress={handleFailPress}>
        <Text style={styles.buttonText}>Show Fail Toast</Text>
      </TouchableOpacity>

      <AnimatedToast
        visible={showSuccessToast}
        type="success"
        message="Great job! You got it right!"
      />
      
      <AnimatedToast
        visible={showFailToast}
        type="fail"
        message="Oops! Try again!"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  failButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ToastDemo;
