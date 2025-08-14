/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import installNetworkLogger from './src/utils/networkInterceptor';

// Install network logger as early as possible
installNetworkLogger({
  logRequestHeaders: true,
  logRequestBody: true,
  logResponseHeaders: true,
  logResponseBody: true,
});

AppRegistry.registerComponent(appName, () => App);
