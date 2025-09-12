import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Platform, NativeModules, Modal, Pressable, ScrollView, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getLibraryMeta, searchLibraryWithCriterias } from '../../config/api';
import { useLanguageMappings } from '../../contexts/LanguageMappingsContext';
import LinkingService from '../../services/linkingService';
import Ionicons from 'react-native-vector-icons/Ionicons';

function LibraryScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
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

  const renderItem = ({ item }: { item: { url: string; name?: string; type: string; level: string; media: string } }) => {
    const getMediaIcon = (media: string) => {
      const mediaLower = media.toLowerCase();
      switch (mediaLower) {
        case 'youtube':
          return <Ionicons name="logo-youtube" size={18} color="#FF0000" />;
        case 'web':
          return <Ionicons name="globe-outline" size={18} color="#007AFF" />;
        case 'book':
          return <Ionicons name="book-outline" size={18} color="#8B4513" />;
        default:
          return <Ionicons name="document-outline" size={18} color="#6B7280" />;
      }
    };

    const getLevelColor = (level: string) => {
      switch (level.toLowerCase()) {
        case 'beginner':
          return '#10B981';
        case 'intermediate':
          return '#F59E0B';
        case 'advanced':
          return '#EF4444';
        default:
          return '#6B7280';
      }
    };

    return (
      <TouchableOpacity
        accessibilityRole="link"
        onPress={() => {
          if ((item.media || '').toLowerCase() === 'youtube') {
            navigation.navigate('Video', { youtubeUrl: item.url, youtubeTitle: item.name });
          } else {
            navigation.navigate('Surf', { url: item.url });
          }
        }}
        style={styles.item}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <View style={styles.mediaIconContainer}>
            {getMediaIcon(item.media)}
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemName} numberOfLines={2}>{getDisplayName(item)}</Text>
            <View style={styles.itemMeta}>
              <View style={styles.metaRow}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{item.type}</Text>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) + '15' }]}>
                  <Text style={[styles.levelText, { color: getLevelColor(item.level) }]}>{item.level}</Text>
                </View>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>{t('screens.library.title')}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.center, styles.loadingContainer]}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>{t('screens.library.states.loading')}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>{t('screens.library.title')}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.center, styles.errorContainer]}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>{t('screens.library.states.error')}</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setError(null);
            setLoading(true);
            // Trigger a reload by changing a dependency
            setSelectedMedia(prev => prev);
          }}>
            <Text style={styles.retryButtonText}>{t('screens.library.states.tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Professional Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>{t('screens.library.title')}</Text>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => LinkingService.shareLibrary()}
                accessibilityRole="button"
                accessibilityLabel={t('screens.library.accessibility.shareLibrary')}
              >
              <Ionicons name="share-outline" size={22} color="#6366F1" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Media Type Tabs */}
      <View style={styles.tabsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {([
            { key: 'all', label: t('screens.library.tabs.all'), icon: 'grid-outline' },
            { key: 'web', label: t('screens.library.tabs.web'), icon: 'globe-outline' },
            { key: 'youtube', label: t('screens.library.tabs.youtube'), icon: 'logo-youtube' },
            { key: 'book', label: t('screens.library.tabs.books'), icon: 'book-outline' },
          ] as const).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, selectedMedia === tab.key && styles.tabButtonActive]}
              onPress={() => setSelectedMedia(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedMedia === tab.key }}
              accessibilityLabel={t('screens.library.accessibility.selectTab', { tab: tab.label })}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={selectedMedia === tab.key ? '#FFFFFF' : '#6B7280'} 
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, selectedMedia === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
             <FlatList
         data={filteredUrls}
         keyExtractor={(item) => item.url}
         renderItem={renderItem}
         ItemSeparatorComponent={() => <View style={styles.separator} />}
         contentContainerStyle={styles.listContent}
         ListHeaderComponent={
           <View style={styles.filtersBar}>
             <View style={styles.filtersRow}>
               <View style={styles.dropdownContainer}>
                 <TouchableOpacity
                   style={styles.dropdownButton}
                   onPress={() => {
                     setShowTypeDropdown((prev) => !prev);
                     setShowLevelDropdown(false);
                   }}
                 >
                   <Text style={styles.dropdownButtonText}>{t('screens.library.filters.type')}: {selectedType}</Text>
                 </TouchableOpacity>
                 {/* options rendered in modal overlay */}
               </View>

               {selectedMedia !== 'book' && (
                 <View style={styles.dropdownContainer}>
                   <TouchableOpacity
                     style={styles.dropdownButton}
                     onPress={() => {
                       setShowLevelDropdown((prev) => !prev);
                       setShowTypeDropdown(false);
                     }}
                   >
                     <Text style={styles.dropdownButtonText}>{t('screens.library.filters.level')}: {selectedLevel}</Text>
                   </TouchableOpacity>
                   {/* options rendered in modal overlay */}
                 </View>
               )}
             </View>

             {(selectedType !== 'All' || selectedLevel !== 'All') && (
               <TouchableOpacity
                 style={styles.clearFiltersButton}
                 onPress={() => {
                   setSelectedType('All');
                   setSelectedLevel('All');
                   setShowTypeDropdown(false);
                   setShowLevelDropdown(false);
                 }}
               >
                 <Text style={styles.clearFiltersText}>{t('screens.library.filters.clearFilters')}</Text>
               </TouchableOpacity>
             )}
           </View>
         }
         ListEmptyComponent={
           <View style={styles.emptyContainer}>
             <Ionicons name="library-outline" size={64} color="#9CA3AF" />
             <Text style={styles.emptyTitle}>
               {searchQuery ? t('screens.library.states.noResults') : t('screens.library.states.noResources')}
             </Text>
             <Text style={styles.emptyText}>
               {searchQuery 
                 ? t('screens.library.states.noResultsMessage', { query: searchQuery })
                 : t('screens.library.states.noResourcesMessage')
               }
             </Text>
             {searchQuery && (
               <TouchableOpacity
                 style={styles.clearSearchEmptyButton}
                 onPress={() => setSearchQuery('')}
               >
                 <Text style={styles.clearSearchEmptyText}>{t('screens.library.states.clearSearch')}</Text>
               </TouchableOpacity>
             )}
           </View>
         }
       />

      {/* Type modal */}
      <Modal
        visible={showTypeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeDropdown(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowTypeDropdown(false)} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{t('screens.library.filters.selectType')}</Text>
          <ScrollView>
            {typeOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.dropdownOption, selectedType === opt && styles.dropdownOptionSelected]}
                onPress={() => {
                  setSelectedType(opt);
                  setShowTypeDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Level modal */}
      {selectedMedia !== 'book' && (
        <Modal
          visible={showLevelDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLevelDropdown(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowLevelDropdown(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('screens.library.filters.selectLevel')}</Text>
            <ScrollView>
              {levelOptions.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.dropdownOption, selectedLevel === opt && styles.dropdownOptionSelected]}
                  onPress={() => {
                    setSelectedLevel(opt);
                    setShowLevelDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  shareButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    padding: 0,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  
  // Tab Styles
  tabsBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: '#6366F1',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  
  // Filter Styles
  filtersBar: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdownButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearFiltersButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  
  // Modal Styles
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalCard: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 120,
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    color: '#1E293B',
  },
  dropdownOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F1F5F9',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  
  // Item Styles
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediaIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 8,
  },
  itemMeta: {
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Separator
  separator: {
    height: 16,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearSearchEmptyButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchEmptyText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LibraryScreen;



