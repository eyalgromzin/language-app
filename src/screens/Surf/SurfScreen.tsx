import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, StyleSheet, Platform, Alert, ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UrlBar from '../../components/Surf/UrlBar';
import FavouritesModal from '../../components/Surf/FavouritesModal';
import AddFavouriteModal from '../../components/Surf/AddFavouriteModal';
import SurfWebView from '../../components/Surf/SurfWebView';
import ImageScrapeWebView from '../../components/Surf/ImageScrapeWebView';
import { useSurfScreen } from '../../hooks/useSurfScreen';
import { useTranslationAndImages } from '../../hooks/useTranslationAndImages';
import { baseInjection, imageScrapeInjection } from '../../constants/webViewInjections';
import harmfulWordsService from '../../services/harmfulWordsService';
import linkingService from '../../services/linkingService';

function SurfScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  
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
  );

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
        ToastAndroid.show('No page to share', ToastAndroid.SHORT);
      } else {
        Alert.alert('No page to share');
      }
      return;
    }
    
    try {
      await linkingService.shareSurfUrl(targetUrl);
    } catch (error) {
      console.error('Error sharing surf URL:', error);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to share page', ToastAndroid.SHORT);
      } else {
        Alert.alert('Failed to share page');
      }
    }
  }, [currentUrl, addressText]);

  return (
    <View style={{ flex: 1 }}>
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
        canShare={!!(currentUrl && currentUrl !== 'about:blank')}
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
      
      <AddFavouriteModal
        visible={showAddFavouriteModal}
        onClose={() => setShowAddFavouriteModal(false)}
        onAdd={async () => {
          const u = normalizeUrl(newFavUrl || currentUrl || addressText);
          const nm = (newFavName || '').trim();
          if (!u || u === 'about:blank') {
            if (Platform.OS === 'android') ToastAndroid.show('Invalid URL', ToastAndroid.SHORT); else Alert.alert('Invalid URL');
            return;
          }
          const selected = FAVOURITE_TYPES.find(t => t.id === newFavTypeId);
          if (!selected) { setFavTypeError(true); return; }
          await addToFavourites(u, nm, selected.id, selected.name, newFavLevelName);
          setShowAddFavouriteModal(false);
          if (Platform.OS === 'android') ToastAndroid.show('Added to favourites', ToastAndroid.SHORT); else Alert.alert('Added');
          postAddUrlToLibrary(u, selected.name, nm, newFavLevelName || undefined).catch(() => {});
        }}
        newFavName={newFavName}
        setNewFavName={setNewFavName}
        newFavUrl={newFavUrl}
        setNewFavUrl={setNewFavUrl}
        newFavTypeId={newFavTypeId}
        setNewFavTypeId={setNewFavTypeId}
        newFavLevelName={newFavLevelName}
        setNewFavLevelName={setNewFavLevelName}
        showTypeOptions={showTypeOptions}
        setShowTypeOptions={setShowTypeOptions}
        showLevelOptions={showLevelOptions}
        setShowLevelOptions={setShowLevelOptions}
        favTypeError={favTypeError}
        setFavTypeError={setFavTypeError}
        learningLanguage={learningLanguage}
        FAVOURITE_TYPES={FAVOURITE_TYPES}
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
        baseInjection={baseInjection}
      />
      
      <ImageScrapeWebView
        imageScrape={imageScrape}
        hiddenWebViewRef={hiddenWebViewRef}
        onScrapeMessage={onScrapeMessage}
        imageScrapeInjection={imageScrapeInjection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles are now handled by individual components
});

export default SurfScreen;


