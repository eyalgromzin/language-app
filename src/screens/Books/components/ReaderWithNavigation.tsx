import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Reader, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  bookId?: string;
};

export default function ReaderWithNavigation(props: ReaderWithNavigationProps): React.JSX.Element {
  const { goPrevious, goNext, goToLocation, getCurrentLocation, getLocations } = useReader();
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(1);

  // Load saved total pages and current page on component mount
  React.useEffect(() => {
    if (props.bookId) {
      const loadSavedData = async () => {
        try {
          const [savedTotalPages, savedCurrentPage] = await AsyncStorage.multiGet([
            `book_total_pages_${props.bookId}`,
            `book_current_page_${props.bookId}`
          ]);
          
          if (savedTotalPages[1] && parseInt(savedTotalPages[1]) > 1) {
            setTotalPages(parseInt(savedTotalPages[1]));
          }
          
          if (savedCurrentPage[1] && parseInt(savedCurrentPage[1]) > 0) {
            setCurrentPage(parseInt(savedCurrentPage[1]));
          }
        } catch (error) {
          console.log('Failed to load saved book data:', error);
        }
      };
      loadSavedData();
    }
  }, [props.bookId]);

  // Save total pages to local storage when it changes and is > 1
  const saveTotalPagesToStorage = React.useCallback(async (pages: number) => {
    if (props.bookId && pages > 1) {
      try {
        await AsyncStorage.setItem(`book_total_pages_${props.bookId}`, pages.toString());
      } catch (error) {
        console.log('Failed to save total pages:', error);
      }
    }
  }, [props.bookId]);

  // Save current page to local storage
  const saveCurrentPageToStorage = React.useCallback(async (page: number) => {
    if (props.bookId && page > 0) {
      try {
        await AsyncStorage.setItem(`book_current_page_${props.bookId}`, page.toString());
      } catch (error) {
        console.log('Failed to save current page:', error);
      }
    }
  }, [props.bookId]);

  const handleLocationChangeInner = React.useCallback((totalLocations: number, currentLocation: any) => {
    props.onLocationChangePersist(totalLocations, currentLocation);
    if (totalLocations > 0) {
      const startLocation = Number(currentLocation?.start?.location || 0);
      const currentPageNum = Math.floor(startLocation) + 1;
      setCurrentPage(Math.max(1, currentPageNum));
      setTotalPages(totalLocations);
      
      // Save total pages to storage if > 1
      if (totalLocations > 1) {
        saveTotalPagesToStorage(totalLocations);
      }
      
      // Save current page to storage
      saveCurrentPageToStorage(Math.max(1, currentPageNum));
    }
  }, [props, saveTotalPagesToStorage, saveCurrentPageToStorage]);

  const goToNextPage = React.useCallback(() => {
    try {
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
    } catch (error) {
      console.log('Error in goToNextPage:', error);
    }
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
    } catch (error) {
      console.log('Error in goToPreviousPage:', error);
    }
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

