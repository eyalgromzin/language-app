import { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReaderTheme } from '../components/ThemeSelector';

type ThemeColors = {
  bg: string;
  text: string;
  headerBg: string;
  headerText: string;
  border: string;
  menuBg: string;
  menuText: string;
};

export function useReaderTheme(): {
  readerTheme: ReaderTheme;
  setReaderTheme: React.Dispatch<React.SetStateAction<ReaderTheme>>;
  themeColors: ThemeColors;
} {
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('white');

  useEffect(() => {
    // Load persisted reader theme
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('reader.theme');
        if (savedTheme === 'white' || savedTheme === 'beige') {
          setReaderTheme(savedTheme as ReaderTheme);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // Persist theme selection
    (async () => {
      try {
        await AsyncStorage.setItem('reader.theme', readerTheme);
      } catch {}
    })();
  }, [readerTheme]);

  const themeColors = useMemo(() => {
    if (readerTheme === 'beige') {
      return {
        bg: '#f5f1e8',
        text: '#262626',
        headerBg: '#f5f1e8',
        headerText: '#262626',
        border: '#e5dfcf',
        menuBg: '#f3eadc',
        menuText: '#262626',
      } as const;
    }
    return {
      bg: '#ffffff',
      text: '#111827',
      headerBg: '#ffffff',
      headerText: '#111827',
      border: '#e5e7eb',
      menuBg: '#ffffff',
      menuText: '#111827',
    } as const;
  }, [readerTheme]);

  return {
    readerTheme,
    setReaderTheme,
    themeColors,
  };
}
