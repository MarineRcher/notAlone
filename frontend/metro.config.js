const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.transformer.babelTransformerPath = require.resolve(
    "react-native-svg-transformer"
);
config.resolver.assetExts = config.resolver.assetExts.filter(
    (ext) => ext !== "svg"
);
config.resolver.sourceExts.push("svg");

// Configure crypto aliases for e2ee functionality
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'crypto') {
    // Resolve crypto to react-native-quick-crypto
    return context.resolveRequest(
      context,
      'react-native-quick-crypto',
      platform
    );
  }
  if (moduleName === 'buffer') {
    // Resolve buffer to @craftzdog/react-native-buffer
    return context.resolveRequest(
      context,
      '@craftzdog/react-native-buffer',
      platform
    );
  }
  if (moduleName === 'stream') {
    // Resolve stream to readable-stream
    return context.resolveRequest(
      context,
      'readable-stream',
      platform
    );
  }
  
  // Otherwise chain to the standard Metro resolver
  return context.resolveRequest(context, moduleName, platform);
};

config.transformer.getTransformOptions = async () => ({
    transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
    },
});

module.exports = config;
