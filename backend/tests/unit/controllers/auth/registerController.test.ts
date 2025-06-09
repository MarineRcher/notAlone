import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { register } from "../../../../src/controllers/auth/registerController";
import User from "../../../../src/models/User";
import isPasswordCompromised from "../../../../src/utils/auth/isPasswordCompromised";
import logger from "../../../../src/config/logger";
import validator from "validator";

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("../../../../src/models/User");
jest.mock("../../../../src/utils/auth/isPasswordCompromised");
jest.mock("../../../../src/config/logger");
jest.mock("validator");

describe("Register Controller", () => {
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

        // Default mocks for validators
        (validator.matches as jest.Mock).mockReturnValue(true);
        (validator.isEmail as jest.Mock).mockReturnValue(true);
        (validator.isStrongPassword as jest.Mock).mockReturnValue(true);
        (validator.escape as jest.Mock).mockImplementation((str) => str.trim());
        (validator.normalizeEmail as jest.Mock).mockImplementation((email) =>
            email.toLowerCase()
        );

        // Default mocks
        (isPasswordCompromised as jest.Mock).mockResolvedValue(false);
        (bcrypt.genSalt as jest.Mock).mockResolvedValue("mockedsalt");
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword123");
        (User.create as jest.Mock).mockResolvedValue({
            get: () => ({
                id: 1,
                login: "testuser",
                email: "test@example.com",
                has2FA: false,
                hasPremium: false,
                notify: false,
                hourNotify: null,
            }),
        });

        (jwt.sign as jest.Mock).mockReturnValue("mocked-jwt-token");

        // User.findOne default mock setup - return null by default
        (User.findOne as jest.Mock).mockResolvedValue(null);

        // Mock environment variable
        process.env.JWT_SECRET = "test-secret";
    });

    describe("validateRegisterData", () => {
        test("should reject empty login", async () => {
            mockRequest.body = {
                login: "",
                email: "test@example.com",
                password: "StrongP@ssw0rd",
            };

            (validator.matches as jest.Mock).mockReturnValue(false);

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        login: expect.any(String),
                    }),
                })
            );
        });

        test("should reject invalid login format", async () => {
            mockRequest.body = {
                login: "user@!$",
                email: "test@example.com",
                password: "StrongP@ssw0rd",
            };

            (validator.matches as jest.Mock).mockReturnValue(false);

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        login: expect.any(String),
                    }),
                })
            );
        });

        test("should reject empty email", async () => {
            mockRequest.body = {
                login: "testuser",
                email: "",
                password: "StrongP@ssw0rd",
            };

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        email: expect.any(String),
                    }),
                })
            );
        });

        test("should reject invalid email format", async () => {
            mockRequest.body = {
                login: "testuser",
                email: "invalidemail",
                password: "StrongP@ssw0rd",
            };

            (validator.isEmail as jest.Mock).mockReturnValue(false);

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        email: expect.any(String),
                    }),
                })
            );
        });

        test("should reject empty password", async () => {
            mockRequest.body = {
                login: "testuser",
                email: "test@example.com",
                password: "",
            };

            await register(
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

        test("should reject weak password", async () => {
            mockRequest.body = {
                login: "testuser",
                email: "test@example.com",
                password: "weak",
            };

            (validator.isStrongPassword as jest.Mock).mockReturnValue(false);

            await register(
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

        test("should reject compromised password", async () => {
            mockRequest.body = {
                login: "testuser",
                email: "test@example.com",
                password: "StrongP@ssw0rd",
            };

            (isPasswordCompromised as jest.Mock).mockResolvedValue(true);

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(isPasswordCompromised).toHaveBeenCalledWith(
                "StrongP@ssw0rd"
            );
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        password: expect.stringContaining("compromis"),
                    }),
                })
            );
        });
    });

    describe("User creation", () => {
        test("should reject if email already exists", async () => {
            mockRequest.body = {
                login: "testuser",
                email: "existing@example.com",
                password: "StrongP@ssw0rd",
            };

            // Override the default mock only for email check
            (User.findOne as jest.Mock).mockImplementationOnce(() => {
                return { id: 2, email: "existing@example.com" };
            });

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { email: "existing@example.com" },
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        email: expect.stringContaining("existe déjà"),
                    }),
                })
            );
        });

        test("should reject if login already exists", async () => {
            mockRequest.body = {
                login: "existinguser",
                email: "test@example.com",
                password: "StrongP@ssw0rd",
            };

            // First call (email check) returns null
            (User.findOne as jest.Mock).mockResolvedValueOnce(null);
            // Second call (login check) returns a user
            (User.findOne as jest.Mock).mockResolvedValueOnce({
                id: 3,
                login: "existinguser",
            });

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.findOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { login: "existinguser" },
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        login: expect.stringContaining("existe déjà"),
                    }),
                })
            );
        });

        test("should create user with default values if optional fields not provided", async () => {
            mockRequest.body = {
                login: "newuser",
                email: "new@example.com",
                password: "StrongP@ssw0rd",
            };

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    login: "newuser",
                    email: "new@example.com",
                    password: "hashedpassword123",
                    hasPremium: false,
                    has2FA: false,
                    isBlocked: false,
                })
            );
        });

        test("should create user with provided optional fields", async () => {
            mockRequest.body = {
                login: "premiumuser",
                email: "premium@example.com",
                password: "StrongP@ssw0rd",
                hasPremium: true,
                has2FA: true,
            };

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    login: "premiumuser",
                    email: "premium@example.com",
                    password: "hashedpassword123",
                    hasPremium: true,
                    has2FA: true,
                    isBlocked: false,
                })
            );
        });

        test("should sanitize and normalize user input", async () => {
            mockRequest.body = {
                login: " testuser",
                email: "TEST@EXAMPLE.COM",
                password: "StrongP@ssw0rd",
            };

            // Ensure validator mock functions work appropriately
            (validator.escape as jest.Mock).mockReturnValueOnce("testuser");
            (validator.normalizeEmail as jest.Mock).mockReturnValueOnce(
                "test@example.com"
            );

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.create).toHaveBeenCalled();
            const createCall = (User.create as jest.Mock).mock.calls[0][0];
            expect(createCall.login).toBe("testuser");
            expect(createCall.email).toBe("test@example.com");
        });

        test("should hash password before storing", async () => {
            mockRequest.body = {
                login: "testuser",
                email: "test@example.com",
                password: "StrongP@ssw0rd",
            };

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(
                "StrongP@ssw0rd",
                "mockedsalt"
            );
            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    password: "hashedpassword123",
                })
            );
        });

        test("should return JWT token on successful registration", async () => {
            mockRequest.body = {
                login: "testuser",
                email: "test@example.com",
                password: "StrongP@ssw0rd",
            };

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 1,
                    login: "testuser",
                }),
                "test-secret",
                expect.objectContaining({
                    expiresIn: "24h",
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("succès"),
                    token: "mocked-jwt-token",
                })
            );
        });
    });

    describe("Error handling", () => {
        test("should call next with error on exception", async () => {
            mockRequest.body = {
                login: "testuser",
                email: "test@example.com",
                password: "StrongP@ssw0rd",
            };

            const testError = new Error("Test error");
            (User.findOne as jest.Mock).mockRejectedValue(testError);

            await register(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(logger.error).toHaveBeenCalled();
            expect(nextFunction).toHaveBeenCalledWith(testError);
        });
    });
});
