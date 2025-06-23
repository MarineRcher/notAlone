#!/bin/bash

echo "🔐 Installing crypto dependencies for e2ee group chat..."

# Install the crypto dependencies using yarn
echo "📦 Installing react-native-quick-crypto..."
yarn add react-native-quick-crypto@^0.7.14

echo "📦 Installing react-native-nitro-modules..."
yarn add react-native-nitro-modules@^0.4.5

echo "📦 Installing @craftzdog/react-native-buffer (for compatibility)..."
yarn add @craftzdog/react-native-buffer

echo "🔧 Installing crypto polyfills..."
yarn add readable-stream

echo "✅ Crypto dependencies installed successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. Run 'expo prebuild' if using Expo managed workflow"
echo "2. For bare React Native, run 'cd ios && pod install'"
echo "3. Configure Metro to alias crypto modules (see metro.config.js)"
echo ""
echo "📝 Note: You may need to restart your development server after installation." 