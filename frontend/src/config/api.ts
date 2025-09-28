/**
 * API Configuration
 * Centralized configuration for all API endpoints and URLs
 */

// Default configuration - can be overridden by environment variables
const defaultConfig = {
	API_BASE_URL: "https://notalone.davidgailleton.me",
	SOCKET_URL: "https://notalone.davidgailleton.me",
};

/**
 * Get configuration from environment or use defaults
 * In React Native/Expo, environment variables need to be available at build time
 */
export const apiConfig = {
	// API base URL for HTTP requests
	baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || defaultConfig.API_BASE_URL,

	// Socket.IO server URL
	socketURL: process.env.EXPO_PUBLIC_SOCKET_URL || defaultConfig.SOCKET_URL,

	// Full API URL with /api path
	get apiURL() {
		return `${this.baseURL}/api`;
	},

	// Timeout for API requests
	timeout: 10000,
};

/**
 * Development helper to easily switch between different environments
 */
export const setDevelopmentConfig = (config: Partial<typeof defaultConfig>) => {
	if (__DEV__) {
		Object.assign(apiConfig, {
			baseURL: config.API_BASE_URL || apiConfig.baseURL,
			socketURL: config.SOCKET_URL || apiConfig.socketURL,
		});
	}
};

/**
 * Network diagnostic helper
 */
export const getNetworkDiagnostics = () => {
	const currentIP = apiConfig.socketURL
		.replace("http://", "")
		.replace(":3000", "");

	return {
		currentIP,
		commonIPs: [
			"localhost", // If running on same device
			"192.168.1.155", // Common home network range
			"192.168.0.155", // Another common range
			"10.0.0.155", // Another common range
			"172.20.10.2", // Mobile hotspot range
		],
		helpText: `
🔧 Connection Troubleshooting:

Current server address: ${apiConfig.socketURL}

If connection fails, try these steps:

1. Make sure your backend is running:
   cd backend && npm start (or yarn start)

2. Check your backend logs for the server IP address

3. Common IP addresses to try:
   - localhost:3000 (if running on same device)
   - 192.168.1.x:3000 (home WiFi)
   - 192.168.0.x:3000 (home WiFi variant)
   - 10.0.0.x:3000 (office networks)

4. To change the IP address:
   - Edit frontend/src/config/api.ts
   - Or set environment variable EXPO_PUBLIC_SOCKET_URL

5. Make sure both frontend and backend are on the same network
    `,
	};
};

// Log configuration in development mode
if (__DEV__) {
	console.log("🔧 API Configuration:", {
		baseURL: apiConfig.baseURL,
		socketURL: apiConfig.socketURL,
		apiURL: apiConfig.apiURL,
	});

	const diagnostics = getNetworkDiagnostics();

	console.log(diagnostics.helpText);
}

export default apiConfig;
