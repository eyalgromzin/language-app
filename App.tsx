/**
 * Start screen: bottom tab navigator with two tabs
 * @format
 */

import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, useColorScheme, TouchableOpacity, Text, Modal, View, StyleSheet, Share, ActivityIndicator, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WordCategoriesProvider } from './src/contexts/WordCategoriesContext';
import HomeScreen from './src/screens/Home/HomeScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import SurfScreen from './src/screens/Surf/SurfScreen';
import MyWordsScreen from './src/screens/MyWords/MyWordsScreen';
import LibraryScreen from './src/screens/Library/LibraryScreen';
import PracticeNavigator from './src/screens/practice/PracticeNavigator';
import BooksNavigator from './src/screens/Books/BooksNavigator';
import LoginScreen from './src/screens/Auth/LoginScreen';
import { enableScreens } from 'react-native-screens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StartupScreen from './src/screens/Startup/StartupScreen';
import WordsByCategoriesScreen from './src/screens/wordsByCategories/WordsByCategoriesScreen';
import VideoScreen from './src/screens/Video/VideoScreen';
import BabyStepsPathScreen from './src/screens/BabySteps/BabyStepsPathScreen';
import BabyStepRunnerScreen from './src/screens/BabySteps/BabyStepRunnerScreen';
import ContactUsScreen from './src/screens/ContactUs/ContactUsScreen';
import ProgressScreen from './src/screens/Progress/ProgressScreen';
import linkingService from './src/services/linkingService';

enableScreens();

