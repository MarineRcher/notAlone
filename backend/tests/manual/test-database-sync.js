const io = require("socket.io-client");

async function testDatabaseSync() {
	console.log("🧪 [DB-SYNC] Starting database synchronization test...");

	// Create connection
	const aliceSocket = io("http://localhost:3000", {
		auth: { token: "mock_jwt_token_alice" },
	});

	const testGroupId = "test-db-sync-group";

	return new Promise((resolve, reject) => {
		let connected = false;
		let joined = false;

		// Alice connection
		aliceSocket.on("connect", () => {
			console.log("✅ [DB-SYNC] Alice connected");
			connected = true;

			// Join group
			console.log("👥 [DB-SYNC] Alice joining group...");
			aliceSocket.emit("join_group", { groupId: testGroupId });
		});

		aliceSocket.on("group_members", data => {
			console.log("👥 [DB-SYNC] Alice got group members:", data.members.length);
			joined = true;

			// Wait a bit then test leaving
			setTimeout(() => {
				console.log("🚪 [DB-SYNC] Alice leaving group...");
				aliceSocket.emit("leave_group", { groupId: testGroupId });

				setTimeout(() => {
					console.log(
						"✅ [DB-SYNC] Test completed! Check server logs for database operations.",
					);
					aliceSocket.disconnect();
					resolve();
				}, 2000);
			}, 3000);
		});

		// Error handling
		aliceSocket.on("connect_error", error => {
			console.error("❌ [DB-SYNC] Connection error:", error);
			reject(error);
		});

		setTimeout(() => {
			reject(new Error("Test timeout"));
		}, 15000);
	});
}

// Run test
testDatabaseSync()
	.then(() => {
		console.log("🎉 [DB-SYNC] Test completed!");
		console.log("📋 [DB-SYNC] Expected behavior:");
		console.log(
			'   - User joins group (should see "Added user to database group")',
		);
		console.log("   - User leaves group (should see group cleanup if empty)");
		console.log("   - Check server logs for database operations");
		process.exit(0);
	})
	.catch(error => {
		console.error("❌ [DB-SYNC] Test failed:", error);
		process.exit(1);
	});
