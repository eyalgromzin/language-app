import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from './WelcomeScreen';
import LearningLanguageScreen from './LearningLanguageScreen';
import NativeLanguageScreen from './NativeLanguageScreen';
import PracticeSettingsScreen from './PracticeSettingsScreen';
import OnboardingCompletionScreen from './OnboardingCompletionScreen';

type OnboardingStackParamList = {
  Welcome: undefined;
  LearningLanguage: undefined;
  NativeLanguage: undefined;
  PracticeSettings: undefined;
  Completion: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

function OnboardingNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Welcome"
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="LearningLanguage" component={LearningLanguageScreen} />
      <Stack.Screen name="NativeLanguage" component={NativeLanguageScreen} />
      <Stack.Screen name="PracticeSettings" component={PracticeSettingsScreen} />
      <Stack.Screen name="Completion" component={OnboardingCompletionScreen} />
    </Stack.Navigator>
  );
}

export default OnboardingNavigator;
