const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
	resolver: {
		extraNodeModules: {
			'react-native-fs': require.resolve('@dr.pogodin/react-native-fs'),
			'events': require.resolve('./__mocks__/events.js'),
		},
	},
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
