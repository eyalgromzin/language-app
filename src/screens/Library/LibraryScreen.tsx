import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { getLibraryMeta, searchLibraryWithCriterias } from '../../config/api';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import {
  LibraryHeader,
  MediaTypeTabs,
  LibraryFilters,
  LibraryItem,
  DropdownModal,
  LoadingState,
  ErrorState,
  EmptyState,
} from './components';

function LibraryScreen(): React.JSX.Element {
  const { languageMappings } = useLanguageMappings();
  const { t } = useTranslation();
  const [urls, setUrls] = React.useState<{ url: string; name?: string; type: string; level: string; media: string }[]>([]);
  const [allUrls, setAllUrls] = React.useState<{ url: string; name?: string; type: string; level: string; media: string }[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedType, setSelectedType] = React.useState<string>('All');
  const [selectedLevel, setSelectedLevel] = React.useState<string>('All');
  const [showTypeDropdown, setShowTypeDropdown] = React.useState<boolean>(false);
  const [showLevelDropdown, setShowLevelDropdown] = React.useState<boolean>(false);
  const [selectedMedia, setSelectedMedia] = React.useState<'all' | 'web' | 'youtube' | 'book'>('all');
  const [metaTypes, setMetaTypes] = React.useState<string[] | null>(null);
  const [metaLevels, setMetaLevels] = React.useState<string[] | null>(null);
  const [learningLanguage, setLearningLanguage] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>('');



  // Resolve persisted learning language
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const value = await AsyncStorage.getItem('language.learning');
        if (!mounted) return;
        setLearningLanguage(value ?? null);
      } catch (error) {
        if (!mounted) return;
        setLearningLanguage(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toLanguageSymbol = React.useCallback((input: string | null): string => {
    const v = (input || '').trim().toLowerCase();
    
    // If it's already a symbol, return it
    if (v === 'en' || v === 'es' || v === 'fr' || v === 'de' || v === 'it' || v === 'pt' || v === 'ru' || v === 'zh' || v === 'ja' || v === 'ko' || v === 'ar' || v === 'hi' || v === 'tr' || v === 'pl' || v === 'nl' || v === 'el' || v === 'sv' || v === 'no' || v === 'fi' || v === 'cs' || v === 'uk' || v === 'he' || v === 'th' || v === 'vi') {
      return v;
    }
    
    // Map from language name to symbol using context
    const symbol = languageMappings[v];
    if (symbol) {
      return symbol;
    }
    
    // Default to English if not found
    return 'en';
  }, [languageMappings]);

  // Initial load relies on selected media effect that queries searchWithCriterias
  // with only language parameter to populate the list.

  React.useEffect(() => {
    let isCancelled = false;
    const loadMeta = async () => {
      try {
        const json: { itemTypes?: string[]; levels?: string[] } = await getLibraryMeta();
        if (!isCancelled) {
          if (Array.isArray(json.itemTypes)) setMetaTypes(json.itemTypes);
          if (Array.isArray(json.levels)) setMetaLevels(json.levels);
        }
      } catch {}
    };
    loadMeta();
    return () => {
      isCancelled = true;
    };
  }, []);

  const typeOptions = React.useMemo(() => {
    if (metaTypes && metaTypes.length) return ['All', ...metaTypes];
    const source = allUrls.length ? allUrls : urls;
    const unique = Array.from(new Set(source.map((u) => u.type)));
    return ['All', ...unique];
  }, [metaTypes, urls, allUrls]);

  const levelOptions = React.useMemo(() => {
    if (metaLevels && metaLevels.length) return ['All', ...metaLevels];
    const source = allUrls.length ? allUrls : urls;
    const unique = Array.from(new Set(source.map((u) => u.level)));
    return ['All', ...unique];
  }, [metaLevels, urls, allUrls]);

  // Helper function to translate dropdown options
  const translateOption = (option: string, type: 'type' | 'level'): string => {
    if (option === 'All') {
      return t('screens.library.filters.all');
    }
    
    if (type === 'type') {
      return t(`screens.library.filters.types.${option}`, { defaultValue: option });
    } else if (type === 'level') {
      const translationKey = `screens.library.filters.levels.${option}`;
      const translated = t(translationKey, { defaultValue: option });
      console.log(`[Library] Translating level: "${option}" -> key: "${translationKey}" -> result: "${translated}"`);
      return translated;
    }
    
    return option;
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

  const getDisplayName = (it: { url: string; name?: string | null }): string => {
    const n = (it.name || '').trim();
    if (n) return n;
    return getDomainFromUrlString(it.url) || it.url;
  };

  const filteredUrls = React.useMemo(() => {
    const res = urls.filter(
      (u) => {
        const mediaMatch = selectedMedia === 'all' || u.media === selectedMedia;
        const typeMatch = selectedType === 'All' || u.type === selectedType;
        const levelMatch = selectedMedia === 'book' || selectedLevel === 'All' || u.level === selectedLevel;
        const searchMatch = searchQuery === '' || getDisplayName(u).toLowerCase().includes(searchQuery.toLowerCase());
        
        return mediaMatch && typeMatch && levelMatch && searchMatch;
      }
    );

    return res
  }, [urls, selectedType, selectedLevel, selectedMedia, searchQuery]);

  React.useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        setLoading(true);
        const json: { url: string; name?: string; thumbnailUrl?: string; type: string; level: string; media: string }[] = await searchLibraryWithCriterias(toLanguageSymbol(learningLanguage), selectedType, selectedLevel);
        setUrls(json ?? []);
      } catch (e) {
        setError(t('screens.library.states.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [selectedType, selectedLevel, allUrls, toLanguageSymbol, learningLanguage]);

  // On tab change, fetch from server with empty media/level/type (only language)
  React.useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      try {
        setError(null);
        setLoading(true);
        const list: { url: string; name?: string; type: string; level: string; media: string }[] = await searchLibraryWithCriterias(toLanguageSymbol(learningLanguage));
        if (!isCancelled) {
          setUrls(list);
          setAllUrls(list);
        }
      } catch (e) {
        console.error('[Library] Error fetching URLs:', e);
        if (!isCancelled) setError(t('screens.library.states.failedToLoad'));
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    run();
    return () => {
      isCancelled = true;
    };
  }, [selectedMedia, toLanguageSymbol, learningLanguage]);

  // Close any open dropdowns when switching tabs
  React.useEffect(() => {
    setShowTypeDropdown(false);
    setShowLevelDropdown(false);
  }, [selectedMedia]);


  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          // Trigger a reload by changing a dependency
          setSelectedMedia(prev => prev);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LibraryHeader />
      <MediaTypeTabs selectedMedia={selectedMedia} onMediaChange={setSelectedMedia} />
      <FlatList
        data={filteredUrls}
        keyExtractor={(item) => item.url}
        renderItem={({ item }) => (
          <LibraryItem
            item={item}
            translateOption={translateOption}
            getDisplayName={getDisplayName}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <LibraryFilters
            selectedType={selectedType}
            selectedLevel={selectedLevel}
            selectedMedia={selectedMedia}
            onTypeDropdownToggle={() => {
              setShowTypeDropdown((prev) => !prev);
              setShowLevelDropdown(false);
            }}
            onLevelDropdownToggle={() => {
              setShowLevelDropdown((prev) => !prev);
              setShowTypeDropdown(false);
            }}
            onClearFilters={() => {
              setSelectedType('All');
              setSelectedLevel('All');
              setShowTypeDropdown(false);
              setShowLevelDropdown(false);
            }}
            translateOption={translateOption}
          />
        }
        ListEmptyComponent={
          <EmptyState
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        }
      />

      <DropdownModal
        visible={showTypeDropdown}
        title={t('screens.library.filters.selectType')}
        options={typeOptions}
        selectedOption={selectedType}
        onOptionSelect={setSelectedType}
        onClose={() => setShowTypeDropdown(false)}
        translateOption={translateOption}
        type="type"
      />

      {selectedMedia !== 'book' && (
        <DropdownModal
          visible={showLevelDropdown}
          title={t('screens.library.filters.selectLevel')}
          options={levelOptions}
          selectedOption={selectedLevel}
          onOptionSelect={setSelectedLevel}
          onClose={() => setShowLevelDropdown(false)}
          translateOption={translateOption}
          type="level"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 16,
  },
});

export default LibraryScreen;



