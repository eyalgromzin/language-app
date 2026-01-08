import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, useColorScheme, Dimensions, TouchableOpacity, NativeModules, Alert, Animated, Vibration, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Svg, Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { getLangCode } from '../../utils/translation';
import { getBabySteps } from '../../config/api';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';

type StepItem = {
  id: string;
  title: string;
  items: any[];
  emoji?: string;
};

type StepsFile = {
  language: string;
  overview?: string;
  steps: StepItem[];
};

const NODE_DIAMETER = 72;
const H_SPACING = 36;
const V_SPACING = 42;
const CONTENT_PADDING = 16;

function BabyStepsPathScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const isDark = useColorScheme() === 'dark';
  const [steps, setSteps] = React.useState<StepItem[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(Dimensions.get('window').width);
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set()); // Individual completed step indices
  
  // Calculate maxCompletedIndex from completedSteps
  const maxCompletedIndex = React.useMemo(() => {
    if (completedSteps.size === 0) return 0;
    return Math.max(...completedSteps) + 1; // Convert 0-based index to 1-based count
  }, [completedSteps]);
  const [translatedTitleById, setTranslatedTitleById] = React.useState<Record<string, string>>({});
  const navigation = useNavigation<any>();
  const { languageMappings } = useLanguageMappings();

  console.log('[BabyStepsPathScreen] Component mounted/rendered with state:', {
    loading,
    error,
    stepsLength: steps?.length || 0,
    hasSteps: !!steps
  });
  
  // Add useFocusEffect to track when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('[BabyStepsPathScreen] Screen focused - user navigated to this tab');
      return () => {
        console.log('[BabyStepsPathScreen] Screen unfocused - user navigated away');
      };
    }, [])
  );
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const nodeAnimations = React.useRef<Animated.Value[]>([]).current;
  const particleAnimations = React.useRef<Animated.Value[]>([]).current;

  // Initialize animations when steps are loaded
  React.useEffect(() => {
    if (steps && steps.length > 0) {
      // Initialize node animations
      nodeAnimations.length = 0;
      particleAnimations.length = 0;
      for (let i = 0; i < steps.length; i++) {
        nodeAnimations.push(new Animated.Value(0));
        particleAnimations.push(new Animated.Value(0));
      }
      
      // Start entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Stagger node animations
      const nodeAnimationsSequence = nodeAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true,
        })
      );
      
      Animated.stagger(100, nodeAnimationsSequence).start();
    }
  }, [steps]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log('[BabyStepsPathScreen] Loading baby steps data...');
        const [learningName, nativeName] = await Promise.all([
          AsyncStorage.getItem('language.learning'),
          AsyncStorage.getItem('language.native'),
        ]);
        console.log('[BabyStepsPathScreen] Languages loaded:', { learningName, nativeName });
        const learningCode = getLangCode(learningName, languageMappings) || 'en';
        const nativeCode = getLangCode(nativeName, languageMappings) || 'en';
        console.log('[BabyStepsPathScreen] Language codes:', { learningCode, nativeCode });
        
        // Helper function to check if cached data is still valid (less than 1 week old)
        const isCacheValid = (timestamp: number): boolean => {
          const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
          return Date.now() - timestamp < oneWeekInMs;
        };

        // Try to load from cache first
        let json: StepsFile | null = null;
        let shouldFetchFromServer = true;
        
        try {
          const cacheKey = `babySteps.path.${learningCode}`;
          const cachedData = await AsyncStorage.getItem(cacheKey);
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            if (parsed.data && parsed.timestamp && isCacheValid(parsed.timestamp)) {
              json = parsed.data;
              shouldFetchFromServer = false;
              console.log('[BabyStepsPathScreen] Loaded baby steps from cache');
            } else {
              console.log('[BabyStepsPathScreen] Cache expired, fetching from server');
            }
          }
        } catch (error) {
          console.log('[BabyStepsPathScreen] Error loading from cache:', error);
        }

        // Load steps for current learning language from server if cache is invalid or missing
        if (shouldFetchFromServer) {
          try {
            json = await getBabySteps(learningCode);
            if (!mounted) return;
            console.log('[BabyStepsPathScreen] Baby steps data loaded from server:', json);
            
            // Save to cache
            try {
              const cacheKey = `babySteps.path.${learningCode}`;
              const cacheData = {
                data: json,
                timestamp: Date.now(),
              };
              await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
              console.log('[BabyStepsPathScreen] Saved baby steps to cache');
            } catch (error) {
              console.error('[BabyStepsPathScreen] Error saving to cache:', error);
            }
          } catch (error) {
            console.error('Error loading baby steps:', error);
            if (!mounted) return;
            setError(`Failed to load steps: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setSteps([]);
            setLoading(false);
            return;
          }
        }

        if (!mounted) return;
        
        if (json && Array.isArray(json.steps) && json.steps.length) {
          setSteps(json.steps);
          console.log('[BabyStepsPathScreen] Steps set:', json.steps.length, 'steps');
        } else {
          setSteps([]);
          console.log('[BabyStepsPathScreen] No steps found, setting empty array');
        }
        
        // Build translated titles map from native language file if available
        try {
          let nativeJson: StepsFile | null = null;
          let shouldFetchNativeFromServer = true;
          
          // Try to load native language steps from cache
          try {
            const nativeCacheKey = `babySteps.path.${nativeCode}`;
            const nativeCachedData = await AsyncStorage.getItem(nativeCacheKey);
            if (nativeCachedData) {
              const parsed = JSON.parse(nativeCachedData);
              if (parsed.data && parsed.timestamp && isCacheValid(parsed.timestamp)) {
                nativeJson = parsed.data;
                shouldFetchNativeFromServer = false;
                console.log('[BabyStepsPathScreen] Loaded native baby steps from cache');
              }
            }
          } catch (error) {
            console.log('[BabyStepsPathScreen] Error loading native from cache:', error);
          }
          
          // Fetch from server if cache is invalid or missing
          if (shouldFetchNativeFromServer) {
            nativeJson = await getBabySteps(nativeCode);
            // Save to cache
            try {
              const nativeCacheKey = `babySteps.path.${nativeCode}`;
              const nativeCacheData = {
                data: nativeJson,
                timestamp: Date.now(),
              };
              await AsyncStorage.setItem(nativeCacheKey, JSON.stringify(nativeCacheData));
              console.log('[BabyStepsPathScreen] Saved native baby steps to cache');
            } catch (error) {
              console.error('[BabyStepsPathScreen] Error saving native to cache:', error);
            }
          }
          
          if (nativeJson) {
            const map: Record<string, string> = {};
            (nativeJson.steps || []).forEach((st) => { map[st.id] = st.title; });
            setTranslatedTitleById(map);
          } else {
            setTranslatedTitleById({});
          }
        } catch {
          setTranslatedTitleById({});
        }
        // load individual completed steps
        try {
          const completedStepsData = await AsyncStorage.getItem(`babySteps.completedSteps.${learningCode}`);
          const completedStepsSet = completedStepsData 
            ? new Set(JSON.parse(completedStepsData) as number[])
            : new Set<number>();
          setCompletedSteps(completedStepsSet);
        } catch {}
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load steps.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Refresh completed steps when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        try {
          const learningName = await AsyncStorage.getItem('language.learning');
          const code = getLangCode(learningName, languageMappings) || 'en';
          
          // Refresh individual completed steps
          const completedStepsData = await AsyncStorage.getItem(`babySteps.completedSteps.${code}`);
          const completedStepsSet = completedStepsData 
            ? new Set(JSON.parse(completedStepsData) as number[])
            : new Set<number>();
          if (active) {
            setCompletedSteps(completedStepsSet);
          }
          
          // Also refresh translated titles in case native language changed
          const nativeName = await AsyncStorage.getItem('language.native');
          const nativeCode = getLangCode(nativeName, languageMappings) || 'en';
          try {
            // Helper function to check if cached data is still valid (less than 1 week old)
            const isCacheValid = (timestamp: number): boolean => {
              const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
              return Date.now() - timestamp < oneWeekInMs;
            };
            
            let nativeJson: StepsFile | null = null;
            let shouldFetchNativeFromServer = true;
            
            // Try to load native language steps from cache
            try {
              const nativeCacheKey = `babySteps.path.${nativeCode}`;
              const nativeCachedData = await AsyncStorage.getItem(nativeCacheKey);
              if (nativeCachedData) {
                const parsed = JSON.parse(nativeCachedData);
                if (parsed.data && parsed.timestamp && isCacheValid(parsed.timestamp)) {
                  nativeJson = parsed.data;
                  shouldFetchNativeFromServer = false;
                }
              }
            } catch (error) {
              // Ignore cache errors, will fetch from server
            }
            
            // Fetch from server if cache is invalid or missing
            if (shouldFetchNativeFromServer) {
              nativeJson = await getBabySteps(nativeCode);
              // Save to cache
              try {
                const nativeCacheKey = `babySteps.path.${nativeCode}`;
                const nativeCacheData = {
                  data: nativeJson,
                  timestamp: Date.now(),
                };
                await AsyncStorage.setItem(nativeCacheKey, JSON.stringify(nativeCacheData));
              } catch (error) {
                // Ignore cache save errors
              }
            }
            
            if (nativeJson) {
              const map: Record<string, string> = {};
              (nativeJson.steps || []).forEach((st) => { map[st.id] = st.title; });
              if (active) {
                setTranslatedTitleById(map);
              }
            } else {
              if (active) {
                setTranslatedTitleById({});
              }
            }
          } catch {
            if (active) {
              setTranslatedTitleById({});
            }
          }
        } catch {}
      })();
      return () => { active = false; };
    }, [])
  );

  const positions = React.useMemo(() => {
    if (!steps) return [] as { x: number; y: number }[];
    const usableWidth = containerWidth - CONTENT_PADDING * 2;
    const numColumns = 2; // simple zig-zag in two columns
    const columnWidth = (usableWidth - H_SPACING) / numColumns;
    const leftX = CONTENT_PADDING + (columnWidth - NODE_DIAMETER) / 2;
    const rightX = CONTENT_PADDING + columnWidth + H_SPACING + (columnWidth - NODE_DIAMETER) / 2;

    const result: { x: number; y: number }[] = [];
    let currentY = CONTENT_PADDING + 40; // Add extra top spacing
    for (let i = 0; i < steps.length; i++) {
      const isLeft = i % 2 === 0;
      const x = isLeft ? leftX : rightX;
      result.push({ x, y: currentY });
      // advance Y for next node
      currentY += NODE_DIAMETER + V_SPACING;
    }
    return result;
  }, [steps, containerWidth]);

  const contentHeight = React.useMemo(() => {
    if (!steps || steps.length === 0) return 80; // Header height
    return 80 + CONTENT_PADDING + 40 + steps.length * (NODE_DIAMETER + V_SPACING); // Header height + top spacing + content
  }, [steps]);

  const clearProgress = async () => {
    try {
      const learningName = await AsyncStorage.getItem('language.learning');
      const code = getLangCode(learningName, languageMappings) || 'en';
      
      Alert.alert(
        t('screens.babyStepsPath.clearProgress'),
        t('screens.babyStepsPath.clearProgressMessage'),
        [
          {
            text: t('screens.babyStepsPath.cancel'),
            style: 'cancel',
          },
          {
            text: t('screens.babyStepsPath.clearProgress'),
            style: 'destructive',
            onPress: async () => {
              try {
                // Clear the progress for the current learning language
                await AsyncStorage.removeItem(`babySteps.completedSteps.${code}`);
                setCompletedSteps(new Set());
                
                // Show success message
                Alert.alert(t('screens.babyStepsPath.progressCleared'), t('screens.babyStepsPath.progressClearedMessage'));
              } catch (error) {
                console.error('Error clearing progress:', error);
                Alert.alert(t('screens.babyStepsPath.error'), t('screens.babyStepsPath.clearProgressError'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error getting language code:', error);
      Alert.alert(t('screens.babyStepsPath.error'), t('screens.babyStepsPath.clearProgressError'));
    }
  };

  if (loading) {
    console.log('[BabyStepsPathScreen] Rendering loading screen');
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={isDark ? '#3b82f6' : '#3b82f6'} 
          />
          <Text style={[styles.loadingText, { color: isDark ? '#f1f5f9' : '#1e293b' }]}>
            {t('screens.babyStepsPath.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }]}>
        <View style={styles.centerFill}>
          <Text style={[styles.errorText, { color: isDark ? '#ef4444' : '#dc2626' }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!steps || steps.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }]}>
        <View style={styles.centerFill}>
          <Text style={[styles.infoText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {t('screens.babyStepsPath.noSteps')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const EMOJI_BY_PREFIX: Record<string, string> = {
    '01': '👋',
    '02': '💬',
    '03': '🔤',
    '04': '🔢',
    '05': '🧭',
    '06': '🍎',
    '07': '🛍️',
    '08': '🧳',
    '09': '⛑️',
    '10': '☀️',
    '11': '👪',
    '12': '🌦️',
    '13': '💼',
    '14': '📅',
    '15': '🙋',
    '16': '📱',
    '17': '🍽️',
    '18': '🚌',
    '19': '🏠',
    '20': '🔗',
  };

  const getEmojiForStep = (s: StepItem, idx: number): string => {
    if (s.emoji && typeof s.emoji === 'string' && s.emoji.length > 0) return s.emoji;
    const prefix = (s.id || '').slice(0, 2);
    return EMOJI_BY_PREFIX[prefix] || '⭐';
  };

  // Particle component for completed steps
  const ParticleEffect = ({ isCompleted, index }: { isCompleted: boolean; index: number }) => {
    const particleAnim = React.useRef(new Animated.Value(0)).current;
    
    React.useEffect(() => {
      if (isCompleted) {
        const animateParticles = () => {
          Animated.sequence([
            Animated.timing(particleAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(particleAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]).start(() => {
            if (isCompleted) {
              setTimeout(animateParticles, 3000);
            }
          });
        };
        animateParticles();
      }
    }, [isCompleted]);

    if (!isCompleted) return null;

    const particleColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    
    return (
      <View style={styles.particleContainer}>
        {[...Array(8)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                backgroundColor: particleColors[i % particleColors.length],
                transform: [
                  {
                    translateX: particleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (Math.random() - 0.5) * 120],
                    }),
                  },
                  {
                    translateY: particleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (Math.random() - 0.5) * 120],
                    }),
                  },
                  {
                    scale: particleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1.2, 0],
                    }),
                  },
                  {
                    rotate: particleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: particleAnim.interpolate({
                  inputRange: [0, 0.3, 0.7, 1],
                  outputRange: [0, 1, 1, 0],
                }),
              },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0a0a0a' : '#f8fafc' }]}>
      {/* Professional Gradient Background */}
      <Animated.View style={[
        StyleSheet.absoluteFillObject, 
        { 
          opacity: fadeAnim,
          backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
        }
      ]} />
      
      {/* Subtle Background Pattern */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: 0.3 }]}>
        <Svg width={containerWidth} height={contentHeight - 40} style={StyleSheet.absoluteFillObject}>
          <Defs>
            <SvgLinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={isDark ? 'rgba(77, 163, 255, 0.05)' : 'rgba(99, 102, 241, 0.05)'} />
              <Stop offset="100%" stopColor={isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(168, 85, 247, 0.05)'} />
            </SvgLinearGradient>
          </Defs>
          {[...Array(12)].map((_, i) => (
            <Circle
              key={`bg-circle-${i}`}
              cx={Math.random() * containerWidth}
              cy={Math.random() * Math.max(1, contentHeight - 80)}
              r={Math.random() * 2 + 1}
              fill="url(#bgGradient)"
            />
          ))}
        </Svg>
      </Animated.View>

      <ScrollView contentContainerStyle={{ minHeight: contentHeight }}>
        {/* Professional Header */}
        <Animated.View style={[
          styles.header, 
          { 
            backgroundColor: isDark ? 'rgba(15, 15, 15, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            transform: [{ scale: scaleAnim }],
            opacity: fadeAnim,
            shadowColor: isDark ? '#000' : '#000',
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 8,
          }
        ]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.titleContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.stepsIcon}>👣</Text>
                  <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#1e293b' }]}>
                    {t('screens.babyStepsPath.title')}
                  </Text>
                </View>
                <Text style={[styles.headerSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {t('screens.babyStepsPath.subtitle')}
                </Text>
              </View>
              {steps && steps.length > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {t('screens.babyStepsPath.progress')}
                    </Text>
                    <Text style={[styles.progressText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {completedSteps.size} {t('screens.babyStepsPath.of')} {steps.length} {t('screens.babyStepsPath.completed')}
                    </Text>
                  </View>
                  <View style={[
                    styles.progressBarBackground,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }
                  ]}>
                    <Animated.View style={[
                      styles.progressBarFill,
                      {
                        width: `${(completedSteps.size / steps.length) * 100}%`,
                        backgroundColor: isDark ? '#10b981' : '#059669'
                      }
                    ]} />
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
        <View
          style={styles.canvas}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          {/* Animated Curved connectors using SVG */}
          <Svg width={containerWidth} height={contentHeight - 40} style={StyleSheet.absoluteFillObject}>
            {positions.map((pos, idx) => {
              if (idx === 0) return null;
              const prev = positions[idx - 1];
              const x1 = prev.x + NODE_DIAMETER / 2;
              const y1 = prev.y + NODE_DIAMETER / 2;
              const x2 = pos.x + NODE_DIAMETER / 2;
              const y2 = pos.y + NODE_DIAMETER / 2;
              const dx = x2 - x1;
              // Use horizontal curvature proportional to horizontal distance, clamped for aesthetics
              const curvature = Math.min(80, Math.max(24, Math.abs(dx) * 0.6));
              const c1x = x1 + Math.sign(dx) * curvature;
              const c1y = y1;
              const c2x = x2 - Math.sign(dx) * curvature;
              const c2y = y2;
              const d = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
              const destEnabled = (idx + 1) <= Math.min((steps?.length || 0), maxCompletedIndex + 3);
              const isCompleted = completedSteps.has(idx);
              
              return (
                <Path
                  key={`curve-${idx}`}
                  d={d}
                  stroke={isCompleted 
                    ? (isDark ? '#10b981' : '#059669')
                    : (isDark ? '#3b82f6' : '#3b82f6')
                  }
                  strokeWidth={isCompleted ? 5 : 3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={destEnabled ? 0.8 : 0.2}
                  strokeDasharray={isCompleted ? "6,3" : "none"}
                />
              );
            })}
          </Svg>

          {/* Animated Nodes */}
          {steps.map((s, idx) => {
            const pos = positions[idx];
            const isCompleted = completedSteps.has(idx);
            const isEnabled = idx + 1 <= Math.min((steps?.length || 0), maxCompletedIndex + 3);
            const emoji = getEmojiForStep(s, idx);
            const isLeft = idx % 2 === 0;
            const nodeAnim = nodeAnimations[idx] || new Animated.Value(0);
            
            return (
              <Animated.View
                key={s.id}
                style={[
                  styles.nodeContainer,
                  {
                    left: pos.x,
                    top: pos.y,
                    transform: [
                      {
                        scale: nodeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                      {
                        translateY: nodeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      },
                    ],
                    opacity: nodeAnim,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.nodeTouchable}
                  accessibilityRole="button"
                  accessibilityLabel={`Step ${idx + 1}: ${s.title}${isCompleted ? ' (completed)' : ''}`}
                  onPress={() => {
                    if (!isEnabled) return;
                    // Add haptic feedback
                    const parent = navigation.getParent?.();
                    if (parent) parent.navigate('BabyStepRunner', { stepIndex: idx });
                    else navigation.navigate('BabyStepRunner' as never, { stepIndex: idx } as never);
                  }}
                  disabled={!isEnabled}
                >
                  <View
                    style={[
                      styles.nodeCircle,
                      {
                        backgroundColor: isCompleted 
                          ? (isDark ? '#065f46' : '#ecfdf5')
                          : (isDark ? '#1e293b' : '#ffffff'),
                        borderColor: isCompleted 
                          ? (isDark ? '#10b981' : '#059669')
                          : (isDark ? '#334155' : '#e2e8f0'),
                        opacity: isEnabled ? 1 : 0.5,
                        shadowColor: isCompleted 
                          ? (isDark ? '#10b981' : '#059669')
                          : (isDark ? '#3b82f6' : '#3b82f6'),
                        shadowOpacity: isEnabled ? 0.3 : 0.1,
                        shadowRadius: isEnabled ? 12 : 6,
                        shadowOffset: { width: 0, height: isEnabled ? 6 : 3 },
                        elevation: isEnabled ? 8 : 4,
                      },
                    ]}
                  >
                    <Text style={styles.emojiText} accessibilityLabel={`${s.title} icon`}>{emoji}</Text>
                    
                    <View
                      style={[
                        styles.indexBadge,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                          borderColor: isDark ? '#3b82f6' : '#3b82f6',
                          shadowColor: isDark ? '#3b82f6' : '#3b82f6',
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 3,
                        },
                      ]}
                    >
                      <Text style={[styles.indexBadgeText, { color: isDark ? '#dbeafe' : '#1e40af' }]}>{idx + 1}</Text>
                    </View>
                    
                    {isCompleted ? (
                      <View
                        style={[
                          styles.completedBadge,
                          isLeft ? styles.completedBadgeLeft : styles.completedBadgeRight,
                          {
                            backgroundColor: isDark ? '#065f46' : '#ecfdf5',
                            borderColor: isDark ? '#10b981' : '#059669',
                            shadowColor: isDark ? '#10b981' : '#059669',
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 3,
                          },
                        ]}
                      >
                        <Text style={[styles.completedBadgeText, { color: isDark ? '#6ee7b7' : '#047857' }]}>✓</Text>
                      </View>
                    ) : null}
                  </View>
                  
                  {/* Particle Effect for completed steps */}
                  <ParticleEffect isCompleted={isCompleted} index={idx} />
                </TouchableOpacity>
                
                <Text style={[
                  styles.nodeTitle, 
                  { 
                    color: isDark ? '#f1f5f9' : '#1e293b', 
                    opacity: isEnabled ? 1.0 : 0.4,
                    textShadowColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }
                ]}>
                  {translatedTitleById[s.id] || s.title}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    width: '100%',
  },
  headerLeft: {
    flex: 1,
  },
  titleContainer: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  stepsIcon: {
    fontSize: 20,
    marginRight: 8,
    opacity: 0.8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  progressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  canvas: {
    flex: 1,
  },
  nodeContainer: {
    position: 'absolute',
    width: NODE_DIAMETER,
    alignItems: 'center',
  },
  nodeTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircle: {
    width: NODE_DIAMETER,
    height: NODE_DIAMETER,
    borderRadius: NODE_DIAMETER / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  emojiText: {
    fontSize: 32,
    lineHeight: 36,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  nodeTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: NODE_DIAMETER + 24,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  indexBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  indexBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  completedBadge: {
    position: 'absolute',
    top: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  completedBadgeLeft: {
    left: -6,
  },
  completedBadgeRight: {
    right: -6,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  particleContainer: {
    position: 'absolute',
    width: NODE_DIAMETER * 2,
    height: NODE_DIAMETER * 2,
    top: -NODE_DIAMETER / 2,
    left: -NODE_DIAMETER / 2,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD700',
    top: NODE_DIAMETER / 2 - 3,
    left: NODE_DIAMETER / 2 - 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});

export default BabyStepsPathScreen;


