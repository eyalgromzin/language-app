import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Linking } from 'react-native';

type LibraryItem = {
  url: string;
  name: string;
  language: string;
  typeId: number;
  level: string;
};

type LibraryData = {
  itemTypes: { id: number; name: string }[];
  levels: { id: number; name: string }[];
  languages: { id: number; name: string; symbol: string }[];
  library: LibraryItem[];
};

function LibraryScreen(): React.JSX.Element {
  const data = (require('./library.json') as LibraryData);

  const typeNameById = React.useMemo(() => {
    const map: Record<number, string> = {};
    data.itemTypes.forEach(t => { map[t.id] = t.name; });
    return map;
  }, [data.itemTypes]);

  const renderItem = ({ item }: { item: LibraryItem }) => {
    const typeName = typeNameById[item.typeId] ?? String(item.typeId);
    return (
      <TouchableOpacity
        accessibilityRole="link"
        onPress={() => Linking.openURL(item.url)}
        style={styles.item}
      >
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.metaRow}>
          <View style={styles.pill}><Text style={styles.pillText}>{typeName}</Text></View>
          <View style={[styles.pill, styles.levelPill]}><Text style={styles.pillText}>{item.level}</Text></View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data.library}
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
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  levelPill: {
    backgroundColor: '#E8F0FF',
  },
  pillText: {
    fontSize: 12,
    color: '#333',
  },
  separator: {
    height: 12,
  },
});

export default LibraryScreen;



