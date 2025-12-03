import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
  const translateYAnim = useRef(new Animated.Value(-20)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      translateYAnim.setValue(-20);
      iconScaleAnim.setValue(0);

      // Smooth entrance animation with spring effect
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Icon bounce animation after toast appears
        Animated.sequence([
          Animated.spring(iconScaleAnim, {
            toValue: 1.2,
            tension: 100,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(iconScaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 3,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Smooth exit animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -20,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide?.();
      });
    }
  }, [visible, scaleAnim, opacityAnim, translateYAnim, iconScaleAnim, onHide]);

  const getToastStyle = () => {
    if (type === 'success') {
      return {
        backgroundColor: '#10B981', // Modern emerald green
        borderColor: '#059669',
        shadowColor: '#10B981',
      };
    } else {
      return {
        backgroundColor: '#EF4444', // Modern red
        borderColor: '#DC2626',
        shadowColor: '#EF4444',
      };
    }
  };

  const getIconName = () => {
    return type === 'success' ? 'check-circle' : 'cancel';
  };

  const getIconColor = () => {
    return '#FFFFFF';
  };

  if (!visible) return null;

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.toast, { backgroundColor: toastStyle.backgroundColor, borderColor: toastStyle.borderColor }]}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: iconScaleAnim }],
            },
          ]}
        >
          <Icon
            name={getIconName()}
            size={32}
            color={getIconColor()}
          />
        </Animated.View>
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: screenHeight * 0.15, // Position near top for better visibility
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderRadius: 18,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
    minWidth: screenWidth * 0.85,
    maxWidth: screenWidth * 0.95,
  },
  iconContainer: {
    marginRight: 14,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default AnimatedToast;
