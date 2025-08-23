import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { tokenizeTranscriptLine, formatTimestamp, type TranscriptSegment } from './videoMethods';

type TranscriptProps = {
  videoId: string;
  loading: boolean;
  error: string | null;
  transcript: TranscriptSegment[];
  activeIndex: number | null;
  selectedWordKey: string | null;
  onWordPress: (payload: { key: string; segmentOffset: number; word: string; sentence: string }) => void;
  scrollViewRef: React.RefObject<any>;
  lineOffsetsRef: React.MutableRefObject<Record<number, number>>;
};

const Transcript: React.FC<TranscriptProps> = ({
  videoId,
  loading,
  error,
  transcript,
  activeIndex,
  selectedWordKey,
  onWordPress,
  scrollViewRef,
  lineOffsetsRef,
}) => {
  if (!videoId) return null;
  return (
    <View style={{ marginTop: 16, marginBottom: 16 }}>
      <Text style={styles.sectionTitle}>Transcript</Text>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.helper}>Fetching transcript…</Text>
        </View>
      ) : error ? (
        <Text style={[styles.helper, { color: '#cc3333' }]}>{error}</Text>
      ) : transcript.length > 0 ? (
        <ScrollView style={styles.transcriptBox} ref={scrollViewRef} nestedScrollEnabled>
          {transcript.map((seg, index) => {
            const tokens = tokenizeTranscriptLine(seg.text);
            return (
              <View
                key={`${seg.offset}-${index}`}
                onLayout={(e) => {
                  const y = e.nativeEvent.layout.y;
                  lineOffsetsRef.current[index] = y;
                }}
              >
                <Text style={styles.transcriptTime}>{formatTimestamp(seg.offset)}</Text>
                <Text
                  style={[
                    styles.transcriptLine,
                    activeIndex === index ? styles.transcriptLineActive : null,
                  ]}
                >
                  {tokens.map((tok, tIdx) => {
                    const key = `${index}:${tIdx}`;
                    if (!tok.isWord) {
                      return (
                        <Text key={key}>
                          {tok.value}
                        </Text>
                      );
                    }
                    const isSelected = selectedWordKey === key;
                    return (
                      <Text
                        key={key}
                        onPress={() => onWordPress({ key, segmentOffset: seg.offset, word: tok.value, sentence: seg.text })}
                        style={isSelected ? styles.transcriptWordSelected : undefined}
                      >
                        {tok.value}
                      </Text>
                    );
                  })}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.helper}>No transcript lines to display.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  centered: {
    alignItems: 'center',
  },
  helper: {
    color: '#888',
    fontSize: 14,
  },
  transcriptBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    maxHeight: 230,
  },
  transcriptLine: {
    fontSize: 15,
    color: '#222',
    lineHeight: 22,
    marginBottom: 6,
  },
  transcriptLineActive: {
    color: '#007AFF',
    fontWeight: '700',
    backgroundColor: 'rgba(0,122,255,0.08)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  transcriptWordSelected: {
    backgroundColor: 'rgba(255,235,59,0.9)',
    borderRadius: 2,
  },
  transcriptTime: {
    color: '#666',
    fontSize: 12,
    marginBottom: 2,
  },
});

export default Transcript;


