import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { changePassword } from "../../../../src/controllers/auth/passwordController";
import User from "../../../../src/models/User";
import logger from "../../../../src/config/logger";
import * as isPasswordCompromisedModule from "../../../../src/utils/auth/isPasswordCompromised";

// Mocks
jest.mock("bcryptjs");
jest.mock("../../../../src/models/User");
jest.mock("../../../../src/config/logger");
jest.mock("../../../../src/utils/auth/isPasswordCompromised");

describe("Password Controller", () => {
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
    });

    describe("validatePasswordData", () => {
        test("should reject empty login/email", async () => {
            mockRequest.body = {
                loginOrEmail: "",
                oldPassword: "oldPassword123",
                newPassword: "newPassword123",
            };

            await changePassword(
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
                oldPassword: "oldPassword123",
                newPassword: "newPassword123",
            };

            await changePassword(
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
                oldPassword: "oldPassword123",
                newPassword: "newPassword123",
            };

            await changePassword(
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

        test("should reject empty old password", async () => {
            mockRequest.body = {
                loginOrEmail: "validuser",
                oldPassword: "",
                newPassword: "newPassword123",
            };

            await changePassword(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        oldPassword: expect.any(String),
                    }),
                })
            );
        });

        test("should reject empty new password", async () => {
            mockRequest.body = {
                loginOrEmail: "validuser",
                oldPassword: "oldPassword123",
                newPassword: "",
            };

            await changePassword(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        newPassword: expect.any(String),
                    }),
                })
            );
        });

        test("should reject weak new password", async () => {
            mockRequest.body = {
                loginOrEmail: "validuser",
                oldPassword: "oldPassword123",
                newPassword: "weak",
            };

            await changePassword(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    errors: expect.objectContaining({
                        newPassword: expect.any(String),
                    }),
                })
            );
        });
    });

    describe("Password change authentication", () => {
        test("should return 401 if user not found", async () => {
            mockRequest.body = {
                loginOrEmail: "nonexistent@example.com",
                oldPassword: "oldPassword123",
                newPassword: "newPassword123!A",
            };

            (User.findOne as jest.Mock).mockResolvedValue(null);

            await changePassword(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.findOne).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Email ou login incorrect",
                })
            );
        });

        test("should return 401 if old password is incorrect", async () => {
            mockRequest.body = {
                loginOrEmail: "user@example.com",
                oldPassword: "wrongpassword",
                newPassword: "newPassword123!A",
            };

            const mockUser = {
                id: 1,
                login: "user",
                email: "user@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 0,
                blockedUntil: null,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            (User.update as jest.Mock).mockResolvedValue([1]);

            await changePassword(
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
                    message: "Ancien mot de passe incorrect",
                })
            );
        });

        test("should block user after 3 failed attempts", async () => {
            mockRequest.body = {
                loginOrEmail: "user@example.com",
                oldPassword: "wrongpassword",
                newPassword: "newPassword123!A",
            };

            const mockUser = {
                id: 1,
                login: "user",
                email: "user@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 2, // This will be the 3rd attempt
                blockedUntil: null,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);
            (User.update as jest.Mock).mockResolvedValue([1]);

            await changePassword(
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
                oldPassword: "oldPassword123",
                newPassword: "newPassword123!A",
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
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            // Il faut simuler un mot de passe correct pour atteindre la vérification du blocage
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);

            await changePassword(
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

        test("should reject compromised passwords", async () => {
            mockRequest.body = {
                loginOrEmail: "user@example.com",
                oldPassword: "correctOldPassword",
                newPassword: "compromisedPassword123!A",
            };

            const mockUser = {
                id: 1,
                login: "user",
                email: "user@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 0,
                blockedUntil: null,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (
                isPasswordCompromisedModule.default as jest.Mock
            ).mockResolvedValue(true);

            await changePassword(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(isPasswordCompromisedModule.default).toHaveBeenCalledWith(
                "compromisedPassword123!A"
            );
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining("compromis"),
                })
            );
        });

        test("should successfully change password with valid data", async () => {
            mockRequest.body = {
                loginOrEmail: "user@example.com",
                oldPassword: "correctOldPassword",
                newPassword: "newSecurePassword123!A",
            };

            const mockUser = {
                id: 1,
                login: "user",
                email: "user@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 0,
                blockedUntil: null,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (
                isPasswordCompromisedModule.default as jest.Mock
            ).mockResolvedValue(false);
            (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
            (bcrypt.hash as jest.Mock).mockResolvedValue("newhashedpassword");
            (User.update as jest.Mock).mockResolvedValue([1]);

            await changePassword(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith(
                "newSecurePassword123!A",
                "salt"
            );
            expect(User.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    failedLoginAttempts: 0,
                    blockedUntil: null,
                    password: "newhashedpassword",
                }),
                expect.objectContaining({
                    where: { id: 1 },
                })
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Mot de passe modifié avec succès",
                })
            );
        });

        test("should reset failed attempts on successful password change", async () => {
            mockRequest.body = {
                loginOrEmail: "user@example.com",
                oldPassword: "correctOldPassword",
                newPassword: "newSecurePassword123!A",
            };

            const mockUser = {
                id: 1,
                login: "user",
                email: "user@example.com",
                password: "hashedpassword",
                failedLoginAttempts: 2, // Previous failed attempts
                blockedUntil: null,
            };

            (User.findOne as jest.Mock).mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (
                isPasswordCompromisedModule.default as jest.Mock
            ).mockResolvedValue(false);
            (bcrypt.genSalt as jest.Mock).mockResolvedValue("salt");
            (bcrypt.hash as jest.Mock).mockResolvedValue("newhashedpassword");
            (User.update as jest.Mock).mockResolvedValue([1]);

            await changePassword(
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
                oldPassword: "oldPassword123",
                newPassword: "newSecurePassword123!A",
            };

            const testError = new Error("Test error");
            (User.findOne as jest.Mock).mockRejectedValue(testError);

            await changePassword(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalledWith(testError);
        });
    });
});
