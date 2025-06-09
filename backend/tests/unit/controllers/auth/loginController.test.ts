import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { login } from "../../../../src/controllers/auth/loginController";
import User from "../../../../src/models/User";
import logger from "../../../../src/config/logger";

// Mocks
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../../../../src/models/User");
jest.mock("../../../../src/config/logger");

describe("Login Controller", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            body: {},
            ip: "127.0.0.1",
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        nextFunction = jest.fn();

        // Reset all mocks
        jest.clearAllMocks();

        // Mock environment variable
        process.env.JWT_SECRET = "test-secret";
    });

    describe("validateLoginData", () => {
        test("should reject empty login/email", async () => {
            mockRequest.body = { loginOrEmail: "", password: "password123" };

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        loginOrEmail: expect.any(String),
                    }),
                })
            );
        });

        test("should reject invalid email format", async () => {
            mockRequest.body = {
                loginOrEmail: "invalid@email",
                password: "password123",
            };

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        loginOrEmail: expect.any(String),
                    }),
                })
            );
        });

        test("should reject invalid login format", async () => {
            mockRequest.body = {
                loginOrEmail: "user@!$",
                password: "password123",
            };

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        loginOrEmail: expect.any(String),
                    }),
                })
            );
        });

        test("should reject empty password", async () => {
            mockRequest.body = { loginOrEmail: "validuser", password: "" };

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        password: expect.any(String),
                    }),
                })
            );
        });
    });

    describe("User authentication", () => {
        test("should return 401 if user not found", async () => {
            mockRequest.body = {
                loginOrEmail: "nonexistent@example.com",
                password: "password123",
            };

            (User.findOne as jest.Mock).mockResolvedValue(null);

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.findOne).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("incorrect"),
                })
            );
        });

        test("should return 401 if password is incorrect", async () => {
            mockRequest.body = {
                loginOrEmail: "user@example.com",
                password: "wrongpassword",
            };

            const mockUser = {
                id: 1,
                login: "user",
                email: "user@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 0,
                blockedUntil: null,
                has2FA: false,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            (User.update as jest.Mock).mockResolvedValue([1]);

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(bcrypt.compare).toHaveBeenCalledWith(
                "wrongpassword",
                "hashedpassword"
            );
            expect(User.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    failedLoginAttempts: 1,
                }),
                expect.any(Object)
            );
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("incorrect"),
                })
            );
        });

        test("should block user after 3 failed attempts", async () => {
            mockRequest.body = {
                loginOrEmail: "user@example.com",
                password: "wrongpassword",
            };

            const mockUser = {
                id: 1,
                login: "user",
                email: "user@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 2, // This will be the 3rd attempt
                blockedUntil: null,
                has2FA: false,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            (User.update as jest.Mock).mockResolvedValue([1]);

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    failedLoginAttempts: 3,
                    blockedUntil: expect.any(Date),
                }),
                expect.any(Object)
            );
        });

        test("should return 429 if user account is blocked", async () => {
            mockRequest.body = {
                loginOrEmail: "blocked@example.com",
                password: "password123",
            };

            const futureDate = new Date();
            futureDate.setMinutes(futureDate.getMinutes() + 10); // 10 minutes in the future

            const mockUser = {
                id: 2,
                login: "blocked",
                email: "blocked@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 3,
                blockedUntil: futureDate,
                has2FA: false,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(429);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("bloqué"),
                })
            );
        });

        test("should require 2FA if enabled for user", async () => {
            mockRequest.body = {
                loginOrEmail: "user2fa@example.com",
                password: "password123",
            };

            const mockUser = {
                id: 3,
                login: "user2fa",
                email: "user2fa@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 0,
                blockedUntil: null,
                has2FA: true,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue("temp-token-123");

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 3,
                    requiresTwoFactor: true,
                }),
                "test-secret",
                expect.any(Object)
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    requiresTwoFactor: true,
                    tempToken: "temp-token-123",
                })
            );
        });

        test("should log in successfully with valid credentials", async () => {
            mockRequest.body = {
                loginOrEmail: "user@example.com",
                password: "correctpassword",
            };

            const mockUser = {
                id: 1,
                login: "user",
                email: "user@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 0,
                blockedUntil: null,
                has2FA: false,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue("valid-token-123");
            (User.update as jest.Mock).mockResolvedValue([1]);

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 1,
                    login: "user",
                }),
                "test-secret",
                expect.any(Object)
            );
            expect(User.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    failedLoginAttempts: 0,
                    blockedUntil: null,
                }),
                expect.any(Object)
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Connexion réussie",
                    token: "valid-token-123",
                })
            );
        });

        test("should reset failed attempts on successful login", async () => {
            mockRequest.body = {
                loginOrEmail: "user@example.com",
                password: "correctpassword",
            };

            const mockUser = {
                id: 1,
                login: "user",
                email: "user@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 2, // Previous failed attempts
                blockedUntil: null,
                has2FA: false,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue("valid-token-123");
            (User.update as jest.Mock).mockResolvedValue([1]);

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    failedLoginAttempts: 0,
                    blockedUntil: null,
                }),
                expect.any(Object)
            );
        });
    });

    describe("Error handling", () => {
        test("should call next with error on exception", async () => {
            mockRequest.body = {
                loginOrEmail: "user@example.com",
                password: "password123",
            };

            const testError = new Error("Test error");
            (User.findOne as jest.Mock).mockRejectedValue(testError);

            await login(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalledWith(testError);
        });
    });
});
