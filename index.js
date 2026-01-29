/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry, I18nManager } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import installNetworkLogger from './src/utils/networkInterceptor';

// Force LTR layout at the earliest point
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// Install network logger as early as possible
installNetworkLogger({
  logRequestHeaders: true,
  logRequestBody: true,
  logResponseHeaders: true,
  logResponseBody: true,
});

AppRegistry.registerComponent(appName, () => App);
