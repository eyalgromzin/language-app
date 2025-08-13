import React from 'react';
import { Text, Pressable } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PracticeHomeScreen from './PracticeScreen';
import WordMissingLettersScreen from './wordMissingLetters/WordMissingLettersScreen.tsx';
import MissingWordsScreen from './missingWords/MissingWordsScreen.tsx';
import WordsMatchScreen from './wordsMatch/WordsMatchScreen.tsx';
import chooseTranslationScreen from './chooseTranslation/chooseTranslationScreen.tsx';
import translationMissingLetters from './translationMissingLetters/TranslationMissingLetters.tsx';
import ChooseWordScreen from './chooseWord/ChooseWordScreen.tsx';
import WriteWordScreen from './writeWord/WriteWordScreen.tsx';
import MemoryGameScreen from './memoryGame/MemoryGameScreen.tsx';

type SurpriseParam = { surprise?: boolean } | undefined;

export type PracticeStackParamList = {
  PracticeHome: undefined;
  MissingLetters: SurpriseParam;
  MissingWords: SurpriseParam;
  WordsMatch: SurpriseParam;
  Translate: SurpriseParam;
  ChooseWord: SurpriseParam;
  ChooseTranslation: SurpriseParam;
  WriteWord: SurpriseParam;
  MemoryGame: SurpriseParam;
};

const Stack = createNativeStackNavigator<PracticeStackParamList>();

const RANDOM_GAME_ROUTES: Array<keyof PracticeStackParamList> = [
  'MissingLetters',
  'MissingWords',
  'WordsMatch',
  'Translate',
  'ChooseWord',
  'ChooseTranslation',
  'MemoryGame',
];

function navigateToRandomGame(
  navigation: any,
  currentRouteName?: keyof PracticeStackParamList
): void {
  const choices = RANDOM_GAME_ROUTES.filter((name) => name !== currentRouteName);
  const target = choices[Math.floor(Math.random() * choices.length)];
  navigation.navigate(target as never, { surprise: true } as never);
}

function PracticeNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: false,
        headerLargeTitle: false,
        // headerBackTitleVisible is not supported in native-stack; use headerBackTitle instead
        headerBackTitle: '',
        headerRight: () =>
          route.name !== 'PracticeHome' ? (
            <Pressable
              onPress={() =>
                navigateToRandomGame(
                  navigation,
                  route.name as keyof PracticeStackParamList
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Surprise me"
            >
              <Text style={{ fontSize: 18 }}>🎲</Text>
            </Pressable>
          ) : undefined,
      })}
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
      <Stack.Screen
        name="MemoryGame"
        component={MemoryGameScreen}
        options={{
          title: 'Memory game',
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


