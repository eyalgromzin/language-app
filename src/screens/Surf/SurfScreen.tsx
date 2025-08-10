import React from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';

function SurfScreen(): React.JSX.Element {
  const [addressText, setAddressText] = React.useState<string>('https://example.com');
  const [currentUrl, setCurrentUrl] = React.useState<string>('https://example.com');

  const normalizeUrl = (input: string): string => {
    if (!input) return 'about:blank';
    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(input);
    return hasScheme ? input : `https://${input}`;
  };

  const submit = () => {
    setCurrentUrl(normalizeUrl(addressText.trim()));
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.urlBarContainer}>
        <TextInput
          style={styles.urlInput}
          value={addressText}
          onChangeText={setAddressText}
          onSubmitEditing={submit}
          placeholder="Enter website URL"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
        />
        <Button title="OK" onPress={submit} />
      </View>
      <WebView source={{ uri: currentUrl }} style={styles.webView} />
    </View>
  );
}

const styles = StyleSheet.create({
  urlBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  urlInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  webView: {
    flex: 1,
  },
});

export default SurfScreen;


