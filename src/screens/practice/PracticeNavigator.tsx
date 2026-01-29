import React from 'react';
import { Text, Pressable, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from '../../hooks/useTranslation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PracticeHomeScreen from './PracticeScreen.tsx';
import WordMissingLettersScreen from './MissingLettersScreen/missingLettersScreen.tsx';
import MissingWordsScreen from './missingWords/MissingWordsScreen.tsx';
import WordsMatchScreen from './wordsMatch/WordsMatchScreen.tsx';
// Removed separate chooseTranslation screen; both routes use Choose1OutOfN
import Choose1OutOfN from './choose1OutOfN/Choose1OutOfN.tsx';
import MemoryGameScreen from './memoryGame/MemoryGameScreen.tsx';
import HearingPracticeScreen from './hearing/HearingPracticeScreen.tsx';
import FormulateSentenseScreen from './formulateSentense/FormulateSentenseScreen.tsx';
import FlipCardsScreen from './flipCards/flipCards.tsx';

type SurpriseParam = { surprise?: boolean } | undefined;
type ModeParam = { surprise?: boolean; mode?: 'word' | 'translation' } | undefined;

export type PracticeStackParamList = {
  PracticeHome: undefined;
  MissingLetters: ModeParam;
  MissingWords: SurpriseParam;
  WordsMatch: SurpriseParam;
  Translate: ModeParam;
  ChooseWord: SurpriseParam;
  ChooseTranslation: SurpriseParam;
  MemoryGame: SurpriseParam;
  HearingPractice: SurpriseParam;
  FormulateSentense: SurpriseParam;
  FlipCards: SurpriseParam;
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
  'HearingPractice',
  'FormulateSentense',
  'FlipCards',
];

function navigateToRandomGame(
  navigation: any,
  currentRouteName?: keyof PracticeStackParamList
): void {
  const choices = RANDOM_GAME_ROUTES.filter((name) => name !== currentRouteName);
  const target = choices[Math.floor(Math.random() * choices.length)];
  const params: any = { surprise: true };
  if (target === 'Translate') params.mode = 'translation';
  if (target === 'MissingLetters') params.mode = 'word';
  navigation.navigate(target as never, params as never);
}

function createBackButton(navigation: any) {
  return () => (
    <Pressable
      onPress={() => navigation.navigate('PracticeHome')}
      style={{ marginLeft: Platform.OS === 'ios' ? 8 : 0, padding: 8 }}
      accessibilityRole="button"
      accessibilityLabel="Go back to practice screen"
    >
      <Ionicons 
        name="chevron-back" 
        size={24} 
        color={Platform.OS === 'ios' ? '#007AFF' : '#000'} 
      />
    </Pressable>
  );
}

function PracticeNavigator(): React.JSX.Element {
  const { t } = useTranslation();
  
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
              accessibilityLabel={t('screens.practice.surpriseMe')}
            >
              <Text style={{ fontSize: 18 }}>🎲</Text>
            </Pressable>
          ) : undefined,
      })}
    >
      <Stack.Screen
        name="PracticeHome"
        component={PracticeHomeScreen}
        options={{ title: t('screens.practice.title') }}
      />
      <Stack.Screen
        name="MissingLetters"
        component={WordMissingLettersScreen}
        options={({ navigation }) => ({
          title: t('screens.practice.missingLetters'),
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerLeft: createBackButton(navigation),
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        })}
        initialParams={{ mode: 'word' }}
      />
      <Stack.Screen
        name="MissingWords"
        component={MissingWordsScreen}
        options={({ navigation }) => ({
          title: t('screens.practice.missingWords'),
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerLeft: createBackButton(navigation),
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name="WordsMatch"
        component={WordsMatchScreen}
        options={({ navigation }) => ({
          title: t('screens.practice.matchGame'),
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerLeft: createBackButton(navigation),
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name="Translate"
        component={WordMissingLettersScreen}
        options={({ navigation }) => ({
          title: t('screens.practice.translate'),
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerLeft: createBackButton(navigation),
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        })}
        initialParams={{ mode: 'translation' }}
      />
      <Stack.Screen
        name="ChooseWord"
        component={Choose1OutOfN}
        options={({ navigation }) => ({
          title: t('screens.practice.chooseWord'),
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerLeft: createBackButton(navigation),
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name="ChooseTranslation"
        component={Choose1OutOfN}
        options={({ navigation }) => ({
          title: t('screens.practice.chooseTranslation'),
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerLeft: createBackButton(navigation),
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name="MemoryGame"
        component={MemoryGameScreen}
        options={({ navigation }) => ({
          title: t('screens.practice.memoryGame'),
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerLeft: createBackButton(navigation),
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name="HearingPractice"
        component={HearingPracticeScreen}
        options={({ navigation }) => ({
          title: t('screens.practice.hearingPractice'),
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerLeft: createBackButton(navigation),
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name="FormulateSentense"
        component={FormulateSentenseScreen}
        options={({ navigation }) => ({
          title: t('screens.practice.formulateSentence'),
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerLeft: createBackButton(navigation),
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        })}
      />
      <Stack.Screen
        name="FlipCards"
        component={FlipCardsScreen}
        options={({ navigation }) => ({
          title: t('screens.practice.flipCards'),
          headerShown: true,
          headerLargeTitle: false,
          headerBackTitle: '',
          headerLeft: createBackButton(navigation),
          headerTitle: (props) => (
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
              {props?.children}
            </Text>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

export default PracticeNavigator;


