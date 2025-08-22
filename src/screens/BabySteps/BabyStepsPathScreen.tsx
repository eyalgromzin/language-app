import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, useColorScheme, Dimensions, TouchableOpacity, NativeModules } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Svg, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLangCode } from '../../utils/translation';

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

const STEPS_FALLBACK_BY_CODE: Record<string, StepsFile> = {
  en: require('./steps_en-test.json'),
  es: require('./steps_es-test.json'),
};

const NODE_DIAMETER = 72;
const H_SPACING = 36;
const V_SPACING = 42;
const CONTENT_PADDING = 16;

function BabyStepsPathScreen(): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const [steps, setSteps] = React.useState<StepItem[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [containerWidth, setContainerWidth] = React.useState<number>(Dimensions.get('window').width);
  const [maxCompletedIndex, setMaxCompletedIndex] = React.useState<number>(0); // 0 means none finished
  const [translatedTitleById, setTranslatedTitleById] = React.useState<Record<string, string>>({});
  const navigation = useNavigation<any>();
  const apiBaseUrl = React.useMemo(() => {
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    if (scriptURL) {
      try {
        const { hostname } = new URL(scriptURL);
        return `http://${hostname}:3000`;
      } catch {}
    }
    return 'http://localhost:3000';
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [learningName, nativeName] = await Promise.all([
          AsyncStorage.getItem('language.learning'),
          AsyncStorage.getItem('language.native'),
        ]);
        const learningCode = getLangCode(learningName) || 'en';
        const nativeCode = getLangCode(nativeName) || 'en';
        // Try server first
        try {
          const res = await fetch(`${apiBaseUrl}/baby-steps/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: learningCode }),
          });
          if (!mounted) return;
          if (res.ok) {
            const json: StepsFile = await res.json();
            if (json && Array.isArray(json.steps) && json.steps.length) {
              setSteps(json.steps);
            } else {
              const file = STEPS_FALLBACK_BY_CODE[learningCode] || STEPS_FALLBACK_BY_CODE['en'];
              setSteps(file.steps || []);
            }
          } else {
            const file = STEPS_FALLBACK_BY_CODE[learningCode] || STEPS_FALLBACK_BY_CODE['en'];
            setSteps(file.steps || []);
          }
        } catch {
          if (!mounted) return;
          const file = STEPS_FALLBACK_BY_CODE[learningCode] || STEPS_FALLBACK_BY_CODE['en'];
          setSteps(file.steps || []);
        }
        // Build translated titles map from native language file if available
        try {
          const resNative = await fetch(`${apiBaseUrl}/baby-steps/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: nativeCode }),
          });
          if (resNative.ok) {
            const nativeJson: StepsFile = await resNative.json();
            const map: Record<string, string> = {};
            (nativeJson.steps || []).forEach((st) => { map[st.id] = st.title; });
            setTranslatedTitleById(map);
          } else {
            const nativeFile = STEPS_FALLBACK_BY_CODE[nativeCode] || STEPS_FALLBACK_BY_CODE['en'];
            const map: Record<string, string> = {};
            nativeFile.steps.forEach((st) => { map[st.id] = st.title; });
            setTranslatedTitleById(map);
          }
        } catch {
          const nativeFile = STEPS_FALLBACK_BY_CODE[nativeCode] || STEPS_FALLBACK_BY_CODE['en'];
          const map: Record<string, string> = {};
          nativeFile.steps.forEach((st) => { map[st.id] = st.title; });
          setTranslatedTitleById(map);
        }
        // load progress (highest finished node index; 0 if none)
        try {
          const stored = await AsyncStorage.getItem(`babySteps.maxCompletedIndex.${learningCode}`);
          const parsed = Number.parseInt(stored ?? '0', 10);
          if (!Number.isNaN(parsed) && parsed >= 0) {
            setMaxCompletedIndex(parsed);
          }
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

  // Refresh maxCompletedIndex when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      (async () => {
        try {
          const learningName = await AsyncStorage.getItem('language.learning');
          const code = getLangCode(learningName) || 'en';
          const stored = await AsyncStorage.getItem(`babySteps.maxCompletedIndex.${code}`);
          const parsed = Number.parseInt(stored ?? '0', 10);
          if (active && !Number.isNaN(parsed) && parsed >= 0) {
            setMaxCompletedIndex(parsed);
          }
          // Also refresh translated titles in case native language changed
          const nativeName = await AsyncStorage.getItem('language.native');
          const nativeCode = getLangCode(nativeName) || 'en';
          try {
            const resNative = await fetch(`${apiBaseUrl}/baby-steps/get`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ language: nativeCode }),
            });
            if (resNative.ok) {
              const nativeJson: StepsFile = await resNative.json();
              const map: Record<string, string> = {};
              (nativeJson.steps || []).forEach((st) => { map[st.id] = st.title; });
              setTranslatedTitleById(map);
            } else {
              const nativeFile = STEPS_FALLBACK_BY_CODE[nativeCode] || STEPS_FALLBACK_BY_CODE['en'];
              const map: Record<string, string> = {};
              nativeFile.steps.forEach((st) => { map[st.id] = st.title; });
              setTranslatedTitleById(map);
            }
          } catch {}
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
    let currentY = CONTENT_PADDING;
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
    if (!steps || steps.length === 0) return 0;
    return CONTENT_PADDING + steps.length * (NODE_DIAMETER + V_SPACING);
  }, [steps]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <View style={styles.centerFill}><Text style={[styles.infoText, { color: isDark ? '#eee' : '#333' }]}>Loading…</Text></View>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <View style={styles.centerFill}><Text style={[styles.infoText, { color: '#d00' }]}>{error}</Text></View>
      </SafeAreaView>
    );
  }
  if (!steps) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000' : '#fff' }]}>
        <View style={styles.centerFill}><Text style={[styles.infoText, { color: isDark ? '#eee' : '#333' }]}>No steps found.</Text></View>
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <ScrollView contentContainerStyle={{ height: contentHeight }}>
        <View
          style={styles.canvas}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          {/* Curved connectors using SVG */}
          <Svg width={containerWidth} height={contentHeight} style={StyleSheet.absoluteFillObject}>
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
              return (
                <Path
                  key={`curve-${idx}`}
                  d={d}
                  stroke={isDark ? '#4DA3FF' : '#007AFF'}
                  strokeWidth={4}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                />
              );
            })}
          </Svg>

          {/* Nodes */}
          {steps.map((s, idx) => {
            const pos = positions[idx];
            const isCompleted = idx + 1 <= maxCompletedIndex;
            const isEnabled = idx + 1 <= Math.min((steps?.length || 0), maxCompletedIndex + 3);
            const emoji = getEmojiForStep(s, idx);
            const isLeft = idx % 2 === 0;
            return (
              <TouchableOpacity key={s.id}
                style={[
                  styles.nodeContainer,
                  {
                    left: pos.x,
                    top: pos.y,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Step ${idx + 1}: ${s.title}${isCompleted ? ' (completed)' : ''}`}
                onPress={() => {
                  if (!isEnabled) return;
                  const parent = navigation.getParent?.();
                  if (parent) parent.navigate('BabyStepRunner', { stepIndex: idx });
                  else navigation.navigate('BabyStepRunner' as never, { stepIndex: idx } as never);
                }}
                disabled={!isEnabled}
              >
                <View style={[
                  styles.nodeCircle,
                  {
                    backgroundColor: isCompleted ? (isDark ? '#12351c' : '#E6F7E9') : (isDark ? '#2C2C2E' : '#F1F3F5'),
                    borderColor: isCompleted ? '#2E7D32' : (isDark ? '#3A3A3C' : '#D0D5DB'),
                    opacity: 1.0,
                  },
                ]}>
                  <Text style={styles.emojiText} accessibilityLabel={`${s.title} icon`}>{emoji}</Text>
                  <View style={[
                    styles.indexBadge,
                    {
                      backgroundColor: isDark ? '#001a3a' : '#fff',
                      borderColor: isDark ? '#4DA3FF' : '#BBD6FF',
                    },
                  ]}
                    accessible={false}
                  >
                    <Text style={[styles.indexBadgeText, { color: isDark ? '#EAF3FF' : '#0A57CC' }]}>{idx + 1}</Text>
                  </View>
                  {isCompleted ? (
                    <View
                      style={[
                        styles.completedBadge,
                        isLeft ? styles.completedBadgeLeft : styles.completedBadgeRight,
                        {
                          backgroundColor: isDark ? '#001a3a' : '#fff',
                          borderColor: isDark ? '#66BB6A' : '#2E7D32',
                        },
                      ]}
                      accessible={false}
                    >
                      <Text style={[styles.completedBadgeText, { color: isDark ? '#C8E6C9' : '#2E7D32' }]}>V</Text>
                    </View>
                  ) : null}
                </View>
                <Text numberOfLines={2} style={[styles.nodeTitle, { color: isDark ? '#f0f0f0' : '#222', opacity: 1.0 }]}>{translatedTitleById[s.id] || s.title}</Text>
              </TouchableOpacity>
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
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 16,
  },
  canvas: {
    flex: 1,
  },
  nodeContainer: {
    position: 'absolute',
    width: NODE_DIAMETER,
    alignItems: 'center',
  },
  nodeCircle: {
    width: NODE_DIAMETER,
    height: NODE_DIAMETER,
    borderRadius: NODE_DIAMETER / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    position: 'relative',
  },
  emojiText: {
    fontSize: 34,
    lineHeight: 38,
  },
  nodeTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  indexBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  indexBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  completedBadge: {
    position: 'absolute',
    top: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  completedBadgeLeft: {
    left: -6,
  },
  completedBadgeRight: {
    right: -6,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

export default BabyStepsPathScreen;


