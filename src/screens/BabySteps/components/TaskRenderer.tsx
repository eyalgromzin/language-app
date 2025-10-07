import React from 'react';
import { RunnerTask } from '../types';
import Choose1OutOfN from '../../practice/choose1OutOfN/Choose1OutOfN';
import HearingPracticeScreen from '../../practice/hearing/HearingPracticeScreen';
import WordMissingLettersScreen from '../../practice/MissingLettersScreen/missingLettersScreen';
import WriteWordScreen from '../../practice/writeWord/WriteWordScreen';
import MissingWordsScreen from '../../practice/missingWords/MissingWordsScreen';
import FormulateSentenseScreen from '../../practice/formulateSentense/FormulateSentenseScreen';
import { cleanSentense } from '../utils';

interface TaskRendererProps {
  current: RunnerTask;
  currentIdx: number;
  onCorrectAnswer: () => void;
  onWrongAnswer: () => void;
  onAdvance: () => void;
  onRequeueTask: () => void;
}

const TaskRenderer: React.FC<TaskRendererProps> = ({
  current,
  currentIdx,
  onCorrectAnswer,
  onWrongAnswer,
  onAdvance,
  onRequeueTask,
}) => {
  const handleTaskComplete = (isCorrect: boolean) => {
    if (isCorrect) {
      onCorrectAnswer();
    } else {
      onWrongAnswer();
      onRequeueTask();
    }
    onAdvance();
  };

  if (current.kind === 'chooseTranslation') {
    return (
      <Choose1OutOfN
        embedded
        translation={current.sourceWord}
        correctWord={current.correctTranslation}
        options={current.options}
        onFinished={handleTaskComplete}
      />
    );
  }

  if (current.kind === 'chooseWord') {
    return (
      <Choose1OutOfN
        embedded
        translation={current.translation}
        correctWord={current.correctWord}
        options={current.options}
        onFinished={handleTaskComplete}
      />
    );
  }

  if (current.kind === 'hearing') {
    return (
      <HearingPracticeScreen
        embedded
        sourceWord={current.sourceWord}
        correctTranslation={current.correctTranslation}
        options={current.options}
        onFinished={handleTaskComplete}
      />
    );
  }

  if (current.kind === 'translationMissingLetters') {
    return (
      <WordMissingLettersScreen
        embedded
        mode="translation"
        word={current.word}
        translation={current.translation}
        missingIndices={current.inputIndices}
        onFinished={handleTaskComplete}
      />
    );
  }

  if (current.kind === 'wordMissingLetters') {
    return (
      <WordMissingLettersScreen
        embedded
        word={current.word}
        translation={current.translation}
        missingIndices={current.missingIndices}
        onFinished={handleTaskComplete}
      />
    );
  }

  if (current.kind === 'writeWord') {
    return (
      <WriteWordScreen
        embedded
        word={current.word}
        translation={current.translation}
        missingIndices={current.missingIndices}
        onFinished={handleTaskComplete}
      />
    );
  }

  if (current.kind === 'missingWords') {
    return (
      <MissingWordsScreen
        embedded
        sentence={current.sentence}
        translatedSentence={current.translatedSentence}
        tokens={current.tokens}
        missingIndices={current.missingIndices}
        wordBank={current.wordBank}
        onFinished={handleTaskComplete}
      />
    );
  }

  if (current.kind === 'formulateSentense') {
    return (
      <FormulateSentenseScreen
        key={`formulate-${currentIdx}-${current.itemId}`}
        embedded
        sentence={cleanSentense(current.sentence)}
        translatedSentence={cleanSentense(current.translatedSentence)}
        tokens={current.tokens}
        shuffledTokens={current.shuffledTokens}
        itemId={current.itemId}
        onFinished={handleTaskComplete}
      />
    );
  }

  return null;
};

export default TaskRenderer;
