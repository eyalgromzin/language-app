import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Alert, Platform, ToastAndroid, Keyboard, TextInput, ActionSheetIOS } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import harmfulWordsService from '../services/harmfulWordsService';
import { addUrlToLibrary } from '../config/api';
import { FAVOURITE_TYPES, toLanguageSymbol } from '../common';
import { useLanguage } from '../contexts/LanguageContext';
import { getChildrenStoriesWebsite } from '../constants/childrenStoriesWebsites';

export type FavouriteItem = { url: string; name: string; typeId?: number; typeName?: string; levelName?: string };


export const useSurfScreen = () => {
  const navigation = useNavigation<any>();
  const webViewRef = React.useRef<WebView>(null);
  const route = useRoute<any>();
  const initialUrlFromParams: string | undefined = typeof route?.params?.url === 'string' ? route.params.url : undefined;
  
  // Get languages from context
  const { learningLanguage, nativeLanguage } = useLanguage();
  
  // Helper function to convert language name to symbol
 
  
  // Get default homepage - use children's stories website if learning language is set, otherwise Google
  const getDefaultHomepage = (): string => {
    if (learningLanguage) {
      const languageSymbol = toLanguageSymbol(learningLanguage);
      const storiesWebsite = getChildrenStoriesWebsite(languageSymbol);
      if (storiesWebsite) {
        return storiesWebsite;
      }
    }
    return 'https://www.google.com';
  };
  
  // State
  const [addressText, setAddressText] = React.useState<string>(initialUrlFromParams || '');
  const [currentUrl, setCurrentUrl] = React.useState<string>(initialUrlFromParams || '');
  const [canGoBack, setCanGoBack] = React.useState<boolean>(false);
  const [favourites, setFavourites] = React.useState<FavouriteItem[]>([]);
  const [showFavouritesList, setShowFavouritesList] = React.useState<boolean>(false);
  const [showAddFavouriteModal, setShowAddFavouriteModal] = React.useState<boolean>(false);
  const [newFavName, setNewFavName] = React.useState<string>('');
  const [newFavUrl, setNewFavUrl] = React.useState<string>('');
  const [newFavTypeId, setNewFavTypeId] = React.useState<number | null>(null);
  const [showTypeOptions, setShowTypeOptions] = React.useState<boolean>(false);
  const [favTypeError, setFavTypeError] = React.useState<boolean>(false);
  const [newFavLevelName, setNewFavLevelName] = React.useState<string | null>(null);
  const [showLevelOptions, setShowLevelOptions] = React.useState<boolean>(false);
  const [favLevelError, setFavLevelError] = React.useState<boolean>(false);
  const [imageScrape, setImageScrape] = React.useState<null | { url: string; word: string }>(null);
  const [savedDomains, setSavedDomains] = React.useState<string[]>([]);
  const [isAddressFocused, setIsAddressFocused] = React.useState<boolean>(false);

  // Refs
  const imageScrapeResolveRef = React.useRef<((urls: string[]) => void) | null>(null);
  const imageScrapeRejectRef = React.useRef<((err?: unknown) => void) | null>(null);
  const hiddenWebViewRef = React.useRef<WebView>(null);
  const addressInputRef = React.useRef<TextInput>(null);

  // Constants
  const DOMAINS_KEY = 'surf.domains';
  const FAVOURITES_KEY = 'surf.favourites';
  const HOMEPAGE_KEY = 'surf.homepage';


  // Load saved domains
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DOMAINS_KEY);
        if (!mounted) return;
        const arr = JSON.parse(raw || '[]');
        setSavedDomains(Array.isArray(arr) ? (arr as string[]).filter(Boolean) : []);
      } catch {
        if (!mounted) return;
        setSavedDomains([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load favourites
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVOURITES_KEY);
        if (!mounted) return;
        const arr = JSON.parse(raw || '[]');
        if (Array.isArray(arr)) {
          const mapped: FavouriteItem[] = arr
            .map((it: any) => {
              if (typeof it === 'string') {
                const u = normalizeSurfUrl(it);
                const nm = getDomainFromUrlString(u) || u;
                return { url: u, name: nm } as FavouriteItem;
              }
              if (it && typeof it === 'object' && typeof it.url === 'string') {
                const u = normalizeSurfUrl(it.url);
                const nm = typeof it.name === 'string' && it.name.trim().length > 0 ? it.name : (getDomainFromUrlString(u) || u);
                const tid = typeof it.typeId === 'number' ? it.typeId : undefined;
                const tn = typeof it.typeName === 'string' ? it.typeName : (typeof tid === 'number' ? (FAVOURITE_TYPES.find(t => t.id === tid)?.name) : undefined);
                const ln = typeof it.levelName === 'string' ? validateLevel(it.levelName) : (typeof it.level === 'string' ? validateLevel(it.level) : undefined);
                return { url: u, name: nm, typeId: tid, typeName: tn, levelName: ln } as FavouriteItem;
              }
              return null;
            })
            .filter((x): x is FavouriteItem => !!x);
          setFavourites(mapped);
        } else {
          setFavourites([]);
        }
      } catch {
        if (!mounted) return;
        setFavourites([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load homepage
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        AsyncStorage.getAllKeys().then(async (keys) => {
          if(keys.includes(HOMEPAGE_KEY)) {
            const savedHomepage = await AsyncStorage.getItem(HOMEPAGE_KEY);
            if (!mounted) return;
            if (!initialUrlFromParams && typeof savedHomepage === 'string' && savedHomepage.trim().length > 0) {
              setAddressText(savedHomepage);
              setCurrentUrl(savedHomepage);
            } 
          } else {
            // No saved homepage, use children's stories website based on learning language
            const storiesHomepage = getDefaultHomepage();
            setAddressText(storiesHomepage);
            setCurrentUrl(storiesHomepage);
          }
        });
        
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [initialUrlFromParams, learningLanguage]);

  // Handle initial URL from params
  React.useEffect(() => {
    if (initialUrlFromParams) {
      const normalized = normalizeSurfUrl(initialUrlFromParams);
      setAddressText(normalized);
      setCurrentUrl(normalized);
    }
  }, [initialUrlFromParams]);

  // Utility functions
  const getDomainFromUrlString = (input: string): string | null => {
    try {
      const str = (input || '').trim();
      if (!str) return null;
      const m = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\/([^/]+)/.exec(str);
      const host = m ? m[1] : (/^www\./i.test(str) || /[^\s]+\.[^\s]{2,}/.test(str) ? str.split('/')[0] : null);
      if (!host) return null;
      const lower = host.toLowerCase();
      const noWww = lower.startsWith('www.') ? lower.slice(4) : lower;
      return noWww;
    } catch { return null; }
  };

  const normalizeSurfUrl = (input: string): string => {
    if (!input) return 'about:blank';
    const trimmed = input.trim();
    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
    const hasSpaces = /\s/.test(trimmed);
    const startsWithWww = /^www\./i.test(trimmed);
    const looksLikeDomain = /^[^\s]+\.[^\s]{2,}$/.test(trimmed);
    const looksLikeIp = /^\d{1,3}(\.\d{1,3}){3}(?::\d+)?(\/|$)/.test(trimmed);

    if (hasSpaces || (!hasScheme && !startsWithWww && !looksLikeDomain && !looksLikeIp)) {
      return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    }

    return hasScheme ? trimmed : `https://${trimmed}`;
  };

  const validateLevel = (l?: string | number | null): string => {
    const LEVELS = ['easy','easy-medium','medium','medium-hard','hard'] as const;
    if (typeof l === 'number') {
      const byIndex = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, l - 1))];
      return byIndex || 'easy';
    }
    const v = (l || '').toLowerCase().trim();
    return (LEVELS as readonly string[]).includes(v) ? v : 'easy';
  };

  const saveDomain = async (domain: string) => {
    const normalized = (domain || '').toLowerCase().replace(/^www\./, '');
    if (!normalized) return;
    setSavedDomains(prev => {
      const next = [normalized, ...prev.filter(d => d !== normalized)];
      const limited = next.slice(0, 100);
      AsyncStorage.setItem(DOMAINS_KEY, JSON.stringify(limited)).catch(() => {});
      return limited;
    });
  };

  const filteredDomains = React.useMemo(() => {
    const raw = (addressText || '').trim();
    if (raw.length === 0) return savedDomains.slice(0, 8);
    const withoutScheme = raw.replace(/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//, '');
    const fragment = withoutScheme.split('/')[0].toLowerCase().replace(/^www\./, '');
    if (!fragment) return savedDomains.slice(0, 8);
    return savedDomains.filter(d => d.startsWith(fragment)).slice(0, 8);
  }, [addressText, savedDomains]);

  // Action handlers
  const selectSuggestion = (domain: string) => {
    const url = normalizeSurfUrl(domain);
    setAddressText(url);
    setCurrentUrl(url);
    saveDomain(domain);
    setIsAddressFocused(false);
    try { addressInputRef.current?.blur(); } catch (e) {}
    try { Keyboard.dismiss(); } catch (e) {}
  };

  const submit = () => {
    const normalized = normalizeSurfUrl(addressText.trim());
    setCurrentUrl(normalized);
    const domain = getDomainFromUrlString(normalized);
    if (domain) saveDomain(domain);
    try { addressInputRef.current?.blur(); } catch (e) {}
    setIsAddressFocused(false);
    try { Keyboard.dismiss(); } catch (e) {}
  };

  const goBack = () => {
    try { webViewRef.current?.goBack(); } catch (e) {}
  };

  const saveFavourites = async (next: FavouriteItem[]) => {
    setFavourites(next);
    try { await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(next)); } catch {}
  };

  const refreshFavourites = async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVOURITES_KEY);
      const arr = JSON.parse(raw || '[]');
      if (Array.isArray(arr)) {
        const mapped: FavouriteItem[] = arr
          .map((it: any) => {
            if (typeof it === 'string') {
              const u = normalizeSurfUrl(it);
              const nm = getDomainFromUrlString(u) || u;
              return { url: u, name: nm } as FavouriteItem;
            }
            if (it && typeof it === 'object' && typeof it.url === 'string') {
              const u = normalizeSurfUrl(it.url);
              const nm = typeof it.name === 'string' && it.name.trim().length > 0 ? it.name : (getDomainFromUrlString(u) || u);
              const tid = typeof it.typeId === 'number' ? it.typeId : undefined;
              const tn = typeof it.typeName === 'string' ? it.typeName : (typeof tid === 'number' ? (FAVOURITE_TYPES.find(t => t.id === tid)?.name) : undefined);
              const ln = typeof it.levelName === 'string' ? validateLevel(it.levelName) : (typeof it.level === 'string' ? validateLevel(it.level) : undefined);
              return { url: u, name: nm, typeId: tid, typeName: tn, levelName: ln } as FavouriteItem;
            }
            return null;
          })
          .filter((x): x is FavouriteItem => !!x);
        setFavourites(mapped);
      } else {
        setFavourites([]);
      }
    } catch {
      setFavourites([]);
    }
  };

  const addToFavourites = async (url: string, name: string, typeId: number, typeName: string, levelName?: string | null) => {
    if (!url) return;
    
    try {
      const checkResult = await harmfulWordsService.checkUrl(url);
      if (checkResult.isHarmful) {
        const message = `This URL contains inappropriate content and cannot be added to favorites. Matched words: ${checkResult.matchedWords.join(', ')}`;
        if (Platform.OS === 'android') {
          ToastAndroid.show(message, ToastAndroid.LONG);
        } else {
          Alert.alert('Content Blocked', message);
        }
        return;
      }
    } catch (error) {
      console.error('Failed to check URL for harmful content:', error);
    }
    
    const normalized = normalizeSurfUrl(url);
    const safeName = (name || '').trim() || (getDomainFromUrlString(normalized) || normalized);
    const next: FavouriteItem[] = [
      { url: normalized, name: safeName, typeId, typeName, levelName: levelName ? validateLevel(levelName) : undefined },
      ...favourites.filter((f) => f.url !== normalized),
    ].slice(0, 200);
    await saveFavourites(next);
    
    // Also add to library if learning language is available
    if (learningLanguage) {
      try {
        const lang = toLanguageSymbol(learningLanguage);
        const safeLevel = levelName ? validateLevel(levelName) : 'easy';
        
        await addUrlToLibrary(normalized, typeName, safeLevel, safeName, lang, 'web');
      } catch (libraryError) {
        console.error('Failed to add URL to library:', libraryError);
        // Don't fail the entire operation if library addition fails
      }
    }
  };

  const removeFromFavourites = async (url: string) => {
    if (!url) return;
    const normalized = normalizeSurfUrl(url);
    const next = favourites.filter((f) => f.url !== normalized);
    await saveFavourites(next);
  };

  const promptFavourite = (url: string, alreadyFav: boolean) => {
    const normalized = normalizeSurfUrl(url);
    if (!normalized || normalized === 'about:blank') return;
    if (alreadyFav) {
      const onYes = async () => {
        await removeFromFavourites(normalized);
        if (Platform.OS === 'android') ToastAndroid.show('Removed from favourites', ToastAndroid.SHORT); else Alert.alert('Removed');
      };
      try {
        Alert.alert(
          'Favourites',
          'already in favourites, remove it ?',
          [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: onYes },
          ],
          { cancelable: true },
        );
      } catch {
        onYes();
      }
      return;
    }
    setNewFavUrl(normalized);
    const defaultName = getDomainFromUrlString(normalized) || normalized;
    setNewFavName(defaultName);
    setNewFavTypeId(null);
    setFavTypeError(false);
    setShowTypeOptions(false);
    setNewFavLevelName(null);
    setShowLevelOptions(false);
    setFavLevelError(false);
    setShowAddFavouriteModal(true);
  };

  const openOptionsMenu = () => {
    Keyboard.dismiss();
    const actions = [
      { title: 'Set homepage', onPress: () => promptSetHomepage() },
      { title: 'Favourites list', onPress: () => setShowFavouritesList(true) },
      { title: 'Cancel', onPress: () => {}, isCancel: true },
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: actions.map(a => a.title),
          cancelButtonIndex: actions.findIndex(a => a.isCancel),
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          const action = actions[buttonIndex];
          if (action && action.onPress) action.onPress();
        }
      );
      return;
    }
    try {
      Alert.alert(
        'Options',
        undefined,
        actions.map(a => ({ text: a.title, onPress: a.onPress, style: a.isCancel ? 'cancel' as const : undefined })),
        { cancelable: true },
      );
    } catch {
      setShowFavouritesList(true);
    }
  };

  const promptSetHomepage = () => {
    const urlToSave = normalizeSurfUrl(addressText.trim() || currentUrl);
    const confirmAndSave = async () => {
      try {
        await AsyncStorage.setItem(HOMEPAGE_KEY, urlToSave);
        if (Platform.OS === 'android') {
          ToastAndroid.show('Homepage set', ToastAndroid.SHORT);
        } else {
          Alert.alert('Homepage set');
        }
      } catch {
        if (Platform.OS === 'android') {
          ToastAndroid.show('Failed to set homepage', ToastAndroid.SHORT);
        } else {
          Alert.alert('Error', 'Failed to set homepage');
        }
      }
    };
    try {
      Alert.alert(
        'Set as Homepage',
        'do you want to set this website as homepage?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: confirmAndSave },
        ],
        { cancelable: true }
      );
    } catch {
      confirmAndSave();
    }
  };

  const postAddUrlToLibrary = async (url: string, typeName?: string, displayName?: string, level?: string) => {
    try {
      const normalizedUrl = normalizeSurfUrl(url);
      
      const harmfulCheck = await harmfulWordsService.checkUrl(normalizedUrl);
      if (harmfulCheck.isHarmful) {
        console.log('[SurfScreen] URL contains harmful words:', harmfulCheck.matchedWords);
        if (Platform.OS === 'android') {
          ToastAndroid.show('URL contains inappropriate content', ToastAndroid.SHORT);
        } else {
          Alert.alert('Warning', 'This URL contains inappropriate content and cannot be added to the library.');
        }
        return;
      }
      
      await addUrlToLibrary(
        url, 
        typeName || 'any', 
        level || 'easy', 
        displayName || 'Untitled',
        learningLanguage || 'en',
        'web'
      );
    } catch {}
  };

  const urlForStar = normalizeSurfUrl((currentUrl || addressText || '').trim());
  const isFav = favourites.some((f) => f.url === urlForStar);

  return {
    // State
    addressText,
    setAddressText,
    currentUrl,
    setCurrentUrl,
    canGoBack,
    setCanGoBack,
    favourites,
    showFavouritesList,
    setShowFavouritesList,
    showAddFavouriteModal,
    setShowAddFavouriteModal,
    newFavName,
    setNewFavName,
    newFavUrl,
    setNewFavUrl,
    newFavTypeId,
    setNewFavTypeId,
    showTypeOptions,
    setShowTypeOptions,
    favTypeError,
    setFavTypeError,
    newFavLevelName,
    setNewFavLevelName,
    showLevelOptions,
    setShowLevelOptions,
    favLevelError,
    setFavLevelError,
    imageScrape,
    setImageScrape,
    isAddressFocused,
    setIsAddressFocused,
    filteredDomains,
    
    // Refs
    webViewRef,
    hiddenWebViewRef,
    addressInputRef,
    imageScrapeResolveRef,
    imageScrapeRejectRef,
    
    // Actions
    selectSuggestion,
    submit,
    goBack,
    addToFavourites,
    removeFromFavourites,
    refreshFavourites,
    promptFavourite,
    openOptionsMenu,
    promptSetHomepage,
    postAddUrlToLibrary,
    
    // Computed
    urlForStar,
    isFav,
    
    // Constants
    FAVOURITE_TYPES,
  };
};
