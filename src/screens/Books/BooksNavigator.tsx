import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BooksScreen from './BooksScreen.tsx';
import BookReaderScreen from './BookReaderScreen.tsx';

export type BooksStackParamList = {
  BooksHome: undefined;
  BookReader: { id: string };
};

const Stack = createNativeStackNavigator<BooksStackParamList>();

function BooksNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerLargeTitle: false,
        headerBackTitle: '',
        headerTitle: (props) => (
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
            {props?.children}
          </Text>
        ),
      }}
    >
      <Stack.Screen name="BooksHome" component={BooksScreen} options={{ title: 'Books' }} />
      <Stack.Screen name="BookReader" component={BookReaderScreen} options={{ title: 'Reader' }} />
    </Stack.Navigator>
  );
}

export default BooksNavigator;


