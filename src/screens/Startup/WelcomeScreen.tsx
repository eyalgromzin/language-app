import React from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Dimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../../hooks/useTranslation';

type OnboardingStackParamList = {
  Welcome: undefined;
  LearningLanguage: undefined;
  NativeLanguage: undefined;
  PracticeSettings: undefined;
  Completion: undefined;
};

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Welcome'>;

const { width, height } = Dimensions.get('window');

// Fireworks particle component
interface FireworkParticleProps {
  delay: number;
  color: string;
  startX: number;
  startY: number;
}

function FireworkParticle({ delay, color, startX, startY }: FireworkParticleProps): React.JSX.Element {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const animate = () => {
      // Reset values
      animatedValue.setValue(0);
      scaleValue.setValue(0);
      opacityValue.setValue(1);

      // Create random end position
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = startY + (Math.random() - 0.5) * 200;

      // Animate the particle
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 200,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 0,
            duration: 1300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 1500,
          delay,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Restart animation after a delay
        setTimeout(animate, Math.random() * 3000 + 2000);
      });
    };

    animate();
  }, [animatedValue, scaleValue, opacityValue, delay, startX, startY]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, startX + (Math.random() - 0.5) * 200],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, startY + (Math.random() - 0.5) * 200],
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          transform: [
            { translateX },
            { translateY },
            { scale: scaleValue },
          ],
          opacity: opacityValue,
        },
      ]}
    />
  );
}

// Fireworks component
function Fireworks(): React.JSX.Element {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const particles = [];

  // Create multiple firework bursts
  for (let i = 0; i < 5; i++) {
    const centerX = Math.random() * width;
    const centerY = Math.random() * (height * 0.4) + 100; // Keep fireworks in upper portion
    
    for (let j = 0; j < 8; j++) {
      particles.push({
        key: `${i}-${j}`,
        delay: i * 500 + j * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        startX: centerX,
        startY: centerY,
      });
    }
  }

  return (
    <View style={styles.fireworksContainer}>
      {particles.map((particle) => (
        <FireworkParticle
          key={particle.key}
          delay={particle.delay}
          color={particle.color}
          startX={particle.startX}
          startY={particle.startY}
        />
      ))}
    </View>
  );
}

function WelcomeScreen({ navigation }: Props): React.JSX.Element {
  const logoScale = React.useRef(new Animated.Value(0)).current;
  const titleOpacity = React.useRef(new Animated.Value(0)).current;
  const subtitleOpacity = React.useRef(new Animated.Value(0)).current;
  const buttonOpacity = React.useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  React.useEffect(() => {
    // Animate elements in sequence
    Animated.sequence([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoScale, titleOpacity, subtitleOpacity, buttonOpacity]);

  const onGetStarted = () => {
    navigation.navigate('LearningLanguage');
  };

  return (
    <View style={styles.container}>
      {/* Fireworks Animation */}
      <Fireworks />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Ionicons name="language" size={60} color="#007AFF" />
          </View>
        </Animated.View>

        {/* Title Section */}
        <Animated.View
          style={[
            styles.titleSection,
            {
              opacity: titleOpacity,
            },
          ]}
        >
          <Text style={styles.title}>{t('screens.startup.welcomeScreen.title')}</Text>
          <Text style={styles.subtitle}>
            {t('screens.startup.welcomeScreen.subtitle')}
          </Text>
        </Animated.View>

        {/* Features Section */}
        <Animated.View
          style={[
            styles.featuresSection,
            {
              opacity: subtitleOpacity,
            },
          ]}
        >
          <View style={styles.featureItem}>
            <Ionicons name="book-outline" size={24} color="#007AFF" />
            <Text style={styles.featureText}>{t('screens.startup.welcomeScreen.features.interactiveExercises')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="trophy-outline" size={24} color="#007AFF" />
            <Text style={styles.featureText}>{t('screens.startup.welcomeScreen.features.trackProgress')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="globe-outline" size={24} color="#007AFF" />
            <Text style={styles.featureText}>{t('screens.startup.welcomeScreen.features.exploreContent')}</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="people-outline" size={24} color="#007AFF" />
            <Text style={styles.featureText}>{t('screens.startup.welcomeScreen.features.personalizedPath')}</Text>
          </View>
        </Animated.View>

        {/* Get Started Button */}
        <Animated.View
          style={[
            styles.buttonSection,
            {
              opacity: buttonOpacity,
            },
          ]}
        >
          <Pressable
            style={styles.getStartedButton}
            onPress={onGetStarted}
            accessibilityRole="button"
            accessibilityLabel={t('screens.startup.welcomeScreen.accessibility.getStarted')}
          >
            <Text style={styles.getStartedButtonText}>{t('screens.startup.welcomeScreen.cta')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  fireworksContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    width: '100%',
    marginBottom: 50,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 16,
    flex: 1,
  },
  buttonSection: {
    width: '100%',
  },
  getStartedButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default WelcomeScreen;
