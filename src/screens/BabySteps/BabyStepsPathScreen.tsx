import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, useColorScheme, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLangCode } from '../../utils/translation';

type StepItem = {
  id: string;
  title: string;
  items: any[];
};

type StepsFile = {
  language: string;
  overview?: string;
  steps: StepItem[];
};

const STEPS_BY_CODE: Record<string, StepsFile> = {
  en: require('./steps_en.json'),
  es: require('./steps_es.json'),
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

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const learningName = await AsyncStorage.getItem('language.learning');
        const code = getLangCode(learningName) || 'en';
        const file = STEPS_BY_CODE[code] || STEPS_BY_CODE['en'];
        if (!mounted) return;
        setSteps(file.steps || []);
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      <ScrollView contentContainerStyle={{ height: contentHeight }}>
        <View
          style={styles.canvas}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          {/* Connectors */}
          {positions.map((pos, idx) => {
            if (idx === 0) return null;
            const prev = positions[idx - 1];
            const x1 = prev.x + NODE_DIAMETER / 2;
            const y1 = prev.y + NODE_DIAMETER / 2;
            const x2 = pos.x + NODE_DIAMETER / 2;
            const y2 = pos.y + NODE_DIAMETER / 2;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angleRad = Math.atan2(dy, dx);
            const angleDeg = (angleRad * 180) / Math.PI;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            return (
              <View
                key={`line-${idx}`}
                style={[
                  styles.connector,
                  {
                    width: length,
                    transform: [
                      { translateX: midX - length / 2 },
                      { translateY: midY - 2 },
                      { rotate: `${angleDeg}deg` },
                    ],
                    backgroundColor: isDark ? '#4DA3FF' : '#007AFF',
                  },
                ]}
              />
            );
          })}

          {/* Nodes */}
          {steps.map((s, idx) => {
            const pos = positions[idx];
            return (
              <View key={s.id}
                style={[
                  styles.nodeContainer,
                  {
                    left: pos.x,
                    top: pos.y,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Step ${idx + 1}: ${s.title}`}
              >
                <View style={[styles.nodeCircle, { backgroundColor: isDark ? '#1A73E8' : '#E6F0FF', borderColor: isDark ? '#4DA3FF' : '#BBD6FF' }]}>
                  <Text style={[styles.nodeIndex, { color: isDark ? '#EAF3FF' : '#0A57CC' }]}>{idx + 1}</Text>
                </View>
                <Text numberOfLines={2} style={[styles.nodeTitle, { color: isDark ? '#f0f0f0' : '#222' }]}>{s.title}</Text>
              </View>
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
  connector: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
    opacity: 0.9,
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
  },
  nodeIndex: {
    fontSize: 20,
    fontWeight: '700',
  },
  nodeTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BabyStepsPathScreen;


