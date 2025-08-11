/**
 * Start screen: bottom tab navigator with two tabs
 * @format
 */

import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, useColorScheme } from 'react-native';
import HomeScreen from './src/screens/Home/HomeScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import SurfScreen from './src/screens/Surf/SurfScreen';
import LoginScreen from './src/screens/Auth/LoginScreen';
import { enableScreens } from 'react-native-screens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StartupScreen from './src/screens/Startup/StartupScreen';

enableScreens();

type RootTabParamList = {
  Home: undefined;
  Settings: undefined;
  Surf: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

type RootStackParamList = {
  Startup: undefined;
  Login: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
      <Tab.Screen name="Surf" component={SurfScreen} />
    </Tab.Navigator>
  );
}

function App(): React.JSX.Element | null {
  const isDarkMode = useColorScheme() === 'dark';
  const [initialized, setInitialized] = React.useState<boolean>(false);
  const [needsSetup, setNeedsSetup] = React.useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const completed = await AsyncStorage.getItem('setup.completed');
        if (!isMounted) return;
        setNeedsSetup(completed !== 'true');
      } catch {
        if (!isMounted) return;
        setNeedsSetup(true);
      } finally {
        if (!isMounted) return;
        setInitialized(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!initialized) {
    return null;
  }
  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {needsSetup ? (
        <Stack.Navigator initialRouteName="Startup">
          <Stack.Screen name="Startup" component={StartupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default App;
