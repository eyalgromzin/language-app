import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';

function LibraryScreen(): React.JSX.Element {
  const [urls, setUrls] = React.useState<{ url: string; type: string; level: string }[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const apiBaseUrl = React.useMemo(() => {
    return 'http://127.0.0.1:3000';
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
          setUrls(Array.isArray(json?.urls) ? json.urls : []);
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
        data={urls}
        keyExtractor={(item) => item.url}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
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



