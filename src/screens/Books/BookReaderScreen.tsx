import React from 'react';
import { Alert, Modal, Platform, StyleSheet, ToastAndroid, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import TranslationPanel from '../../components/TranslationPanel';
import AddToFavouritesDialog from '../../components/AddToFavouritesDialog';
import { AddBookModal } from './components';
import BookReaderHeader from './components/BookReaderHeader';
import BookReaderContent from './components/BookReaderContent';
import ImageScrapeWebView from './components/ImageScrapeWebView';
import { useBookLoader } from './hooks/useBookLoader';
import { useReaderTheme } from './hooks/useReaderTheme';
import { useBookTranslation } from './hooks/useBookTranslation';
import { useImageScraping } from './hooks/useImageScraping';
import { useInjectedJavascript } from './hooks/useInjectedJavascript';
import { useBookPosition } from './hooks/useBookPosition';
import { useLibraryManagement } from './hooks/useLibraryManagement';
import { useLibraryPrompt } from './hooks/useLibraryPrompt';
import { useOpenedBeforeMarker } from './hooks/useOpenedBeforeMarker';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import { useLoginGate } from '../../contexts/LoginGateContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

type RouteParams = { id: string };

function BookReaderScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { width, height } = useWindowDimensions();
  const { showLoginGate } = useLoginGate();
  const { isAuthenticated } = useAuth();
  const { learningLanguage } = useLanguage();
  const { languageMappings } = useLanguageMappings();

  const bookId: string | undefined = (route?.params as RouteParams | undefined)?.id;

  // Book loading
  const { loading, error, bookTitle, src, initialCfi, bookFormat } = useBookLoader(bookId);
  const [displayError, setDisplayError] = React.useState<string | null>(null);

  // Theme management
  const { readerTheme, setReaderTheme, themeColors } = useReaderTheme();
  const [showThemeMenu, setShowThemeMenu] = React.useState<boolean>(false);

  // Image scraping
  const { imageScrape, imageScrapeInjection, hiddenWebViewRef, fetchImageUrls, onScrapeMessage } = useImageScraping();

  // Translation panel
  const { translationPanel, setTranslationPanel, openPanel, handleWebViewMessage, saveCurrentWord } = useBookTranslation({
    languageMappings,
    fetchImageUrls,
    showLoginGate,
    isAuthenticated,
  });

  // Book position tracking
  const { handleLocationChange } = useBookPosition(bookId);

  // Injected javascript for word tapping
  const injectedJavascript = useInjectedJavascript(themeColors);

  // Library management
  const { itemTypes, postAddBookUrlToLibrary } = useLibraryManagement(bookId, learningLanguage, bookTitle);
  const [showAddBookModal, setShowAddBookModal] = React.useState<boolean>(false);
  const [showFavouriteModal, setShowFavouriteModal] = React.useState<boolean>(false);

  // Library prompt logic
  useLibraryPrompt(bookId, learningLanguage, bookTitle, () => setShowAddBookModal(true));

  // Mark book as opened before
  useOpenedBeforeMarker(bookId);

  const goBack = () => navigation.goBack();

  const handleFavouriteClick = () => {
    Alert.alert(
      'Add to Favourites',
      'Would you like to add a download URL for all to use also?',
      [
        { text: 'No', style: 'cancel', onPress: () => setShowFavouriteModal(true) },
        { text: 'Yes', onPress: () => setShowAddBookModal(true) },
      ],
      { cancelable: true }
    );
  };

  const imageScrapeElement =
    imageScrape && imageScrape.url ? (
      <ImageScrapeWebView
        url={imageScrape.url}
        injectedJavaScript={imageScrapeInjection}
        onMessage={onScrapeMessage}
        webViewRef={hiddenWebViewRef}
      />
    ) : null;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <BookReaderHeader
        bookTitle={bookTitle}
        readerTheme={readerTheme}
        themeColors={themeColors}
        showThemeMenu={showThemeMenu}
        onBack={goBack}
        onFavouriteClick={handleFavouriteClick}
        onThemeMenuToggle={() => setShowThemeMenu((v) => !v)}
        onThemeChange={setReaderTheme}
      />

      <BookReaderContent
        loading={loading}
        error={displayError || error}
        bookFormat={bookFormat}
        src={src}
        width={width}
        height={height}
        initialCfi={initialCfi}
        injectedJavascript={injectedJavascript}
        onWebViewMessage={handleWebViewMessage}
        onDisplayError={(reason: string) => setDisplayError(reason || 'Failed to display book')}
        onReady={() => setDisplayError(null)}
        onLocationChangePersist={handleLocationChange}
        themeColors={{
          headerBg: themeColors.headerBg,
          headerText: themeColors.headerText,
          border: themeColors.border,
        }}
        bookId={bookId}
        imageScrapeElement={imageScrapeElement}
      />

        <TranslationPanel
          panel={translationPanel}
          onSave={saveCurrentWord}
          onClose={() => setTranslationPanel(null)}
          isBookScreen={true}
          onTranslate={(word: string) => {
            openPanel(word, translationPanel?.sentence);
          }}
          onRetranslate={(word: string) => {
            openPanel(word, translationPanel?.sentence);
          }}
        />

        {/* Add book to library modal */}
        <Modal
          visible={showAddBookModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddBookModal(false)}
        >
          <AddBookModal
            visible={showAddBookModal}
            onClose={() => setShowAddBookModal(false)}
            onAdd={async (url, typeName, displayName) => {
              await postAddBookUrlToLibrary(url, typeName, displayName);
              if (Platform.OS === 'android') {
                ToastAndroid.show('Added to library', ToastAndroid.SHORT);
              } else {
                Alert.alert('Added');
              }
            }}
            bookTitle={bookTitle}
            learningLanguage={learningLanguage}
            itemTypes={itemTypes}
          />
        </Modal>
        
        {/* Add to favourites modal */}
        <AddToFavouritesDialog
          visible={showFavouriteModal}
          onClose={() => setShowFavouriteModal(false)}
          onSuccess={() => {
            if (Platform.OS === 'android') {
              ToastAndroid.show('Added to favourites', ToastAndroid.SHORT);
            } else {
              Alert.alert('Success', 'Book added to favourites');
            }
          }}
          defaultName={bookTitle || ''}
          defaultType="book"
          defaultLevel="easy"
          learningLanguage={learningLanguage}
          storageKey="surf.favourites"
        />
    </View>
  );
}

export default BookReaderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
});