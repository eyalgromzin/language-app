import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
};

const VISIBLE_ROWS_AROUND_ACTIVE = 10;
const INITIAL_VISIBLE_ROWS = 20;

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
  isFullScreen,
  onToggleFullScreen,
}) => {
  // Store full transcript in memory
  const fullTranscriptRef = React.useRef<TranscriptSegment[]>([]);
  
  // Clear transcript when video changes
  React.useEffect(() => {
    fullTranscriptRef.current = [];
  }, [videoId]);
  
  // Update full transcript when it changes
  React.useEffect(() => {
    if (transcript.length > 0) {
      fullTranscriptRef.current = transcript;
    }
  }, [transcript]);

  // Calculate visible range: VISIBLE_ROWS_AROUND_ACTIVE lines above and below activeIndex
  const visibleTranscript = React.useMemo(() => {
    const fullTranscript = fullTranscriptRef.current.length > 0 ? fullTranscriptRef.current : transcript;
    if (fullTranscript.length === 0) return [];
    
    if (activeIndex === null) {
      // If no active index, show first INITIAL_VISIBLE_ROWS lines
      return fullTranscript.slice(0, INITIAL_VISIBLE_ROWS).map((seg, idx) => ({ segment: seg, originalIndex: idx }));
    }
    
    const startIndex = Math.max(0, activeIndex - VISIBLE_ROWS_AROUND_ACTIVE);
    const endIndex = Math.min(fullTranscript.length, activeIndex + VISIBLE_ROWS_AROUND_ACTIVE + 1); // +1 to include the active line
    
    return fullTranscript.slice(startIndex, endIndex).map((seg, idx) => ({
      segment: seg,
      originalIndex: startIndex + idx,
    }));
  }, [transcript, activeIndex]);

  if (!videoId) return null;
  return (
    <View style={{ marginTop: 16, marginBottom: 16 }}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Transcript</Text>
        <TouchableOpacity
          onPress={onToggleFullScreen}
          style={styles.fullScreenButton}
          accessibilityRole="button"
          accessibilityLabel={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons 
            name={isFullScreen ? 'contract' : 'expand'} 
            size={20} 
            color="#64748b" 
          />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.helper}>Fetching transcript…</Text>
        </View>
      ) : error ? (
        <Text style={[styles.helper, { color: '#cc3333' }]}>{error}</Text>
      ) : (fullTranscriptRef.current.length > 0 || transcript.length > 0) ? (
        <ScrollView style={[styles.transcriptBox, isFullScreen && styles.transcriptBoxFullScreen]} ref={scrollViewRef} nestedScrollEnabled>
          {visibleTranscript.map(({ segment: seg, originalIndex }) => {
            const tokens = tokenizeTranscriptLine(seg.text);
            return (
              <View
                key={`${seg.offset}-${originalIndex}`}
                onLayout={(e) => {
                  const y = e.nativeEvent.layout.y;
                  lineOffsetsRef.current[originalIndex] = y;
                }}
              >
                <Text style={styles.transcriptTime}>{formatTimestamp(seg.offset)}</Text>
                <Text
                  style={[
                    styles.transcriptLine,
                    activeIndex === originalIndex ? styles.transcriptLineActive : null,
                  ]}
                >
                  {tokens.map((tok, tIdx) => {
                    const key = `${originalIndex}:${tIdx}`;
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  fullScreenButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  transcriptBoxFullScreen: {
    maxHeight: 300,
  },
  transcriptLine: {
    fontSize: 17,
    color: '#222',
    lineHeight: 26,
    marginBottom: 8,
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


