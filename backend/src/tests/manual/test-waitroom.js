const io = require("socket.io-client");

async function testWaitroom() {
	console.log("🧪 [WAITROOM-TEST] Starting waitroom test...");

	// Create multiple test users
	const testUsers = [
		{ id: "alice", username: "Alice" },
		{ id: "bob", username: "Bob" },
		{ id: "charlie", username: "Charlie" },
		{ id: "diana", username: "Diana" },
	];

	const sockets = [];

	for (let i = 0; i < testUsers.length; i++) {
		const user = testUsers[i];
		
		setTimeout(() => {
			console.log(`👤 [WAITROOM-TEST] Connecting ${user.username}...`);
			
			const socket = io("http://localhost:3000", {
				auth: {
					token: `mock_jwt_token_${user.id}`,
				},
				transports: ['websocket'],
			});

			sockets.push({ socket, user });

			socket.on('connect', () => {
				console.log(`✅ [WAITROOM-TEST] ${user.username} connected:`, socket.id);
				console.log(`📋 [WAITROOM-TEST] ${user.username} joining waitroom...`);
				socket.emit('join_waitroom');
			});

			socket.on('disconnect', () => {
				console.log(`❌ [WAITROOM-TEST] ${user.username} disconnected`);
			});

			socket.on('connect_error', (error) => {
				console.error(`❌ [WAITROOM-TEST] ${user.username} connection error:`, error);
			});

			// Waitroom events
			socket.on('waitroom_joined', (data) => {
				console.log(`📋 [WAITROOM-TEST] ${user.username} joined waitroom:`, {
					waitingUsers: data.waitingUsers.length,
					minMembers: data.minMembers,
					currentCount: data.currentCount,
				});
			});

			socket.on('waitroom_updated', (data) => {
				console.log(`📢 [WAITROOM-TEST] ${user.username} waitroom updated:`, {
					waitingUsers: data.waitingUsers.length,
					minMembers: data.minMembers,
					currentCount: data.currentCount,
				});
			});

			socket.on('group_created', (data) => {
				console.log(`🎉 [WAITROOM-TEST] ${user.username} group created!`, {
					groupId: data.groupId,
					groupName: data.groupName,
					members: data.members.length,
				});
			});

			socket.on('waitroom_error', (data) => {
				console.error(`❌ [WAITROOM-TEST] ${user.username} waitroom error:`, data);
			});

		}, i * 2000); // Stagger connections by 2 seconds
	}

	// Test leaving waitroom after 15 seconds
	setTimeout(() => {
		if (sockets.length > 0) {
			const { socket, user } = sockets[0];
			console.log(`🚪 [WAITROOM-TEST] ${user.username} leaving waitroom...`);
			socket.emit('leave_waitroom');
		}
	}, 15000);

	// Clean up after 30 seconds
	setTimeout(() => {
		console.log("🧹 [WAITROOM-TEST] Cleaning up connections...");
		sockets.forEach(({ socket, user }) => {
			if (socket.connected) {
				console.log(`🔌 [WAITROOM-TEST] Disconnecting ${user.username}`);
				socket.disconnect();
			}
		});

		setTimeout(() => {
			console.log("✅ [WAITROOM-TEST] Test completed");
			process.exit(0);
		}, 2000);
	}, 30000);
}

// Handle process exit
process.on("SIGINT", () => {
	console.log("\n👋 [WAITROOM-TEST] Test interrupted. Exiting...");
	process.exit(0);
});

testWaitroom(); 