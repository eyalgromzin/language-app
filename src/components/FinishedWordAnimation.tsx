import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

interface FinishedWordAnimationProps {
  visible: boolean;
  onHide?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FinishedWordAnimation: React.FC<FinishedWordAnimationProps> = ({ 
  visible, 
  onHide 
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      bounceAnim.setValue(0);
      rotateAnim.setValue(0);

      // Grow from center animation with rotation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Bounce effect
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
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

        // Auto hide after 4 seconds
        setTimeout(() => {
          if (onHide) onHide();
        }, 4000);
      });
    } else {
      // Shrink to center animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim, bounceAnim, rotateAnim, onHide]);

  const bounceScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: Animated.multiply(scaleAnim, bounceScale) },
            { rotate: rotation },
          ],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.animationContainer}>
        <Text style={styles.emoji}>💪</Text>
        <Text style={styles.text}>finished word</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: screenHeight * 0.4, // Position in the middle of the screen
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 25,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    minWidth: screenWidth * 0.7,
    maxWidth: screenWidth * 0.8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'lowercase',
  },
});

export default FinishedWordAnimation;
