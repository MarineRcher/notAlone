const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require('nativewind/metro');

/**
 * Metro configuration
 * https://metrobundler.dev/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname, { isCSSEnabled: true });

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
module.exports = withNativeWind(config, { input: './src/styles/global.css' })


