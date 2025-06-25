import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logout } from "../../../../src/controllers/auth/logoutController";
import { redisClient } from "../../../../src/config/redis";
import crypto from "crypto";
import logger from "../../../../src/config/logger";

jest.mock("jsonwebtoken");
jest.mock("../../../../src/config/redis");
jest.mock("crypto");
jest.mock("../../../../src/config/logger");

describe("Logout Controller", () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let nextFunction: NextFunction;

	beforeEach(() => {
		mockRequest = {
			headers: {
				authorization: "Bearer valid-token-123",
			},
		};

		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		nextFunction = jest.fn();

		// Reset all mocks
		jest.clearAllMocks();

		// Default mocks
		(jwt.decode as jest.Mock).mockReturnValue({
			id: 1,
			login: "testuser",
			exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour in the future
		});

		const mockHash = {
			update: jest.fn().mockReturnThis(),
			digest: jest.fn().mockReturnValue("hashed-token-123"),
		};
		(crypto.createHash as jest.Mock).mockReturnValue(mockHash);
		(redisClient.set as jest.Mock).mockResolvedValue("OK");
	});

	describe("Token validation", () => {
		test("should reject missing token", async () => {
			mockRequest.headers = {}; // No authorization header

			await logout(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Token manquant",
			});
			expect(redisClient.set).not.toHaveBeenCalled();
		});

		test("should reject malformed token", async () => {
			mockRequest.headers = {
				authorization: "malformed-token", // No "Bearer " prefix
			};

			await logout(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Token manquant",
			});
			expect(redisClient.set).not.toHaveBeenCalled();
		});
	});

	describe("Token blacklisting", () => {
		test("should successfully blacklist valid token", async () => {
			await logout(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction,
			);

			// Verify token was properly hashed
			expect(crypto.createHash).toHaveBeenCalledWith("sha256");
			expect(crypto.createHash("sha256").update).toHaveBeenCalledWith(
				"valid-token-123",
			);
			expect(crypto.createHash("sha256").digest).toHaveBeenCalledWith("hex");

			// Verify the token was stored in Redis with correct expiry
			expect(redisClient.set).toHaveBeenCalledWith(
				"blacklist:hashed-token-123",
				"revoked",
				{ EX: expect.any(Number) },
			);

			// Verify that expiry time is calculated correctly from JWT
			const ttl =
				(jwt.decode as jest.Mock).mock.results[0].value.exp -
				Math.floor(Date.now() / 1000);
			const setCall = (redisClient.set as jest.Mock).mock.calls[0][2];
			expect(setCall.EX).toBeCloseTo(ttl, -2); // Allow some timing difference due to test execution

			// Verify successful response
			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith({
				message: "Déconnexion réussie",
			});
		});

		test("should handle expired token with calculated TTL", async () => {
			const now = Math.floor(Date.now() / 1000);
			const exp = now - 100; // 100 seconds in the past
			(jwt.decode as jest.Mock).mockReturnValue({
				id: 1,
				login: "testuser",
				exp,
			});

			await logout(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction,
			);

			// Verify TTL is set to calculated value (exp - current time)
			const expectedTTL = exp - now;
			expect(redisClient.set).toHaveBeenCalledWith(
				expect.any(String),
				"revoked",
				{ EX: expectedTTL },
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
		});
	});

	describe("Error handling", () => {
		test("should call next with error on Redis failure", async () => {
			const testError = new Error("Redis connection error");
			(redisClient.set as jest.Mock).mockRejectedValue(testError);

			await logout(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction,
			);

			expect(nextFunction).toHaveBeenCalledWith(testError);
			expect(mockResponse.status).not.toHaveBeenCalled();
		});

		test("should call next with error on JWT decode failure", async () => {
			const testError = new Error("JWT decode error");
			(jwt.decode as jest.Mock).mockImplementation(() => {
				throw testError;
			});

			await logout(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction,
			);

			expect(nextFunction).toHaveBeenCalledWith(testError);
		});

		test("should call next with error on crypto failure", async () => {
			const testError = new Error("Crypto error");
			(crypto.createHash as jest.Mock).mockImplementation(() => {
				throw testError;
			});

			await logout(
				mockRequest as Request,
				mockResponse as Response,
				nextFunction,
			);

			expect(nextFunction).toHaveBeenCalledWith(testError);
		});
	});
});
