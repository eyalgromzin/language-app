/**
 * Start screen: bottom tab navigator with two tabs
 * @format
 */

import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, useColorScheme, TouchableOpacity, Text, Modal, View, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/Home/HomeScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import SurfScreen from './src/screens/Surf/SurfScreen';
import MyWordsScreen from './src/screens/MyWords/MyWordsScreen';
import PracticeNavigator from './src/screens/practice/PracticeNavigator';
import LoginScreen from './src/screens/Auth/LoginScreen';
import { enableScreens } from 'react-native-screens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StartupScreen from './src/screens/Startup/StartupScreen';

enableScreens();

type RootTabParamList = {
  Home: undefined;
  Settings: undefined;
  Surf: undefined;
  MyWords: undefined;
  Practice: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

type RootStackParamList = {
  Startup: undefined;
  Login: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs(): React.JSX.Element {
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const currentTabNavRef = React.useRef<any>(null);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => {
          currentTabNavRef.current = navigation;
          return {
            headerShown: true,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => setMenuOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
                style={{ paddingHorizontal: 16 }}
              >
                <Text style={{ fontSize: 24, lineHeight: 24 }}>☰</Text>
              </TouchableOpacity>
            ),
            tabBarIcon: ({ color, size }) => {
              const iconByRoute: Record<string, string> = {
                Home: '🏠',
                Surf: '🌐',
                MyWords: '📝',
                Practice: '🎯',
                Settings: '⚙️',
              };
              const glyph = iconByRoute[route.name] || '•';
              return <Text style={{ fontSize: size, color }} accessible accessibilityLabel={`${route.name} tab`}>
                {glyph}
              </Text>;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#999999',
          };
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Surf" component={SurfScreen} />
        <Tab.Screen name="Practice" component={PracticeNavigator} options={{ headerShown: false }} />
        <Tab.Screen name="MyWords" component={MyWordsScreen} options={{ title: 'My Words' }} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>

      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuOpen(false)} />
          <View style={styles.menuPanel}>
            <Text style={styles.menuTitle}>Menu</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => { currentTabNavRef.current?.navigate('Home'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { currentTabNavRef.current?.navigate('Surf'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>Surf</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { currentTabNavRef.current?.navigate('MyWords'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>My Words</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { currentTabNavRef.current?.navigate('Practice'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>Practice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { currentTabNavRef.current?.navigate('Settings'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.menuClose]} onPress={() => setMenuOpen(false)}>
              <Text style={[styles.menuItemText, styles.menuCloseText]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuPanel: {
    marginTop: 48,
    marginLeft: 12,
    width: 220,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuClose: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  menuCloseText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

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
