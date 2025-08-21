import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Platform, NativeModules, Modal, Pressable, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

function LibraryScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
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

  const apiBaseUrl = React.useMemo(() => {
    // In dev, derive host from Metro bundler URL so device can reach the PC
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    if (scriptURL) {
      try {
        const { hostname } = new URL(scriptURL);
        return `http://${hostname}:3000`;
      } catch {}
    }
    // Fallbacks for emulators/simulators
    return 'http://localhost:3000';
  }, []);

  // Resolve persisted learning language
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const value = await AsyncStorage.getItem('language.learning');
        if (!mounted) return;
        setLearningLanguage(value ?? null);
      } catch {
        if (!mounted) return;
        setLearningLanguage(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toLanguageSymbol = React.useCallback((input: string | null): 'en' | 'es' => {
    const v = (input || '').trim().toLowerCase();
    if (v === 'es' || v === 'spanish') return 'es';
    return 'en';
  }, []);

  // Initial load relies on selected media effect that queries getUrlsWithCriterias
  // with only language parameter to populate the list.

  React.useEffect(() => {
    let isCancelled = false;
    const loadMeta = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/library/getMeta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const json: { itemTypes?: string[]; levels?: string[] } = await response.json();
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
  }, [apiBaseUrl]);

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

  const filteredUrls = React.useMemo(() => {
    return urls.filter(
      (u) =>
        (selectedMedia === 'all' || u.media === selectedMedia) &&
        (selectedType === 'All' || u.type === selectedType) &&
        (selectedLevel === 'All' || u.level === selectedLevel),
    );
  }, [urls, selectedType, selectedLevel, selectedMedia]);

  React.useEffect(() => {
    if (!allUrls.length) return;
    let isCancelled = false;
    const run = async () => {
      try {
        setError(null);
        if (selectedType === 'All' || selectedLevel === 'All') {
          // Show all when any filter is All
          setUrls(allUrls);
          return;
        }
        setLoading(true);
        const response = await fetch(`${apiBaseUrl}/library/getUrlsWithCriterias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: toLanguageSymbol(learningLanguage), level: selectedLevel, type: selectedType }),
        });
        const json: { urls?: { url: string; name?: string; type: string; level: string; media: string }[] } = await response.json();
        if (!isCancelled) setUrls(json.urls ?? []);
      } catch (e) {
        if (!isCancelled) setError('Failed to load URLs');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    run();
    return () => {
      isCancelled = true;
    };
  }, [selectedType, selectedLevel, apiBaseUrl, allUrls, toLanguageSymbol, learningLanguage]);

  // On tab change, fetch from server with empty media/level/type (only language)
  React.useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      try {
        setError(null);
        const response = await fetch(`${apiBaseUrl}/library/getUrlsWithCriterias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: toLanguageSymbol(learningLanguage) }),
        });
        const json: { urls?: { url: string; name?: string; type: string; level: string; media: string }[] } = await response.json();
        if (!isCancelled) {
          const list = json.urls ?? [];
          setUrls(list);
          setAllUrls(list);
        }
      } catch (e) {
        if (!isCancelled) setError('Failed to load URLs');
      }
    };
    run();
    return () => {
      isCancelled = true;
    };
  }, [selectedMedia, apiBaseUrl, toLanguageSymbol, learningLanguage]);

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

  const renderItem = ({ item }: { item: { url: string; name?: string; type: string; level: string; media: string } }) => {
    return (
      <TouchableOpacity
        accessibilityRole="link"
        onPress={() => navigation.navigate('Surf', { url: item.url })}
        style={styles.item}
      >
        <Text style={styles.itemName} numberOfLines={2}>{getDisplayName(item)}</Text>
        <Text>{`${item.type} • ${item.level} • ${item.media}`}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.listContent]}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsBar}>
        {([
          { key: 'all', label: 'All' },
          { key: 'web', label: 'Web' },
          { key: 'youtube', label: 'YouTube' },
          { key: 'book', label: 'Books' },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, selectedMedia === tab.key && styles.tabButtonActive]}
            onPress={() => setSelectedMedia(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedMedia === tab.key }}
          >
            <Text style={[styles.tabText, selectedMedia === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
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
                  <Text style={styles.dropdownButtonText}>Type: {selectedType}</Text>
                </TouchableOpacity>
                {/* options rendered in modal overlay */}
              </View>

              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => {
                    setShowLevelDropdown((prev) => !prev);
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownButtonText}>Level: {selectedLevel}</Text>
                </TouchableOpacity>
                {/* options rendered in modal overlay */}
              </View>
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
                <Text style={styles.clearFiltersText}>Clear filters</Text>
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
          <Text style={styles.modalTitle}>Select Type</Text>
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
      <Modal
        visible={showLevelDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLevelDropdown(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowLevelDropdown(false)} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Select Level</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  tabButtonActive: {
    backgroundColor: '#111827',
  },
  tabText: {
    color: '#111827',
    fontWeight: '600',
  },
  tabTextActive: {
    color: 'white',
  },
  filtersBar: {
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownContainer: {
    flex: 1,
  },
  dropdownButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownOptionSelected: {
    backgroundColor: '#f3f4f6',
  },
  dropdownOptionText: {
    fontSize: 14,
  },
  clearFiltersButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#374151',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 100,
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  item: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  separator: {
    height: 12,
  },
});

export default LibraryScreen;



