import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Linking, ActivityIndicator, Platform, NativeModules } from 'react-native';

function LibraryScreen(): React.JSX.Element {
  const [urls, setUrls] = React.useState<{ url: string; type: string; level: string }[]>([]);
  const [allUrls, setAllUrls] = React.useState<{ url: string; type: string; level: string }[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedType, setSelectedType] = React.useState<string>('All');
  const [selectedLevel, setSelectedLevel] = React.useState<string>('All');
  const [showTypeDropdown, setShowTypeDropdown] = React.useState<boolean>(false);
  const [showLevelDropdown, setShowLevelDropdown] = React.useState<boolean>(false);

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

  React.useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${apiBaseUrl}/library/getUrls`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: 'en' }),
        });
        const json: { urls?: { url: string; type: string; level: string }[] } = await response.json();
        if (!isCancelled) {
          const initial = Array.isArray(json?.urls) ? json.urls : [];
          setAllUrls(initial);
          setUrls(initial);
        }
      } catch (e) {
        if (!isCancelled) {
          setError('Failed to load URLs');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl]);

  const typeOptions = React.useMemo(() => {
    const source = allUrls.length ? allUrls : urls;
    const unique = Array.from(new Set(source.map((u) => u.type)));
    return ['All', ...unique];
  }, [urls, allUrls]);

  const levelOptions = React.useMemo(() => {
    const source = allUrls.length ? allUrls : urls;
    const unique = Array.from(new Set(source.map((u) => u.level)));
    return ['All', ...unique];
  }, [urls, allUrls]);

  const filteredUrls = React.useMemo(() => {
    return urls.filter((u) => (selectedType === 'All' || u.type === selectedType) && (selectedLevel === 'All' || u.level === selectedLevel));
  }, [urls, selectedType, selectedLevel]);

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
          body: JSON.stringify({ language: 'en', level: selectedLevel, type: selectedType }),
        });
        const json: { urls?: string[] } = await response.json();
        if (!isCancelled) {
          const next = (json.urls ?? []).map((url) => ({ url, type: selectedType, level: selectedLevel }));
          setUrls(next);
        }
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
  }, [selectedType, selectedLevel, apiBaseUrl, allUrls]);

  const renderItem = ({ item }: { item: { url: string; type: string; level: string } }) => {
    return (
      <TouchableOpacity
        accessibilityRole="link"
        onPress={() => Linking.openURL(item.url)}
        style={styles.item}
      >
        <Text style={styles.itemName} numberOfLines={2}>{item.url}</Text>
        <Text>{`${item.type} • ${item.level}`}</Text>
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
                {showTypeDropdown && (
                  <View style={styles.dropdownMenu}>
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
                  </View>
                )}
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
                {showLevelDropdown && (
                  <View style={styles.dropdownMenu}>
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
                  </View>
                )}
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



