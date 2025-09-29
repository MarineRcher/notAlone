const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
	const config = getDefaultConfig(__dirname);

	// Récupère les extensions par défaut
	const { assetExts, sourceExts } = config.resolver;

	config.transformer.babelTransformerPath = require.resolve(
		"react-native-svg-transformer",
	);

	config.resolver.assetExts = assetExts.filter(ext => ext !== "svg");
	config.resolver.sourceExts = [...sourceExts, "svg"];

	// Aliases crypto/buffer/stream
	config.resolver.resolveRequest = (context, moduleName, platform) => {
		if (moduleName === "crypto") {
			return context.resolveRequest(
				context,
				"react-native-quick-crypto",
				platform,
			);
		}
		if (moduleName === "buffer") {
			return context.resolveRequest(
				context,
				"@craftzdog/react-native-buffer",
				platform,
			);
		}
		if (moduleName === "stream") {
			return context.resolveRequest(context, "readable-stream", platform);
		}

		return context.resolveRequest(context, moduleName, platform);
	};

	config.transformer.getTransformOptions = async () => ({
		transform: {
			experimentalImportSupport: false,
			inlineRequires: true,
		},
	});

	return config;
})();
