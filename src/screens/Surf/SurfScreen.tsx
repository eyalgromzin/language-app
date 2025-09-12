import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, StyleSheet, Platform, Alert, ToastAndroid, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UrlBar from '../../components/Surf/UrlBar';
import FavouritesModal from '../../components/Surf/FavouritesModal';
import AddToFavouritesDialog from '../../components/AddToFavouritesDialog';
import SurfWebView from '../../components/Surf/SurfWebView';
import ImageScrapeWebView from '../../components/Surf/ImageScrapeWebView';
import { useSurfScreen } from '../../hooks/useSurfScreen';
import { useTranslationAndImages } from '../../hooks/useTranslationAndImages';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import { baseInjection, imageScrapeInjection } from '../../constants/webViewInjections';
import harmfulWordsService from '../../services/harmfulWordsService';
import linkingService from '../../services/linkingService';
import { useTranslation } from '../../hooks/useTranslation';

function SurfScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  
  // Get language mappings for translation
  const { languageMappings } = useLanguageMappings();
  
  // Use custom hooks for business logic
  const {
    addressText,
    setAddressText,
    currentUrl,
    setCurrentUrl,
    canGoBack,
    setCanGoBack,
    learningLanguage,
    nativeLanguage,
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
    webViewRef,
    hiddenWebViewRef,
    addressInputRef,
    imageScrapeResolveRef,
    imageScrapeRejectRef,
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
    urlForStar,
    isFav,
    FAVOURITE_TYPES,
  } = useSurfScreen();

  // Add missing utility functions
  const normalizeUrl = (input: string): string => {
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

  const saveDomain = async (domain: string) => {
    const normalized = (domain || '').toLowerCase().replace(/^www\./, '');
    if (!normalized) return;
    // This function is handled in the hook, but we need it for the navigation state change
  };

  const {
    translationPanel,
    setTranslationPanel,
    saveCurrentWord,
    onMessage,
    onScrapeMessage,
  } = useTranslationAndImages(
    learningLanguage,
    nativeLanguage,
    imageScrape,
    setImageScrape,
    imageScrapeResolveRef,
    imageScrapeRejectRef,
    languageMappings,
  );

  // Function to handle retranslation
  const handleRetranslate = React.useCallback((word: string) => {
    if (translationPanel) {
      // Update the word and trigger new translation and image fetch
      setTranslationPanel({
        ...translationPanel,
        word,
        translation: '',
        images: [],
        imagesLoading: true,
        translationLoading: true,
      });
    }
  }, [translationPanel, setTranslationPanel]);

  // Print first 3 harmful words to console on screen load
  React.useEffect(() => {
    (async () => {
      try {
        const harmfulWords = await harmfulWordsService.getHarmfulWords();
        const firstThree = harmfulWords.slice(0, 3);
        console.log('First 3 harmful words:', firstThree);
      } catch (error) {
        console.error('Failed to get harmful words:', error);
      }
    })();
  }, []);

  // Handle deep link URL if present
  React.useEffect(() => {
    const checkDeepLinkUrl = async () => {
      try {
        const deepLinkUrl = await AsyncStorage.getItem('surf.deepLinkUrl');
        if (deepLinkUrl) {
          setAddressText(deepLinkUrl);
          setCurrentUrl(deepLinkUrl);
          await AsyncStorage.removeItem('surf.deepLinkUrl');
        }
      } catch (error) {
        console.error('Error checking deep link URL:', error);
      }
    };
    
    checkDeepLinkUrl();
  }, []);

  const onShareSurfUrl = React.useCallback(async () => {
    const targetUrl = currentUrl || addressText;
    if (!targetUrl || targetUrl === 'about:blank') {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('screens.surf.noPageToShare'), ToastAndroid.SHORT);
      } else {
        Alert.alert(t('screens.surf.noPageToShare'));
      }
      return;
    }
    
    try {
      await linkingService.shareSurfUrl(targetUrl);
    } catch (error) {
      console.error('Error sharing surf URL:', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('screens.surf.failedToSharePage'), ToastAndroid.SHORT);
      } else {
        Alert.alert(t('screens.surf.failedToSharePage'));
      }
    }
  }, [currentUrl, addressText, t]);

  const onReportWebsite = React.useCallback(async () => {
    const targetUrl = currentUrl || addressText;
    if (!targetUrl || targetUrl === 'about:blank') {
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('screens.surf.noPageToReport'), ToastAndroid.SHORT);
      } else {
        Alert.alert(t('screens.surf.noPageToReport'));
      }
      return;
    }

    try {
      // Import the API function
      const { reportWebsite } = await import('../../config/api');
      await reportWebsite(targetUrl);
      
      // Show success dialog with custom message
      Alert.alert(
        t('screens.surf.websiteReported'),
        t('screens.surf.websiteReportedMessage'),
        [{ text: t('common.ok'), style: 'default' }]
      );
    } catch (error) {
      console.error('Error reporting website:', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('screens.surf.failedToReportWebsite'), ToastAndroid.SHORT);
      } else {
        Alert.alert(t('common.error'), t('screens.surf.failedToReportWebsite'));
      }
    }
  }, [currentUrl, addressText, t]);

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <UrlBar
        addressText={addressText}
        setAddressText={setAddressText}
        onSubmit={submit}
        onFavouritePress={() => promptFavourite(urlForStar, isFav)}
        onBackPress={goBack}
        onLibraryPress={() => navigation.navigate('Library')}
        onOptionsPress={() => {}}
        onSetHomepage={promptSetHomepage}
        onShowFavourites={() => setShowFavouritesList(true)}
        onShare={onShareSurfUrl}
        onReportWebsite={onReportWebsite}
        canShare={!!(currentUrl && currentUrl !== 'about:blank')}
        canReport={!!(currentUrl && currentUrl !== 'about:blank')}
        canGoBack={canGoBack}
        isFavourite={isFav}
        isAddressFocused={isAddressFocused}
        setIsAddressFocused={setIsAddressFocused}
        filteredDomains={filteredDomains}
        onSelectSuggestion={selectSuggestion}
        addressInputRef={addressInputRef}
      />
      
      <FavouritesModal
        visible={showFavouritesList}
        onClose={() => setShowFavouritesList(false)}
        favourites={favourites}
        onFavouritePress={(url) => {
          setShowFavouritesList(false);
          setAddressText(url);
          setCurrentUrl(url);
        }}
        onRemoveFavourite={removeFromFavourites}
      />
      
      <AddToFavouritesDialog
        visible={showAddFavouriteModal}
        onClose={() => setShowAddFavouriteModal(false)}
        onSuccess={async (url, typeName, name, levelName) => {
          setShowAddFavouriteModal(false);
          await refreshFavourites();
          if (Platform.OS === 'android') ToastAndroid.show(t('screens.surf.addedToFavourites'), ToastAndroid.SHORT); else Alert.alert(t('screens.surf.addedToFavourites'));
          postAddUrlToLibrary(url, typeName, name, levelName || undefined).catch(() => {});
        }}
        defaultUrl={newFavUrl || currentUrl || addressText}
        defaultName={newFavName}
        learningLanguage={learningLanguage}
        storageKey="surf.favourites"
      />
      
      <SurfWebView
        currentUrl={currentUrl}
        webViewRef={webViewRef}
        onNavigationStateChange={(navState) => {
          try {
            setCanGoBack(!!navState.canGoBack);
            if (typeof navState.url === 'string') {
              setAddressText(navState.url);
              const d = getDomainFromUrlString(navState.url);
              if (d) saveDomain(d);
            }
          } catch (e) {}
        }}
        onMessage={onMessage}
        onLoad={() => {
          try { webViewRef.current?.injectJavaScript(baseInjection); } catch (e) { }
        }}
        translationPanel={translationPanel}
        onSaveWord={saveCurrentWord}
        onCloseTranslationPanel={() => setTranslationPanel(null)}
        onRetranslate={handleRetranslate}
        baseInjection={baseInjection}
      />
      
      <ImageScrapeWebView
        imageScrape={imageScrape}
        hiddenWebViewRef={hiddenWebViewRef}
        onScrapeMessage={onScrapeMessage}
        imageScrapeInjection={imageScrapeInjection}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default SurfScreen;


