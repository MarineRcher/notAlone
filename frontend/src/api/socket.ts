import { io } from "socket.io-client";
import { apiConfig } from "../config/api";
import { authHelpers } from "./authHelpers";

console.log(
	"🔌 Attempting to connect to Socket.IO server at:",
	apiConfig.socketURL
);

// Create socket instance (will be connected when authentication is available)
const socket = io(apiConfig.socketURL, {
	// Force WebSocket transport for better mobile compatibility
	transports: ["websocket", "polling"],

	// Connection timeout
	timeout: 10000,

	// Reconnection settings
	reconnection: true,
	reconnectionAttempts: 5,
	reconnectionDelay: 1000,

	// Don't auto-connect - we'll connect manually when authenticated
	autoConnect: false,
});

// Function to connect with authentication
export const connectWithAuth = async (): Promise<boolean> =>
{
	try
	{
		const token = await authHelpers.getValidToken();

		if (!token)
		{
			console.log("❌ No valid authentication token available");
			return false;
		}

		// Disconnect if already connected
		if (socket.connected)
		{
			socket.disconnect();
		}

		// Update auth token on existing socket instead of creating new one
		socket.auth = { token: token };

		return new Promise((resolve) =>
		{
			const timeout = setTimeout(() =>
			{
				console.log("❌ Connection timeout");
				resolve(false);
			}, 10000);

			const onConnect = () =>
			{
				clearTimeout(timeout);
				console.log("✅ Socket.IO connected with authentication");
				console.log("🔗 Transport:", socket.io.engine.transport.name);
				console.log("📱 Socket ID:", socket.id);
				socket.off("connect", onConnect);
				socket.off("connect_error", onConnectError);
				resolve(true);
			};

			const onConnectError = (error: any) =>
			{
				clearTimeout(timeout);
				console.error("🚨 Socket.IO connection error:", error.message);
				console.error("🔍 Error details:", error);
				socket.off("connect", onConnect);
				socket.off("connect_error", onConnectError);
				resolve(false);
			};

			socket.on("connect", onConnect);
			socket.on("connect_error", onConnectError);

			// Connect with the updated auth token
			socket.connect();
		});
	}
	catch (error)
	{
		console.error("❌ Error connecting with auth:", error);
		return false;
	}
};

// Function to disconnect
export const disconnect = () =>
{
	if (socket)
	{
		socket.disconnect();
	}
};

// Enhanced logging for debugging
socket.on("connect", () =>
{
	console.log("✅ Socket.IO connected successfully");
	console.log("🔗 Transport:", socket.io.engine.transport.name);
	console.log("📱 Socket ID:", socket.id);
});

socket.on("disconnect", (reason) =>
{
	console.log("❌ Socket.IO disconnected:", reason);
});

socket.on("connect_error", (error) =>
{
	console.error("🚨 Socket.IO connection error:", error.message);
	console.error("🔍 Error details:", error);
	console.log("🌐 Trying to connect to:", apiConfig.socketURL);
});

socket.on("reconnect", (attemptNumber) =>
{
	console.log("🔄 Socket.IO reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_error", (error) =>
{
	console.error("🔄❌ Socket.IO reconnection error:", error.message);
});

socket.on("reconnect_failed", () =>
{
	console.error("💥 Socket.IO reconnection failed - giving up");
});

export { socket };
