import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PracticeHomeScreen from './PracticeScreen';
import MissingLettersScreen from './missingLetters/MissingLettersScreen.tsx';

export type PracticeStackParamList = {
  PracticeHome: undefined;
  MissingLetters: undefined;
};

const Stack = createNativeStackNavigator<PracticeStackParamList>();

function PracticeNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="PracticeHome"
        component={PracticeHomeScreen}
        options={{ title: 'Practice' }}
      />
      <Stack.Screen
        name="MissingLetters"
        component={MissingLettersScreen}
        options={{ title: 'Missing letters', headerShown: true }}
      />
    </Stack.Navigator>
  );
}

export default PracticeNavigator;


