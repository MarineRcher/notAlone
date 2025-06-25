import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

// Mock dependencies BEFORE importing routes
jest.mock("jsonwebtoken");

// Create mock GroupService instance
const mockGroupServiceInstance = {
	getGroupStats: jest.fn(),
	joinRandomGroup: jest.fn(),
	leaveGroup: jest.fn(),
	getGroupWithMembers: jest.fn(),
	getGroupMessages: jest.fn(),
	storeMessage: jest.fn(),
	getActiveGroups: jest.fn(),
	cleanupInactiveGroups: jest.fn(),
};

// Mock the GroupService constructor
jest.mock("../../../src/services/GroupService", () => {
	return jest.fn().mockImplementation(() => mockGroupServiceInstance);
});

// Import routes AFTER mocking
import groupRoutes from '../../../routes/groupRoutes';

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe("Group Routes", () => {
	let app: express.Application;

	beforeEach(() => {
		jest.clearAllMocks();

		// Reset all mock functions
		Object.values(mockGroupServiceInstance).forEach(mockFn => {
			if (jest.isMockFunction(mockFn)) {
				mockFn.mockClear();
			}
		});

		// Create Express app and attach routes
		app = express();
		app.use(express.json());
		app.use("/api/groups", groupRoutes);
	});

	describe("GET /api/groups/stats", () => {
		it("should return group statistics (no auth required)", async () => {
			// Mock group stats
			const mockStats = {
				totalGroups: 15,
				activeGroups: 12,
				totalMembers: 87,
				averageGroupSize: 7.25,
			};

			mockGroupServiceInstance.getGroupStats.mockResolvedValue(mockStats);

			const response = await request(app).get("/api/groups/stats");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				stats: mockStats,
			});
			expect(mockGroupServiceInstance.getGroupStats).toHaveBeenCalled();
		});

		it("should handle service errors", async () => {
			mockGroupServiceInstance.getGroupStats.mockRejectedValue(
				new Error("Database error"),
			);

			const response = await request(app).get("/api/groups/stats");

			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				success: false,
				message: "Failed to get group statistics",
			});
		});
	});

	describe("Authentication middleware", () => {
		it("should reject requests without token", async () => {
			const response = await request(app).post("/api/groups/join-random");

			expect(response.status).toBe(401);
			expect(response.body.error).toBe("Access token required");
		});

		it("should reject requests with invalid token", async () => {
			mockedJwt.verify.mockImplementation(() => {
				throw new Error("jwt malformed");
			});

			const response = await request(app)
				.post("/api/groups/join-random")
				.set("Authorization", "Bearer invalid-token");

			expect(response.status).toBe(403);
			expect(response.body.error).toBe("Invalid or expired token");
		});
	});

	describe("POST /api/groups/join-random", () => {
		beforeEach(() => {
			// Mock JWT verification
			mockedJwt.verify.mockReturnValue({
				userId: 123,
				login: "testuser",
			} as any);
		});

		it("should join random group successfully", async () => {
			const mockJoinResult = {
				success: true,
				message: "Successfully joined group",
				group: {
					id: "group-123",
					name: "Random Chat #1",
					currentMembers: 3,
					maxMembers: 10,
					members: [
						{
							userId: 123,
							login: "testuser",
							publicKey: "key1",
							joinedAt: "2025-01-01T00:00:00.000Z",
						},
					],
				},
			};

			mockGroupServiceInstance.joinRandomGroup.mockResolvedValue(
				mockJoinResult,
			);

			const response = await request(app)
				.post("/api/groups/join-random")
				.set("Authorization", "Bearer valid-token")
				.send({ publicKey: "user-public-key" });

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				group: mockJoinResult.group,
				message: mockJoinResult.message,
			});
			expect(mockGroupServiceInstance.joinRandomGroup).toHaveBeenCalledWith(
				123,
				"user-public-key",
			);
		});

		it("should handle join failure", async () => {
			const mockFailResult = {
				success: false,
				message: "No available groups",
				group: undefined,
			};

			mockGroupServiceInstance.joinRandomGroup.mockResolvedValue(
				mockFailResult,
			);

			const response = await request(app)
				.post("/api/groups/join-random")
				.set("Authorization", "Bearer valid-token")
				.send({ publicKey: "user-public-key" });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				success: false,
				message: "No available groups",
			});
		});

		it("should handle service errors", async () => {
			mockGroupServiceInstance.joinRandomGroup.mockRejectedValue(
				new Error("Database error"),
			);

			const response = await request(app)
				.post("/api/groups/join-random")
				.set("Authorization", "Bearer valid-token")
				.send({ publicKey: "user-public-key" });

			expect(response.status).toBe(500);
			expect(response.body).toEqual({
				success: false,
				message: "Internal server error",
			});
		});
	});

	describe("POST /api/groups/:groupId/leave", () => {
		beforeEach(() => {
			mockedJwt.verify.mockReturnValue({
				userId: 123,
				login: "testuser",
			} as any);
		});

		it("should leave group successfully", async () => {
			mockGroupServiceInstance.leaveGroup.mockResolvedValue(true);

			const response = await request(app)
				.post("/api/groups/group-123/leave")
				.set("Authorization", "Bearer valid-token");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				message: "Successfully left group",
			});
			expect(mockGroupServiceInstance.leaveGroup).toHaveBeenCalledWith(
				123,
				"group-123",
			);
		});

		it("should handle leave failure", async () => {
			mockGroupServiceInstance.leaveGroup.mockResolvedValue(false);

			const response = await request(app)
				.post("/api/groups/group-123/leave")
				.set("Authorization", "Bearer valid-token");

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				success: false,
				message: "Failed to leave group",
			});
		});
	});

	describe("GET /api/groups/:groupId", () => {
		beforeEach(() => {
			mockedJwt.verify.mockReturnValue({
				userId: 123,
				login: "testuser",
			} as any);
		});

		it("should get group details successfully", async () => {
			const mockGroupData = {
				id: "group-123",
				name: "Test Group",
				currentMembers: 3,
				maxMembers: 10,
				members: [
					{
						userId: 123,
						login: "testuser",
						publicKey: "key1",
						joinedAt: "2025-01-01T00:00:00.000Z",
					},
					{
						userId: 456,
						login: "otheruser",
						publicKey: "key2",
						joinedAt: "2025-01-02T00:00:00.000Z",
					},
				],
			};

			mockGroupServiceInstance.getGroupWithMembers.mockResolvedValue(
				mockGroupData,
			);

			const response = await request(app)
				.get("/api/groups/group-123")
				.set("Authorization", "Bearer valid-token");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				group: mockGroupData,
			});
			expect(mockGroupServiceInstance.getGroupWithMembers).toHaveBeenCalledWith(
				"group-123",
			);
		});

		it("should handle group not found", async () => {
			mockGroupServiceInstance.getGroupWithMembers.mockRejectedValue(
				new Error("Group not found"),
			);

			const response = await request(app)
				.get("/api/groups/non-existent-group")
				.set("Authorization", "Bearer valid-token");

			expect(response.status).toBe(404);
			expect(response.body).toEqual({
				success: false,
				message: "Group not found",
			});
		});
	});

	describe("GET /api/groups/:groupId/messages", () => {
		beforeEach(() => {
			mockedJwt.verify.mockReturnValue({
				userId: 123,
				login: "testuser",
			} as any);
		});

		it("should get group messages successfully", async () => {
			const mockMessages = [
				{
					id: "msg-1",
					senderId: 123,
					encryptedContent: "encrypted-message-1",
					messageType: "text",
					timestamp: new Date(),
					sender: { id: 123, login: "testuser" },
				},
				{
					id: "msg-2",
					senderId: 456,
					encryptedContent: "encrypted-message-2",
					messageType: "text",
					timestamp: new Date(),
					sender: { id: 456, login: "otheruser" },
				},
			];

			mockGroupServiceInstance.getGroupMessages.mockResolvedValue(mockMessages);

			const response = await request(app)
				.get("/api/groups/group-123/messages")
				.set("Authorization", "Bearer valid-token");

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.messages).toHaveLength(2);
			expect(mockGroupServiceInstance.getGroupMessages).toHaveBeenCalledWith(
				"group-123",
				50,
			);
		});

		it("should handle custom message limit", async () => {
			mockGroupServiceInstance.getGroupMessages.mockResolvedValue([]);

			const response = await request(app)
				.get("/api/groups/group-123/messages?limit=20")
				.set("Authorization", "Bearer valid-token");

			expect(response.status).toBe(200);
			expect(mockGroupServiceInstance.getGroupMessages).toHaveBeenCalledWith(
				"group-123",
				20,
			);
		});

		it("should handle invalid limit parameter", async () => {
			mockGroupServiceInstance.getGroupMessages.mockResolvedValue([]);

			const response = await request(app)
				.get("/api/groups/group-123/messages?limit=invalid")
				.set("Authorization", "Bearer valid-token");

			expect(response.status).toBe(200);
			expect(mockGroupServiceInstance.getGroupMessages).toHaveBeenCalledWith(
				"group-123",
				50,
			);
		});
	});

	describe("POST /api/groups/:groupId/messages", () => {
		beforeEach(() => {
			mockedJwt.verify.mockReturnValue({
				userId: 123,
				login: "testuser",
			} as any);
		});

		it("should send message successfully", async () => {
			const mockMessage = {
				id: "msg-123",
				timestamp: "2025-01-01T00:00:00.000Z",
			};

			mockGroupServiceInstance.storeMessage.mockResolvedValue(mockMessage);

			const response = await request(app)
				.post("/api/groups/group-123/messages")
				.set("Authorization", "Bearer valid-token")
				.send({ encryptedMessage: "encrypted-content", messageType: "text" });

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				messageId: mockMessage.id,
				timestamp: mockMessage.timestamp,
			});
			expect(mockGroupServiceInstance.storeMessage).toHaveBeenCalledWith(
				"group-123",
				123,
				"encrypted-content",
				"text",
			);
		});

		it("should handle missing message content", async () => {
			const response = await request(app)
				.post("/api/groups/group-123/messages")
				.set("Authorization", "Bearer valid-token")
				.send({});

			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				success: false,
				message: "Encrypted message content is required",
			});
		});
	});

	describe("GET /api/groups (admin route)", () => {
		it("should get active groups with pagination", async () => {
			const mockResult = {
				rows: [
					{ id: "group-1", name: "Group 1", currentMembers: 5 },
					{ id: "group-2", name: "Group 2", currentMembers: 3 },
				],
				count: 2,
			};

			mockGroupServiceInstance.getActiveGroups.mockResolvedValue(mockResult);

			const response = await request(app).get("/api/groups?page=1&limit=20");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				groups: mockResult.rows,
				pagination: {
					page: 1,
					limit: 20,
					total: 2,
					totalPages: 1,
				},
			});
			expect(mockGroupServiceInstance.getActiveGroups).toHaveBeenCalledWith(
				1,
				20,
			);
		});
	});

	describe("POST /api/groups/cleanup (admin route)", () => {
		it("should cleanup inactive groups successfully", async () => {
			mockGroupServiceInstance.cleanupInactiveGroups.mockResolvedValue(
				undefined,
			);

			const response = await request(app).post("/api/groups/cleanup");

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				success: true,
				message: "Cleanup completed successfully",
			});
			expect(mockGroupServiceInstance.cleanupInactiveGroups).toHaveBeenCalled();
		});
	});
});
