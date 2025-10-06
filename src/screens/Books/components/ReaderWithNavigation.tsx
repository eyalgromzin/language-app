import React from 'react';
import { Reader, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import ReaderNavigation from './ReaderNavigation';

type ReaderWithNavigationProps = {
  src: string;
  width: number;
  height: number;
  initialCfi?: string;
  injectedJavascript: string;
  onWebViewMessage: (payload: any) => void;
  onDisplayError: (reason: string) => void;
  onReady: () => void;
  onLocationChangePersist: (totalLocations: number, currentLocation: any) => void;
  themeColors: { headerBg: string; headerText: string; border: string };
};

export default function ReaderWithNavigation(props: ReaderWithNavigationProps): React.JSX.Element {
  const { goPrevious, goNext, goToLocation, getCurrentLocation, getLocations } = useReader();
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(1);

  const handleLocationChangeInner = React.useCallback((totalLocations: number, currentLocation: any) => {
    props.onLocationChangePersist(totalLocations, currentLocation);
    if (totalLocations > 0) {
      const startLocation = Number(currentLocation?.start?.location || 0);
      const currentPageNum = Math.floor(startLocation) + 1;
      setCurrentPage(Math.max(1, currentPageNum));
      setTotalPages(totalLocations);
    }
  }, [props]);

  const goToNextPage = React.useCallback(() => {
    try {
      console.log('goToNextPage');
      if (typeof goNext === 'function') {
        goNext({ keepScrollOffset: true });
        return;
      }
      const currentLoc = getCurrentLocation();
      const locations = getLocations();
      if (currentLoc && Array.isArray(locations) && locations.length > 0) {
        const currentIndex = locations.findIndex((loc: any) =>
          loc === currentLoc.start?.cfi || loc === currentLoc.end?.cfi
        );
        if (currentIndex >= 0 && currentIndex < locations.length - 1) {
          const nextLocation = locations[currentIndex + 1];
          goToLocation(nextLocation);
        }
      }
    } catch {}
  }, [goNext, getCurrentLocation, getLocations, goToLocation]);

  const goToPreviousPage = React.useCallback(() => {
    try {
      if (typeof goPrevious === 'function') {
        goPrevious({ keepScrollOffset: true });
        return;
      }
      const currentLoc = getCurrentLocation();
      const locations = getLocations();
      if (currentLoc && Array.isArray(locations) && locations.length > 0) {
        const currentIndex = locations.findIndex((loc: any) =>
          loc === currentLoc.start?.cfi || loc === currentLoc.end?.cfi
        );
        if (currentIndex > 0) {
          const prevLocation = locations[currentIndex - 1];
          goToLocation(prevLocation);
        }
      }
    } catch {}
  }, [goPrevious, getCurrentLocation, getLocations, goToLocation]);

  return (
    <>
      <Reader
        key={`reader-inner`}
        src={props.src}
        width={props.width}
        height={props.height}
        fileSystem={useFileSystem}
        initialLocation={props.initialCfi}
        onLocationChange={handleLocationChangeInner}
        onDisplayError={props.onDisplayError}
        onReady={props.onReady}
        allowScriptedContent
        injectedJavascript={props.injectedJavascript}
        onWebViewMessage={props.onWebViewMessage}
      />
      <ReaderNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
        themeColors={props.themeColors}
      />
    </>
  );
}
