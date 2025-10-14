import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type HistoryEntry = { url: string; title: string };

const HISTORY_KEY = 'video.history';

export const useHistory = (currentVideoTitle?: string) => {
  const [savedHistory, setSavedHistory] = React.useState<HistoryEntry[]>([]);

  // Load history on mount
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (!mounted) return;
        const arr = JSON.parse(raw || '[]');
        if (Array.isArray(arr)) {
          // Migrate from [string] -> [{ url, title }]
          const normalized: HistoryEntry[] = arr
            .map((item: any) => {
              if (typeof item === 'string') {
                const u = (item || '').trim();
                return u ? { url: u, title: '' } : null;
              }
              if (item && typeof item.url === 'string') {
                const u = (item.url || '').trim();
                const t = typeof item.title === 'string' ? item.title : '';
                return u ? { url: u, title: t } : null;
              }
              return null;
            })
            .filter(Boolean) as HistoryEntry[];
          setSavedHistory(normalized);
        } else {
          setSavedHistory([]);
        }
      } catch {
        if (!mounted) return;
        setSavedHistory([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveHistory = React.useCallback(async (entryUrl: string, entryTitle?: string) => {
    const normalizedUrl = (entryUrl || '').trim();
    if (!normalizedUrl) return;
    const providedTitle = (entryTitle || currentVideoTitle || '').trim();
    setSavedHistory(prev => {
      const existing = prev.find(h => h.url === normalizedUrl);
      const titleToUse = providedTitle || (existing?.title ?? '');
      const newEntry: HistoryEntry = { url: normalizedUrl, title: titleToUse };
      const next = [newEntry, ...prev.filter(h => h.url !== normalizedUrl)];
      const limited = next.slice(0, 50);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(limited)).catch(() => {});
      return limited;
    });
  }, [currentVideoTitle]);

  return {
    savedHistory,
    saveHistory,
  };
};

