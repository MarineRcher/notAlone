const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.transformer.babelTransformerPath = require.resolve(
    "react-native-svg-transformer"
);
config.resolver.assetExts = config.resolver.assetExts.filter(
    (ext) => ext !== "svg"
);
config.resolver.sourceExts.push("svg");

config.transformer.getTransformOptions = async () => ({
    transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
    },
});

module.exports = config;
