import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ReaderProvider } from '@epubjs-react-native/core';
import { ReaderWithNavigation } from './index';

type BookReaderContentProps = {
  loading: boolean;
  error: string | null;
  bookFormat: 'epub' | 'pdf';
  src: string | null;
  width: number;
  height: number;
  initialCfi: string | undefined;
  injectedJavascript: string;
  onWebViewMessage: (payload: any) => void;
  onDisplayError: (reason: string) => void;
  onReady: () => void;
  onLocationChangePersist: (totalLocations: number, currentLocation: any) => void;
  themeColors: { headerBg: string; headerText: string; border: string };
  bookId: string | undefined;
  imageScrapeElement?: React.ReactNode;
};

export default function BookReaderContent({
  loading,
  error,
  bookFormat,
  src,
  width,
  height,
  initialCfi,
  injectedJavascript,
  onWebViewMessage,
  onDisplayError,
  onReady,
  onLocationChangePersist,
  themeColors,
  bookId,
  imageScrapeElement,
}: BookReaderContentProps): React.JSX.Element {
  return (
    <View style={styles.readerContainer}>
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      )}
      {!!error && !loading && (
        <View style={styles.center}>
          <Text style={{ color: '#dc2626' }}>{error}</Text>
        </View>
      )}
      {!!(!loading && !error) && (
        bookFormat === 'epub' && (
          !!src && (
            <ReaderProvider>
              <ReaderWithNavigation
                src={src}
                width={width}
                height={height - 56 - 60 - 300}
                initialCfi={initialCfi}
                injectedJavascript={injectedJavascript}
                onWebViewMessage={onWebViewMessage}
                onDisplayError={onDisplayError}
                onReady={onReady}
                onLocationChangePersist={onLocationChangePersist}
                themeColors={themeColors}
                bookId={bookId}
              />
            </ReaderProvider>
          )
        )
      )}
      {imageScrapeElement}
    </View>
  );
}

const styles = StyleSheet.create({
  readerContainer: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
