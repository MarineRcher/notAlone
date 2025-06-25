import RedisService, { CachedGroupInfo } from '../../../services/RedisService';
import { safeRedisClient } from '../../../config/redis';

// Mock the redis config
jest.mock('../../../config/redis', () => ({
  safeRedisClient: {
    isConnected: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
  }
}));

const mockSafeRedisClient = safeRedisClient as jest.Mocked<
	typeof safeRedisClient
>;

describe("RedisService", () => {
	let redisService: RedisService;

	beforeEach(() => {
		jest.clearAllMocks();
		delete process.env.REDIS_ENABLED;
		delete process.env.NODE_ENV;
	});

	describe("when Redis is disabled (development)", () => {
		beforeEach(() => {
			process.env.REDIS_ENABLED = "false";
			redisService = new RedisService();
		});

		it("should not call Redis operations when disabled", async () => {
			const groupInfo: CachedGroupInfo = {
				id: "test-group",
				name: "Test Group",
				currentMembers: 5,
				maxMembers: 10,
				members: [],
			};

			await redisService.cacheGroupInfo("test-group", groupInfo);
			const result = await redisService.getCachedGroupInfo("test-group");
			await redisService.clearGroupCache("test-group");

			expect(mockSafeRedisClient.set).not.toHaveBeenCalled();
			expect(mockSafeRedisClient.get).not.toHaveBeenCalled();
			expect(mockSafeRedisClient.del).not.toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it("should not store user socket mappings when disabled", async () => {
			await redisService.storeUserSocket(123, "socket-123");
			const result = await redisService.getUserSocket(123);
			await redisService.removeUserSocket(123);

			expect(mockSafeRedisClient.set).not.toHaveBeenCalled();
			expect(mockSafeRedisClient.get).not.toHaveBeenCalled();
			expect(mockSafeRedisClient.del).not.toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it("should return empty object for group member sockets when disabled", async () => {
			const result = await redisService.getGroupMemberSockets("test-group");
			expect(result).toEqual({});
		});

		it("should not store temp data when disabled", async () => {
			await redisService.setTempData("temp-key", { data: "test" }, 3600);
			const result = await redisService.getTempData("temp-key");

			expect(mockSafeRedisClient.set).not.toHaveBeenCalled();
			expect(mockSafeRedisClient.get).not.toHaveBeenCalled();
			expect(result).toBeNull();
		});

		it("should return 0 for counter when disabled", async () => {
			const result = await redisService.incrementCounter("counter-key", 3600);
			expect(result).toBe(0);
		});
	});

	describe("when Redis is enabled (production)", () => {
		beforeEach(() => {
			process.env.REDIS_ENABLED = "true";
			redisService = new RedisService();
		});

		describe("cacheGroupInfo", () => {
			it("should cache group information", async () => {
				const groupInfo: CachedGroupInfo = {
					id: "test-group",
					name: "Test Group",
					currentMembers: 5,
					maxMembers: 10,
					members: [
						{
							userId: 1,
							login: "user1",
							publicKey: "key1",
							joinedAt: new Date(),
						},
					],
				};

				mockSafeRedisClient.set.mockResolvedValue(true);

				await redisService.cacheGroupInfo("test-group", groupInfo);

				expect(mockSafeRedisClient.set).toHaveBeenCalledWith(
					"group:test-group",
					JSON.stringify(groupInfo),
					3600,
				);
			});

			it("should handle caching errors gracefully", async () => {
				const groupInfo: CachedGroupInfo = {
					id: "test-group",
					name: "Test Group",
					currentMembers: 5,
					maxMembers: 10,
					members: [],
				};

				mockSafeRedisClient.set.mockRejectedValue(new Error("Redis error"));

				// Should not throw
				await expect(
					redisService.cacheGroupInfo("test-group", groupInfo),
				).resolves.toBeUndefined();
			});
		});

		describe("getCachedGroupInfo", () => {
			it("should retrieve cached group information", async () => {
				const groupInfo: CachedGroupInfo = {
					id: "test-group",
					name: "Test Group",
					currentMembers: 5,
					maxMembers: 10,
					members: [],
				};

				mockSafeRedisClient.get.mockResolvedValue(JSON.stringify(groupInfo));

				const result = await redisService.getCachedGroupInfo("test-group");

				expect(mockSafeRedisClient.get).toHaveBeenCalledWith(
					"group:test-group",
				);
				expect(result).toEqual(groupInfo);
			});

			it("should return null when no cached data exists", async () => {
				mockSafeRedisClient.get.mockResolvedValue(null);

				const result = await redisService.getCachedGroupInfo("test-group");

				expect(result).toBeNull();
			});

			it("should handle parsing errors gracefully", async () => {
				mockSafeRedisClient.get.mockResolvedValue("invalid-json");

				const result = await redisService.getCachedGroupInfo("test-group");

				expect(result).toBeNull();
			});
		});

		describe("clearGroupCache", () => {
			it("should clear group cache", async () => {
				mockSafeRedisClient.del.mockResolvedValue(true);

				await redisService.clearGroupCache("test-group");

				expect(mockSafeRedisClient.del).toHaveBeenCalledWith(
					"group:test-group",
				);
			});

			it("should handle deletion errors gracefully", async () => {
				mockSafeRedisClient.del.mockRejectedValue(new Error("Redis error"));

				// Should not throw
				await expect(
					redisService.clearGroupCache("test-group"),
				).resolves.toBeUndefined();
			});
		});

		describe("user socket management", () => {
			it("should store and retrieve user socket mappings", async () => {
				mockSafeRedisClient.set.mockResolvedValue(true);
				mockSafeRedisClient.get.mockResolvedValue("socket-123");

				await redisService.storeUserSocket(123, "socket-123");
				const result = await redisService.getUserSocket(123);

				expect(mockSafeRedisClient.set).toHaveBeenCalledWith(
					"user:123:socket",
					"socket-123",
					86400,
				);
				expect(mockSafeRedisClient.get).toHaveBeenCalledWith("user:123:socket");
				expect(result).toBe("socket-123");
			});

			it("should remove user socket mappings", async () => {
				mockSafeRedisClient.del.mockResolvedValue(true);

				await redisService.removeUserSocket(123);

				expect(mockSafeRedisClient.del).toHaveBeenCalledWith("user:123:socket");
			});

			it("should return null when user socket not found", async () => {
				mockSafeRedisClient.get.mockResolvedValue(null);

				const result = await redisService.getUserSocket(123);

				expect(result).toBeNull();
			});
		});

		describe("group member socket management", () => {
			it("should store group member socket mapping", async () => {
				mockSafeRedisClient.set.mockResolvedValue(true);

				await redisService.storeGroupMemberSocket("group-1", 123, "socket-123");

				// Should delegate to storeUserSocket
				expect(mockSafeRedisClient.set).toHaveBeenCalledWith(
					"user:123:socket",
					"socket-123",
					86400,
				);
			});

			it("should remove group member socket mapping", async () => {
				mockSafeRedisClient.del.mockResolvedValue(true);

				await redisService.removeGroupMemberSocket("group-1", 123);

				// Should delegate to removeUserSocket
				expect(mockSafeRedisClient.del).toHaveBeenCalledWith("user:123:socket");
			});

			it("should return empty object for group member sockets", async () => {
				const result = await redisService.getGroupMemberSockets("group-1");
				expect(result).toEqual({});
			});
		});

		describe("temporary data management", () => {
			it("should store and retrieve temporary data", async () => {
				const testData = { message: "test", userId: 123 };

				mockSafeRedisClient.set.mockResolvedValue(true);
				mockSafeRedisClient.get.mockResolvedValue(JSON.stringify(testData));

				await redisService.setTempData("temp-key", testData, 1800);
				const result = await redisService.getTempData("temp-key");

				expect(mockSafeRedisClient.set).toHaveBeenCalledWith(
					"temp-key",
					JSON.stringify(testData),
					1800,
				);
				expect(mockSafeRedisClient.get).toHaveBeenCalledWith("temp-key");
				expect(result).toEqual(testData);
			});

			it("should use default TTL when not specified", async () => {
				const testData = { message: "test" };
				mockSafeRedisClient.set.mockResolvedValue(true);

				await redisService.setTempData("temp-key", testData);

				expect(mockSafeRedisClient.set).toHaveBeenCalledWith(
					"temp-key",
					JSON.stringify(testData),
					3600,
				);
			});

			it("should return null when temp data not found", async () => {
				mockSafeRedisClient.get.mockResolvedValue(null);

				const result = await redisService.getTempData("temp-key");

				expect(result).toBeNull();
			});

			it("should handle JSON parsing errors for temp data", async () => {
				mockSafeRedisClient.get.mockResolvedValue("invalid-json");

				const result = await redisService.getTempData("temp-key");

				expect(result).toBeNull();
			});
		});

		describe("counter operations", () => {
			it("should return 0 for increment counter (simplified implementation)", async () => {
				const result = await redisService.incrementCounter("counter-key", 1800);
				expect(result).toBe(0);
			});
		});

		describe("utility methods", () => {
			it("should handle cleanup operation", async () => {
				// Should not throw
				await expect(redisService.cleanup()).resolves.toBeUndefined();
			});

			it("should handle disconnect operation", async () => {
				// Should not throw
				await expect(redisService.disconnect()).resolves.toBeUndefined();
			});
		});
	});

	describe("when Redis is enabled via NODE_ENV=production", () => {
		beforeEach(() => {
			process.env.NODE_ENV = "production";
			redisService = new RedisService();
		});

		it("should enable Redis operations in production", async () => {
			const groupInfo: CachedGroupInfo = {
				id: "test-group",
				name: "Test Group",
				currentMembers: 5,
				maxMembers: 10,
				members: [],
			};

			mockSafeRedisClient.set.mockResolvedValue(true);

			await redisService.cacheGroupInfo("test-group", groupInfo);

			expect(mockSafeRedisClient.set).toHaveBeenCalled();
		});
	});
});
