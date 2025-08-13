import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PracticeHomeScreen from './PracticeScreen';
import WordMissingLettersScreen from './wordMissingLetters/WordMissingLettersScreen.tsx';
import MissingWordsScreen from './missingWords/MissingWordsScreen.tsx';
import WordsMatchScreen from './wordsMatch/WordsMatchScreen.tsx';
import chooseTranslationScreen from './chooseTranslation/chooseTranslationScreen.tsx';
import translationMissingLetters from './translationMissingLetters/TranslationMissingLetters.tsx';
import ChooseWordScreen from './chooseWord/ChooseWordScreen.tsx';
import WriteWordScreen from './writeWord/WriteWordScreen.tsx';

export type PracticeStackParamList = {
  PracticeHome: undefined;
  MissingLetters: undefined;
  MissingWords: undefined;
  WordsMatch: undefined;
  Translate: undefined;
  ChooseWord: undefined;
  ChooseTranslation: undefined;
  WriteWord: undefined;
};

const Stack = createNativeStackNavigator<PracticeStackParamList>();

function PracticeNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerLargeTitle: false,
        // headerBackTitleVisible is not supported in native-stack; use headerBackTitle instead
        headerBackTitle: '',
      }}
    >
      <Stack.Screen
        name="PracticeHome"
        component={PracticeHomeScreen}
        options={{ title: 'Practice' }}
      />
      <Stack.Screen
        name="MissingLetters"
        component={WordMissingLettersScreen}
        options={{
          title: 'Missing letters',
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="MissingWords"
        component={MissingWordsScreen}
        options={{
          title: 'Missing words',
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="WordsMatch"
        component={WordsMatchScreen}
        options={{
          title: 'Match game',
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="Translate"
        component={translationMissingLetters}
        options={{
          title: 'Translate',
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="WriteWord"
        component={WriteWordScreen}
        options={{
          title: 'Write the word',
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="ChooseWord"
        component={ChooseWordScreen}
        options={{
          title: 'Choose word',
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        }}
      />
      <Stack.Screen
        name="ChooseTranslation"
        component={chooseTranslationScreen}
        options={{
          title: 'Choose translation',
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

export default PracticeNavigator;


