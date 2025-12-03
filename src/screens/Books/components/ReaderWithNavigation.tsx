import React from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Reader, useReader } from '@epubjs-react-native/core';
import { useFileSystem } from '@epubjs-react-native/file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReaderNavigation from './ReaderNavigation';

const PAGES_TO_JUMP = 20;

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

const STORAGE_KEY = 'books.library';

export default function ReaderWithNavigation(props: ReaderWithNavigationProps): React.JSX.Element {
  const { goPrevious, goNext, goToLocation, getCurrentLocation, getLocations } = useReader();
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const navigationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const readerReadyRef = React.useRef<boolean>(false);
  const lastRestoredCfiRef = React.useRef<string | null>(null);

  // Cleanup navigation timeout on unmount
  React.useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Function to restore location from saved CFI
  const restoreLocation = React.useCallback(async () => {
    if (!props.bookId || !readerReadyRef.current) return;
    
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return;
      
      const parsed = JSON.parse(json);
      const books = Array.isArray(parsed) ? parsed : [];
      const book = books.find((b: any) => b.id === props.bookId);
      
      if (book?.lastPositionCfi && typeof book.lastPositionCfi === 'string') {
        const savedCfi = book.lastPositionCfi;
        
        // Only restore if we haven't already restored to this location
        if (lastRestoredCfiRef.current !== savedCfi) {
          // Check current location to avoid unnecessary navigation
          const currentLoc = getCurrentLocation();
          const currentCfi = currentLoc?.start?.cfi ?? currentLoc?.end?.cfi ?? null;
          
          // Only restore if we're not already at the saved location
          if (currentCfi !== savedCfi) {
            lastRestoredCfiRef.current = savedCfi;
            goToLocation(savedCfi);
          }
        }
      }
    } catch (error) {
      console.log('Failed to restore location:', error);
    }
  }, [props.bookId, getCurrentLocation, goToLocation]);

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

  // Handle app state changes to restore location when app comes back to foreground
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && readerReadyRef.current) {
        // App came to foreground, restore location after a short delay
        setTimeout(() => {
          restoreLocation();
        }, 500);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [restoreLocation]);

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
      
      // Update last restored CFI when location changes naturally (not from restore)
      const currentCfi = currentLocation?.start?.cfi ?? currentLocation?.end?.cfi ?? null;
      if (currentCfi) {
        lastRestoredCfiRef.current = currentCfi;
      }
      
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

  const jumpPages = React.useCallback((direction: 'forward' | 'backward') => {
    try {
      // Calculate target page based on direction
      const targetPage = direction === 'forward' 
        ? Math.min(currentPage + PAGES_TO_JUMP, totalPages)
        : Math.max(currentPage - PAGES_TO_JUMP, 1);
      
      // Check if we can navigate in this direction
      if (direction === 'forward' && targetPage <= currentPage) {
        return; // Already at or past target
      }
      if (direction === 'backward' && targetPage >= currentPage) {
        return; // Already at or before target
      }

      // Try to use location-based navigation first
      const currentLoc = getCurrentLocation();
      const locations = getLocations();
      
      if (currentLoc && Array.isArray(locations) && locations.length > 0) {
        // Calculate target location index (0-based, since pages are 1-based)
        const targetIndex = targetPage - 1;
        
        if (targetIndex >= 0 && targetIndex < locations.length) {
          const targetLocation = locations[targetIndex];
          
          // Try different formats
          if (typeof targetLocation === 'string') {
            goToLocation(targetLocation);
            return;
          } else if (targetLocation && typeof targetLocation === 'object') {
            const loc = targetLocation as any;
            if (loc.cfi && typeof loc.cfi === 'string') {
              goToLocation(loc.cfi);
              return;
            } else if (loc.start?.cfi && typeof loc.start.cfi === 'string') {
              goToLocation(loc.start.cfi);
              return;
            }
          }
        }
      }

      // Fallback: use goNext/goPrevious multiple times sequentially
      const navigateFunction = direction === 'forward' ? goNext : goPrevious;
      if (typeof navigateFunction === 'function') {
        const maxPages = direction === 'forward'
          ? Math.min(PAGES_TO_JUMP, totalPages - currentPage)
          : Math.min(PAGES_TO_JUMP, currentPage - 1);
        
        // Don't navigate if we can't move at all
        if (maxPages <= 0) {
          return;
        }
        
        let count = 0;
        const navigate = () => {
          if (count < maxPages) {
            navigateFunction({ keepScrollOffset: true });
            count++;
            navigationTimeoutRef.current = setTimeout(navigate, 10);
          }
        };
        navigate();
      }
    } catch (error) {
      console.log(`Error in jumpPages (${direction}):`, error);
    }
  }, [currentPage, totalPages, getCurrentLocation, getLocations, goToLocation, goNext, goPrevious]);

  const goToNext10Pages = React.useCallback(() => {
    jumpPages('forward');
  }, [jumpPages]);

  const goToPrevious10Pages = React.useCallback(() => {
    jumpPages('backward');
  }, [jumpPages]);

  const handleReady = React.useCallback(() => {
    readerReadyRef.current = true;
    props.onReady();
    // Note: initialCfi prop should handle initial location restoration
    // restoreLocation is only called when app comes back to foreground
  }, [props]);

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
        onReady={handleReady}
        allowScriptedContent
        injectedJavascript={props.injectedJavascript}
        onWebViewMessage={props.onWebViewMessage}
      />
      <ReaderNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
        onPrevious10={goToPrevious10Pages}
        onNext10={goToNext10Pages}
        pagesToJump={PAGES_TO_JUMP}
        themeColors={props.themeColors}
      />
    </>
  );
}

