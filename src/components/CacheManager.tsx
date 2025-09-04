import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { cachedApiService } from '../services/cachedApiService';
import { CacheableEndpoint } from '../services/apiCacheService';

interface CacheStats {
  totalEntries: number;
  size: number;
  lastCleanup: number;
  version: string;
}

const CacheManager: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    try {
      const cacheStats = await cachedApiService.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('[CacheManager] Failed to load stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const clearAllCache = async () => {
    Alert.alert(
      'Clear All Cache',
      'Are you sure you want to clear all cached data? This will force fresh API calls.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await cachedApiService.clearAllCache();
              await loadStats();
              Alert.alert('Success', 'All cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const clearEndpointCache = async (endpoint: CacheableEndpoint) => {
    Alert.alert(
      `Clear ${endpoint} Cache`,
      `Are you sure you want to clear the cache for ${endpoint}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await cachedApiService.clearEndpointCache(endpoint);
              await loadStats();
              Alert.alert('Success', `${endpoint} cache cleared successfully`);
            } catch (error) {
              Alert.alert('Error', `Failed to clear ${endpoint} cache`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const forceCleanup = async () => {
    setLoading(true);
    try {
      await cachedApiService.forceCleanup();
      await loadStats();
      Alert.alert('Success', 'Cache cleanup completed');
    } catch (error) {
      Alert.alert('Error', 'Failed to cleanup cache');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const endpoints: CacheableEndpoint[] = [
    'HARMFUL_WORDS',
    'TRANSLATE',
    'LIBRARY_GET_META',
    'GET_LANGUAGES',
    'BABY_STEPS_GET',
    'BABY_STEPS_GET_STEP',
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cache Manager</Text>
      
      {/* Cache Statistics */}
      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Cache Statistics</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Entries:</Text>
            <Text style={styles.statValue}>{stats.totalEntries}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cache Size:</Text>
            <Text style={styles.statValue}>{stats.size}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Last Cleanup:</Text>
            <Text style={styles.statValue}>{formatDate(stats.lastCleanup)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>App Version:</Text>
            <Text style={styles.statValue}>{stats.version}</Text>
          </View>
        </View>
      )}

      {/* Cache Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Cache Actions</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={loadStats}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Refresh Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={forceCleanup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Force Cleanup</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearAllCache}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Clear All Cache</Text>
        </TouchableOpacity>
      </View>

      {/* Endpoint Cache Control */}
      <View style={styles.endpointsContainer}>
        <Text style={styles.sectionTitle}>Endpoint Cache Control</Text>
        
        {endpoints.map((endpoint) => (
          <TouchableOpacity
            key={endpoint}
            style={[styles.button, styles.endpointButton]}
            onPress={() => clearEndpointCache(endpoint)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Clear {endpoint}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  endpointsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  endpointButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});

export default CacheManager;
