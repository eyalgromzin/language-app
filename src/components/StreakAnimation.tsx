import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

interface StreakAnimationProps {
  streak: number;
  visible: boolean;
  onAnimationComplete: () => void;
}

const { width, height } = Dimensions.get('window');

const StreakAnimation: React.FC<StreakAnimationProps> = ({ 
  streak, 
  visible, 
  onAnimationComplete 
}) => {
  console.log('StreakAnimation render - streak:', streak, 'visible:', visible);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      console.log('Starting streak animation for streak:', streak);
      // Reset all animations to initial state
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      confettiAnim.setValue(0);
      rotationAnim.setValue(0);
      
      // Start the animation sequence
      Animated.sequence([
        // Fade in and scale in with bounce
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Hold for a moment
        Animated.delay(2500),
        // Scale out and fade
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        console.log('Streak animation completed for streak:', streak);
        onAnimationComplete();
      });

      // Confetti animation
      Animated.sequence([
        Animated.delay(200),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Rotation animation
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        { iterations: 2 }
      ).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      confettiAnim.setValue(0);
      rotationAnim.setValue(0);
    }
  }, [visible, streak]);

  const getStreakMessage = (streak: number) => {
    switch (streak) {
      case 2:
        return { emoji: '🔥', text: 'Great Start!', color: '#FF6B35' };
      case 5:
        return { emoji: '⭐', text: 'Amazing!', color: '#FFD700' };
      case 10:
        return { emoji: '🏆', text: 'Incredible!', color: '#FF6B6B' };
      default:
        return { emoji: '🎉', text: 'Well Done!', color: '#4ECDC4' };
    }
  };

  const getConfettiColors = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors;
  };

  const createConfettiPieces = () => {
    const pieces = [];
    const colors = getConfettiColors();
    
    for (let i = 0; i < 20; i++) {
      const left = Math.random() * width;
      const delay = Math.random() * 500;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      pieces.push(
        <Animated.View
          key={i}
          style={[
            styles.confettiPiece,
            {
              left,
              backgroundColor: color,
              transform: [
                {
                  translateY: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, height + 100],
                  }),
                },
                {
                  rotate: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '720deg'],
                  }),
                },
              ],
              opacity: confettiAnim,
            },
          ]}
        />
      );
    }
    return pieces;
  };

  const message = getStreakMessage(streak);
  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Confetti pieces */}
      {createConfettiPieces()}
      
      {/* Main celebration content */}
      <Animated.View
        style={[
          styles.celebrationContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotation },
            ],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={[styles.celebrationBox, { backgroundColor: message.color }]}>
          <Text style={styles.emoji}>{message.emoji}</Text>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakText}>STREAK!</Text>
          <Text style={styles.messageText}>{message.text}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    pointerEvents: 'none',
  },
  celebrationContainer: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationBox: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    top: -50,
  },
});

export default StreakAnimation;
