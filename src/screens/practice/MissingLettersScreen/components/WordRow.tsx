import React from 'react';
import { StyleSheet, Text, TextInput, View, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { MissingLetterCell } from './MissingLetterCell';
import { WordGroup } from '../utils/missingLettersUtils';

type WordRowProps = {
  letters: string[];
  missingIndices: number[];
  inputs: Record<number, string>;
  wrongHighlightIndex: number | null;
  inputRefs: React.MutableRefObject<Record<number, TextInput | null>>;
  onChangeInput: (index: number, value: string) => void;
  onKeyPressLetter: (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  wordGroups: WordGroup[];
};

export const WordRow = React.memo(({
  letters,
  missingIndices,
  inputs,
  wrongHighlightIndex,
  inputRefs,
  onChangeInput,
  onKeyPressLetter,
  wordGroups,
}: WordRowProps) => {
  const renderLetterCell = (ch: string, idx: number) => {
    const isMissing = missingIndices.includes(idx);
    const isWrongSpot = wrongHighlightIndex === idx;
    const showAsCorrected = wrongHighlightIndex !== null;
    const value = inputs[idx] ?? '';

    return (
      <MissingLetterCell
        key={idx}
        char={ch}
        index={idx}
        isMissing={isMissing}
        value={value}
        showAsCorrected={showAsCorrected}
        isWrongSpot={isWrongSpot}
        inputRefs={inputRefs}
        onChangeText={onChangeInput}
        onKeyPress={onKeyPressLetter}
      />
    );
  };

  const renderWordGroup = (group: WordGroup, groupIndex: number) => {
    return (
      <View key={`word-${groupIndex}`} style={styles.wordGroup}>
        {group.letters.map((ch, localIdx) => {
          const globalIdx = group.startIdx + localIdx;
          return renderLetterCell(ch, globalIdx);
        })}
      </View>
    );
  };

  const result: React.ReactNode[] = [];
  
  wordGroups.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      const spaceIdx = group.startIdx - 1;
      if (spaceIdx >= 0 && letters[spaceIdx] === ' ') {
        result.push(
          <Text key={`space-${spaceIdx}`} style={styles.spaceText}> </Text>
        );
      }
    }
    result.push(renderWordGroup(group, groupIndex));
  });

  return (
    <View style={styles.wordRow}>
      {result}
    </View>
  );
});

WordRow.displayName = 'WordRow';

const styles = StyleSheet.create({
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordGroup: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    alignItems: 'center',
  },
  spaceText: {
    fontSize: 20,
    width: 12,
  },
});
