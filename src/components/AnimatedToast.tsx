import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

interface AnimatedToastProps {
  visible: boolean;
  type: 'success' | 'fail';
  message: string;
  onHide?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AnimatedToast: React.FC<AnimatedToastProps> = ({ 
  visible, 
  type, 
  message, 
  onHide 
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      bounceAnim.setValue(0);

      // Grow from center animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Bounce effect
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Shrink to center animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim, bounceAnim]);

  const bounceScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const getToastStyle = () => {
    const baseStyle = {
      backgroundColor: type === 'success' ? '#4CAF50' : '#F44336',
      borderColor: type === 'success' ? '#2E7D32' : '#D32F2F',
    };
    return baseStyle;
  };

  const getIcon = () => {
    return type === 'success' ? '🎉' : '💔';
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, bounceScale) },
          ],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.toast, getToastStyle()]}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: screenHeight * 0.3, // Position lower on the screen
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: screenWidth * 0.8,
    maxWidth: screenWidth * 0.9,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },

});

export default AnimatedToast;