type RootTabParamList = {
  Surf: undefined;
  Video: { resetAt?: number; youtubeUrl?: string; youtubeTitle?: string } | undefined;
  Practice: undefined;
  BabySteps: undefined;
  Categories: undefined;
  Library: undefined;
  Books: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

type RootStackParamList = {
  Startup: undefined;
  Login: undefined;
  Main: undefined;
  Settings: undefined;
  Home: undefined;
  MyWords: undefined;
  BabyStepsPath: undefined;
  BabyStepRunner: { stepIndex: number } | undefined;
  ContactUs: undefined;
  Progress: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs(): React.JSX.Element {
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const currentTabNavRef = React.useRef<any>(null);
  const [videoKey, setVideoKey] = React.useState<number>(0);
  const [initialTabRouteName, setInitialTabRouteName] = React.useState<keyof RootTabParamList | null>(null);

  // Handle deep links
  React.useEffect(() => {
    const handleDeepLink = (url: string) => {
      if (!url) return;
      
      const linkData = linkingService.parseAppLink(url);
      if (!linkData) return;

      if (linkData.type === 'video') {
        // Navigate to Video tab with the video URL
        currentTabNavRef.current?.navigate('Video', {
          youtubeUrl: linkData.url,
          youtubeTitle: linkData.title,
        });
      } else if (linkData.type === 'surf') {
        // Navigate to Surf tab with the URL
        currentTabNavRef.current?.navigate('Surf');
        // We'll need to pass the URL to Surf screen via a different mechanism
        // For now, we'll store it in AsyncStorage and let Surf screen pick it up
        AsyncStorage.setItem('surf.deepLinkUrl', linkData.url).catch(() => {});
      }
    };

    // Check for initial URL when app starts
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleShare = React.useCallback(async () => {
    try {
      await Share.share({
        message:
          'I am learning languages with LanguageLearn! Give it a try and see if it helps you too.',
      });
    } catch {
      // no-op
    } finally {
      setMenuOpen(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const savedTab = await AsyncStorage.getItem('last.active.tab');
        if (!isMounted) return;
        const validTabs: Array<keyof RootTabParamList> = ['Surf', 'Video', 'Practice', 'BabySteps', 'Categories', 'Library', 'Books'];
        if (savedTab && validTabs.includes(savedTab as keyof RootTabParamList)) {
          setInitialTabRouteName(savedTab as keyof RootTabParamList);
        } else {
          setInitialTabRouteName('BabySteps');
        }
      } catch {
        if (!isMounted) return;
        setInitialTabRouteName('BabySteps');
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {initialTabRouteName === null ? null : (
      <Tab.Navigator
        initialRouteName={initialTabRouteName}
        screenOptions={({ route, navigation }) => {
          currentTabNavRef.current = navigation;
          return {
            headerShown: true,
            // Force single-line header titles
            headerTitle: ({ children }: any) => (
              <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 17, fontWeight: '600' }}>
                {children}
              </Text>
            ),
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
              const iconNameByRoute: Record<string, string> = {
                Surf: 'globe-outline',
                Video: 'videocam-outline',
                Practice: 'trophy-outline',
                BabySteps: 'footsteps-outline',
                Categories: 'grid-outline',
                Library: 'albums-outline',
                Books: 'book-outline',
              };
              const iconName = iconNameByRoute[route.name] ?? 'ellipse-outline';
              return (
                <Ionicons
                  name={iconName}
                  size={size}
                  color={color}
                />
              );
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#999999',
          };
        }}
        screenListeners={({ route }) => ({
          focus: () => {
            AsyncStorage.setItem('last.active.tab', route.name).catch(() => {});
          },
        })}
      >
        <Tab.Screen name="Surf" component={SurfScreen} />
        <Tab.Screen
          key={`Video-${videoKey}`}
          name="Video"
          component={VideoScreen}
          listeners={({ navigation, route }) => ({
            tabPress: (e) => {
              e.preventDefault();
              setVideoKey((k) => k + 1);
              navigation.navigate('Video', { resetAt: Date.now() });
              AsyncStorage.setItem('last.active.tab', route.name).catch(() => {});
            },
          })}
        />
        <Tab.Screen
          name="Practice"
          component={PracticeNavigator}
          options={({ route }) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? 'PracticeHome';
            const isNestedDetail = routeName !== 'PracticeHome';
            return {
              // Hide parent header for nested detail screens to avoid double headers
              headerShown: !isNestedDetail,
            };
          }}
        />
        <Tab.Screen name="BabySteps" component={BabyStepsPathScreen} options={{ title: 'Baby Steps' }} />
        <Tab.Screen name="Categories" component={WordsByCategoriesScreen} options={{ title: 'Categories' }} />
        <Tab.Screen name="Books" component={BooksNavigator} options={{ title: 'Books' }} />
        <Tab.Screen name="Library" component={LibraryScreen} options={{ title: 'Library' }} />
      </Tab.Navigator>
      )}

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
            <TouchableOpacity style={styles.menuItem} onPress={() => { currentTabNavRef.current?.getParent()?.navigate('MyWords'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>My Words</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { currentTabNavRef.current?.getParent()?.navigate('Progress'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { currentTabNavRef.current?.getParent()?.navigate('Settings'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
              <Text style={styles.menuItemText}>Share App</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { currentTabNavRef.current?.getParent()?.navigate('BabyStepsPath'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>Baby Steps Path</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { currentTabNavRef.current?.getParent()?.navigate('ContactUs'); setMenuOpen(false); }}>
              <Text style={styles.menuItemText}>Contact Us</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

// Loading screen component
function LoadingScreen(): React.JSX.Element {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

// Main navigation component that uses auth context
function AppNavigator(): React.JSX.Element {
  const { isLoading, isAuthenticated, isSetupCompleted, hasCheckedAuth } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

  // Show loading screen while checking authentication or during actual loading
  if (isLoading || !hasCheckedAuth) {
    return <LoadingScreen />;
  }

  // Configure deep linking
  const linking = {
    prefixes: ['https://hellolingo.app', 'http://hellolingo.app'],
    config: {
      screens: {
        Main: 'Main',
      },
    },
    async getInitialURL() {
      // Check if app was opened from a deep link
      const url = await Linking.getInitialURL();
      return url;
    },
    subscribe(listener: (url: string) => void) {
      const onReceiveURL = ({ url }: { url: string }) => listener(url);
      
      // Listen to incoming links from deep linking
      const subscription = Linking.addEventListener('url', onReceiveURL);
      
      return () => {
        subscription?.remove();
      };
    },
  };

  return (
    <NavigationContainer linking={linking} theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          isSetupCompleted ? (
            // Fully authenticated and setup complete - show main app
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true }} />
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: true }} />
              <Stack.Screen name="MyWords" component={MyWordsScreen} options={{ title: 'My Words', headerShown: true }} />
              <Stack.Screen name="BabyStepsPath" component={BabyStepsPathScreen} options={{ title: 'Baby Steps Path', headerShown: true }} />
              <Stack.Screen name="BabyStepRunner" component={BabyStepRunnerScreen} options={{ title: 'Baby Step', headerShown: true }} />
              <Stack.Screen name="ContactUs" component={ContactUsScreen} options={{ title: 'Contact Us', headerShown: true }} />
              <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress', headerShown: true }} />
            </>
          ) : (
            // Authenticated but setup not complete - show startup screen
            <Stack.Screen name="Startup" component={StartupScreen} />
          )
        ) : (
          // Not authenticated - show login screen only after auth check is complete
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <WordCategoriesProvider>
        <AppNavigator />
      </WordCategoriesProvider>
    </AuthProvider>
  );
}

export default App;
