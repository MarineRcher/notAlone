const io = require("socket.io-client");

async function testWaitroomWithRealUsers() {
	console.log("🧪 [WAITROOM-REAL-TEST] Testing waitroom with real user IDs...");

	// Create test users with real UUIDs like the frontend would send
	const testUsers = [
		{ id: "10050000-0000-0000-0000-000000000005", username: "Eve (Real User)" },
		{ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", username: "Real User 1" },
		{ id: "f9e8d7c6-b5a4-3210-9876-543210fedcba", username: "Real User 2" },
	];

	const sockets = [];

	for (let i = 0; i < testUsers.length; i++) {
		const user = testUsers[i];
		
		setTimeout(() => {
			console.log(`👤 [WAITROOM-REAL-TEST] Connecting ${user.username}...`);
			
			const socket = io("http://localhost:3000", {
				auth: {
					// This simulates how the frontend sends real user IDs
					token: `mock_jwt_token_${user.id}`,
				},
				transports: ['websocket'],
			});

			sockets.push({ socket, user });

			socket.on('connect', () => {
				console.log(`✅ [WAITROOM-REAL-TEST] ${user.username} connected:`, socket.id);
				console.log(`📋 [WAITROOM-REAL-TEST] ${user.username} joining waitroom...`);
				socket.emit('join_waitroom');
			});

			socket.on('disconnect', () => {
				console.log(`❌ [WAITROOM-REAL-TEST] ${user.username} disconnected`);
			});

			socket.on('connect_error', (error) => {
				console.error(`❌ [WAITROOM-REAL-TEST] ${user.username} connection error:`, error);
			});

			// Waitroom events
			socket.on('waitroom_joined', (data) => {
				console.log(`📋 [WAITROOM-REAL-TEST] ${user.username} joined waitroom:`, {
					waitingUsers: data.waitingUsers.length,
					minMembers: data.minMembers,
					currentCount: data.currentCount,
				});
			});

			socket.on('waitroom_updated', (data) => {
				console.log(`📢 [WAITROOM-REAL-TEST] ${user.username} waitroom updated:`, {
					waitingUsers: data.waitingUsers.length,
					minMembers: data.minMembers,
					currentCount: data.currentCount,
				});
			});

			socket.on('group_created', (data) => {
				console.log(`🎉 [WAITROOM-REAL-TEST] ${user.username} group created!`, {
					groupId: data.groupId,
					groupName: data.groupName,
					members: data.members.length,
				});
			});

			socket.on('waitroom_error', (data) => {
				console.error(`❌ [WAITROOM-REAL-TEST] ${user.username} waitroom error:`, data);
			});

		}, i * 3000); // Stagger connections by 3 seconds
	}

	// Clean up after 25 seconds
	setTimeout(() => {
		console.log("🧹 [WAITROOM-REAL-TEST] Cleaning up connections...");
		sockets.forEach(({ socket, user }) => {
			if (socket.connected) {
				console.log(`🔌 [WAITROOM-REAL-TEST] Disconnecting ${user.username}`);
				socket.disconnect();
			}
		});

		setTimeout(() => {
			console.log("✅ [WAITROOM-REAL-TEST] Test completed");
			process.exit(0);
		}, 2000);
	}, 25000);
}

// Handle process exit
process.on("SIGINT", () => {
	console.log("\n👋 [WAITROOM-REAL-TEST] Test interrupted. Exiting...");
	process.exit(0);
});

testWaitroomWithRealUsers(); 