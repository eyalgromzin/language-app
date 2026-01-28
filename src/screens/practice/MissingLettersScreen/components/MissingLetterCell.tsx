import React from 'react';
import { StyleSheet, Text, TextInput, View, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

type MissingLetterCellProps = {
  char: string;
  index: number;
  isMissing: boolean;
  value: string;
  showAsCorrected: boolean;
  isWrongSpot: boolean;
  inputRefs: React.MutableRefObject<Record<number, TextInput | null>>;
  onChangeText: (index: number, value: string) => void;
  onKeyPress: (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
};

export const MissingLetterCell = React.memo(({
  char,
  index,
  isMissing,
  value,
  showAsCorrected,
  isWrongSpot,
  inputRefs,
  onChangeText,
  onKeyPress,
}: MissingLetterCellProps) => {
  const defaultCellWidth = 48;
  const defaultMissingWidth = 32;
  const dynamicFontSize = Math.min(20, Math.max(14, Math.floor(defaultCellWidth * 0.5)));

  if (!isMissing) {
    return (
      <Text style={[styles.cellText, { fontSize: dynamicFontSize }, isWrongSpot && styles.cellTextWrong]}>
        {char}
      </Text>
    );
  }

  return (
    <View style={[styles.cell, { width: defaultMissingWidth }, showAsCorrected && styles.cellFixed, isWrongSpot && styles.cellWrong]}>
      {showAsCorrected ? (
        <Text style={[styles.cellText, { fontSize: dynamicFontSize }]}>{char}</Text>
      ) : (
        <TextInput
          style={[styles.input, { fontSize: dynamicFontSize }]}
          ref={(r) => { inputRefs.current[index] = r; }}
          value={value}
          onChangeText={(t) => onChangeText(index, t)}
          onKeyPress={(e) => onKeyPress(index, e)}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={1}
        />
      )}
    </View>
  );
});

MissingLetterCell.displayName = 'MissingLetterCell';

const styles = StyleSheet.create({
  cell: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  cellFixed: {
    backgroundColor: '#f1f5f9',
    borderWidth: 0,
  },
  cellWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
    shadowColor: '#ef4444',
    shadowOpacity: 0.2,
  },
  cellText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  cellTextWrong: {
    color: '#ef4444',
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    padding: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
});
