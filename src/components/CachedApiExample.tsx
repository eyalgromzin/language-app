import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  useHarmfulWords,
  useTranslation,
  useLanguages,
  useBabySteps,
  useBabyStep,
} from '../hooks/useCachedApi';

const CachedApiExample: React.FC = () => {
  const [translationWord, setTranslationWord] = useState('hello');
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('es');
  const [selectedLanguage, setSelectedLanguage] = useState('es');
  const [selectedStepId, setSelectedStepId] = useState('1');

  // Use cached hooks
  const { data: harmfulWords, loading: harmfulWordsLoading, error: harmfulWordsError } = useHarmfulWords();
  const { data: translation, loading: translationLoading, error: translationError, refetch: refetchTranslation } = useTranslation(
    translationWord,
    fromLang,
    toLang,
    false // Don't auto-fetch
  );
  const { data: languages, loading: languagesLoading, error: languagesError } = useLanguages();
  const { data: babySteps, loading: babyStepsLoading, error: babyStepsError } = useBabySteps(selectedLanguage);
  const { data: babyStep, loading: babyStepLoading, error: babyStepError } = useBabyStep(selectedLanguage, selectedStepId);

  const handleTranslate = () => {
    if (translationWord && fromLang && toLang) {
      refetchTranslation();
    } else {
      Alert.alert('Error', 'Please fill in all translation fields');
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cached API Example</Text>
      
      {/* Harmful Words Section */}
      {renderSection('Harmful Words (Auto-cached)', (
        <View>
          {harmfulWordsLoading ? (
            <Text style={styles.loading}>Loading harmful words...</Text>
          ) : harmfulWordsError ? (
            <Text style={styles.error}>Error: {harmfulWordsError.message}</Text>
          ) : (
            <View>
              <Text style={styles.dataText}>
                Total harmful words: {harmfulWords?.length || 0}
              </Text>
              <Text style={styles.dataText}>
                First few words: {harmfulWords?.slice(0, 3).join(', ') || 'None'}
              </Text>
            </View>
          )}
        </View>
      ))}

      {/* Translation Section */}
      {renderSection('Translation (Parameter-based caching)', (
        <View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Word:</Text>
            <Text style={styles.value}>{translationWord}</Text>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>From:</Text>
            <Text style={styles.value}>{fromLang}</Text>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>To:</Text>
            <Text style={styles.value}>{toLang}</Text>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleTranslate}>
            <Text style={styles.buttonText}>Translate</Text>
          </TouchableOpacity>
          
          {translationLoading ? (
            <Text style={styles.loading}>Translating...</Text>
          ) : translationError ? (
            <Text style={styles.error}>Error: {translationError.message}</Text>
          ) : translation ? (
            <Text style={styles.result}>Translation: {translation}</Text>
          ) : (
            <Text style={styles.hint}>Click translate to get cached or fresh translation</Text>
          )}
        </View>
      ))}

      {/* Languages Section */}
      {renderSection('Languages (Auto-cached)', (
        <View>
          {languagesLoading ? (
            <Text style={styles.loading}>Loading languages...</Text>
          ) : languagesError ? (
            <Text style={styles.error}>Error: {languagesError.message}</Text>
          ) : (
            <View>
              <Text style={styles.dataText}>
                Total languages: {languages?.length || 0}
              </Text>
              <Text style={styles.dataText}>
                Available: {languages?.map(l => l.symbol).join(', ') || 'None'}
              </Text>
            </View>
          )}
        </View>
      ))}

      {/* Baby Steps Section */}
      {renderSection('Baby Steps (Language-based caching)', (
        <View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Language:</Text>
            <Text style={styles.value}>{selectedLanguage}</Text>
          </View>
          
          {babyStepsLoading ? (
            <Text style={styles.loading}>Loading baby steps...</Text>
          ) : babyStepsError ? (
            <Text style={styles.error}>Error: {babyStepsError.message}</Text>
          ) : (
            <View>
              <Text style={styles.dataText}>
                Total steps: {babySteps?.length || 0}
              </Text>
              <Text style={styles.dataText}>
                First step: {babySteps?.[0]?.title || 'None'}
              </Text>
            </View>
          )}
        </View>
      ))}

      {/* Specific Baby Step Section */}
      {renderSection('Specific Baby Step (Step-based caching)', (
        <View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Language:</Text>
            <Text style={styles.value}>{selectedLanguage}</Text>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Step ID:</Text>
            <Text style={styles.value}>{selectedStepId}</Text>
          </View>
          
          {babyStepLoading ? (
            <Text style={styles.loading}>Loading baby step...</Text>
          ) : babyStepError ? (
            <Text style={styles.error}>Error: {babyStepError.message}</Text>
          ) : babyStep ? (
            <View>
              <Text style={styles.dataText}>
                Step: {babyStep.title || 'No title'}
              </Text>
              <Text style={styles.dataText}>
                Description: {babyStep.description || 'No description'}
              </Text>
            </View>
          ) : (
            <Text style={styles.hint}>No step data available</Text>
          )}
        </View>
      ))}

      {/* Cache Information */}
      {renderSection('Cache Information', (
        <View>
          <Text style={styles.infoText}>
            • Harmful words are automatically cached on first load
          </Text>
          <Text style={styles.infoText}>
            • Translations are cached per word/language combination
          </Text>
          <Text style={styles.infoText}>
            • Languages are cached once and shared across the app
          </Text>
          <Text style={styles.infoText}>
            • Baby steps are cached per language
          </Text>
          <Text style={styles.infoText}>
            • All cache expires after 1 week or app version change
          </Text>
        </View>
      ))}
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
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    fontSize: 16,
    color: '#FF9500',
    fontStyle: 'italic',
    marginTop: 8,
  },
  error: {
    fontSize: 16,
    color: '#FF3B30',
    marginTop: 8,
  },
  result: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
    marginTop: 8,
  },
  hint: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
  },
  dataText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default CachedApiExample;
