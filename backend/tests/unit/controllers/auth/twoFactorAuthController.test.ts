import { Request, Response, NextFunction } from "express";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import {
    generate2FASecret,
    verify2FASetup,
    verify2FALogin,
    disable2FA,
} from "../../../../src/controllers/auth/twoFactorAuthController";
import User from "../../../../src/models/User";
import logger from "../../../../src/config/logger";
import { UserAttributes } from "../../../../src/types/users";

// Mocks
jest.mock("speakeasy");
jest.mock("qrcode");
jest.mock("jsonwebtoken");
jest.mock("../../../../src/models/User");
jest.mock("../../../../src/config/logger");

describe("Two Factor Authentication Controller", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    // Create a mock user that matches the UserAttributes interface
    const mockUserData: UserAttributes = {
        id: 1,
        login: "testuser",
        email: "user@example.com",
        password: "hashedpassword",
        hasPremium: false,
        isBlocked: false,
        twoFactorSecret: null,
        has2FA: false,
        notify: false,
        hourNotify: null,
        failedLoginAttempts: 0,
        blockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockRequest = {
            body: {},
            ip: "127.0.0.1",
            user: mockUserData, // Use the complete mock user object
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

    describe("generate2FASecret", () => {
        test("should return 404 if user not found", async () => {
            (User.findByPk as jest.Mock).mockResolvedValue(null);

            await generate2FASecret(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.findByPk).toHaveBeenCalledWith(1, { raw: true });
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Utilisateur non trouvé",
                })
            );
        });

        test("should generate 2FA secret successfully", async () => {
            const mockUser = {
                id: 1,
                email: "user@example.com",
            };

            const mockSecret = {
                base32: "BASETEST32SECRET",
                otpauth_url:
                    "otpauth://totp/MonApplication:user@example.com?secret=BASETEST32SECRET",
            };

            const mockQRCode = "data:image/png;base64,mockQRCodeData";
            const mockToken = "mock-jwt-token";

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);
            (QRCode.toDataURL as jest.Mock).mockResolvedValue(mockQRCode);
            (jwt.sign as jest.Mock).mockReturnValue(mockToken);

            await generate2FASecret(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(speakeasy.generateSecret).toHaveBeenCalledWith({
                name: expect.stringContaining(
                    "MonApplication:user@example.com"
                ),
            });
            expect(QRCode.toDataURL).toHaveBeenCalledWith(
                mockSecret.otpauth_url
            );
            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    userId: 1,
                    secret: "BASETEST32SECRET",
                    setupPhase: true,
                },
                "test-secret",
                { expiresIn: "10m" }
            );

            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Secret 2FA généré avec succès",
                tempToken: mockToken,
                qrCodeUrl: mockQRCode,
                secret: "BASETEST32SECRET",
            });
        });

        test("should return 500 if secret generation fails", async () => {
            const mockUser = {
                id: 1,
                email: "user@example.com",
            };

            const mockSecret = {
                base32: "BASETEST32SECRET",
                // Missing otpauth_url
            };

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);

            await generate2FASecret(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Failed to generate 2FA secret",
            });
        });

        test("should pass errors to next middleware", async () => {
            const error = new Error("Test error");
            (User.findByPk as jest.Mock).mockRejectedValue(error);

            await generate2FASecret(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe("verify2FASetup", () => {
        test("should reject invalid OTP format", async () => {
            mockRequest.body = {
                token: "valid-token",
                otp: "12345", // Only 5 digits, should be 6
            };

            await verify2FASetup(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Échec de validation du code",
                })
            );
        });

        test("should reject invalid token", async () => {
            mockRequest.body = {
                token: "invalid-token",
                otp: "123456",
            };

            (jwt.verify as jest.Mock).mockImplementation(() => ({
                // Missing setupPhase and secret
                userId: 1,
            }));

            await verify2FASetup(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(jwt.verify).toHaveBeenCalledWith(
                "invalid-token",
                "test-secret"
            );
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Token invalide pour la configuration 2FA",
            });
        });

        test("should reject incorrect OTP", async () => {
            mockRequest.body = {
                token: "valid-token",
                otp: "123456",
            };

            (jwt.verify as jest.Mock).mockImplementation(() => ({
                setupPhase: true,
                secret: "SECRET123",
                userId: 1,
            }));

            (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

            await verify2FASetup(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(speakeasy.totp.verify).toHaveBeenCalledWith({
                secret: "SECRET123",
                encoding: "base32",
                token: "123456",
            });
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Code incorrect",
            });
        });

        test("should return 404 if user not found", async () => {
            mockRequest.body = {
                token: "valid-token",
                otp: "123456",
            };

            (jwt.verify as jest.Mock).mockImplementation(() => ({
                setupPhase: true,
                secret: "SECRET123",
                userId: 1,
            }));

            (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
            (User.findByPk as jest.Mock).mockResolvedValue(null);

            await verify2FASetup(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Utilisateur non trouvé",
            });
        });

        test("should successfully verify and enable 2FA", async () => {
            mockRequest.body = {
                token: "valid-token",
                otp: "123456",
            };

            const mockUser = {
                id: 1,
                update: jest.fn().mockResolvedValue(true),
            };

            (jwt.verify as jest.Mock).mockImplementation(() => ({
                setupPhase: true,
                secret: "SECRET123",
                userId: 1,
            }));

            (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await verify2FASetup(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockUser.update).toHaveBeenCalledWith({
                twoFactorSecret: "SECRET123",
                has2FA: true,
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message:
                    "L'authentification à deux facteurs a été activée avec succès",
            });
        });

        test("should pass errors to next middleware", async () => {
            mockRequest.body = {
                token: "valid-token",
                otp: "123456",
            };

            const error = new Error("Test error");
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw error;
            });

            await verify2FASetup(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe("verify2FALogin", () => {
        test("should reject invalid OTP format", async () => {
            mockRequest.body = {
                tempToken: "valid-token",
                otp: "ABCDEF", // Non-numeric, should be 6 digits
            };

            await verify2FALogin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: "Échec de validation du code",
                })
            );
        });

        test("should reject invalid token", async () => {
            mockRequest.body = {
                tempToken: "invalid-token",
                otp: "123456",
            };

            (jwt.verify as jest.Mock).mockImplementation(() => ({
                // Missing requiresTwoFactor flag
                id: 1,
            }));

            await verify2FALogin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(jwt.verify).toHaveBeenCalledWith(
                "invalid-token",
                "test-secret"
            );
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Token invalide pour la vérification 2FA",
            });
        });

        test("should return 404 if user not found or 2FA not set up", async () => {
            mockRequest.body = {
                tempToken: "valid-token",
                otp: "123456",
            };

            (jwt.verify as jest.Mock).mockImplementation(() => ({
                requiresTwoFactor: true,
                id: 1,
            }));

            // User not found
            (User.findByPk as jest.Mock).mockResolvedValue(null);

            await verify2FALogin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Utilisateur non trouvé ou 2FA non configurée",
            });

            // Reset mocks for second test case
            jest.clearAllMocks();
            mockResponse.status = jest.fn().mockReturnThis();
            mockResponse.json = jest.fn();

            // User found but 2FA not set up
            (jwt.verify as jest.Mock).mockImplementation(() => ({
                requiresTwoFactor: true,
                id: 1,
            }));
            (User.findByPk as jest.Mock).mockResolvedValue({
                id: 1,
                // twoFactorSecret is missing
            });

            await verify2FALogin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Utilisateur non trouvé ou 2FA non configurée",
            });
        });

        test("should reject incorrect OTP", async () => {
            mockRequest.body = {
                tempToken: "valid-token",
                otp: "123456",
            };

            (jwt.verify as jest.Mock).mockImplementation(() => ({
                requiresTwoFactor: true,
                id: 1,
            }));

            (User.findByPk as jest.Mock).mockResolvedValue({
                id: 1,
                twoFactorSecret: "SECRET123",
            });

            (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

            await verify2FALogin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(speakeasy.totp.verify).toHaveBeenCalledWith({
                secret: "SECRET123",
                encoding: "base32",
                token: "123456",
            });
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Code d'authentification incorrect",
            });
        });

        test("should successfully verify 2FA login", async () => {
            mockRequest.body = {
                tempToken: "valid-token",
                otp: "123456",
            };

            const mockUser = {
                id: 1,
                login: "testuser",
                twoFactorSecret: "SECRET123",
                password: "hashedpassword",
                email: "user@example.com",
            };

            (jwt.verify as jest.Mock).mockImplementation(() => ({
                requiresTwoFactor: true,
                id: 1,
            }));

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
            (jwt.sign as jest.Mock).mockReturnValue("final-token-123");

            await verify2FALogin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 1, login: "testuser" },
                "test-secret",
                { expiresIn: "24h" }
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Authentification à deux facteurs réussie",
                user: {
                    id: 1,
                    login: "testuser",
                    email: "user@example.com",
                },
                token: "final-token-123",
            });
        });

        test("should pass errors to next middleware", async () => {
            mockRequest.body = {
                tempToken: "valid-token",
                otp: "123456",
            };

            const error = new Error("Test error");
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw error;
            });

            await verify2FALogin(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });

    describe("disable2FA", () => {
        test("should return 404 if user not found", async () => {
            mockRequest.body = {
                userId: 1,
                otp: "123456",
            };

            (User.findByPk as jest.Mock).mockResolvedValue(null);

            await disable2FA(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.findByPk).toHaveBeenCalledWith(1, { raw: true });
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Utilisateur non trouvé",
            });
        });

        test("should return 400 if 2FA not enabled", async () => {
            mockRequest.body = {
                userId: 1,
                otp: "123456",
            };

            const mockUser = {
                id: 1,
                has2FA: false,
                twoFactorSecret: null,
            };

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);

            await disable2FA(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message:
                    "L'authentification à deux facteurs n'est pas activée pour cet utilisateur",
            });
        });

        test("should reject incorrect OTP", async () => {
            mockRequest.body = {
                userId: 1,
                otp: "123456",
            };

            const mockUser = {
                id: 1,
                has2FA: true,
                twoFactorSecret: "SECRET123",
            };

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

            await disable2FA(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(speakeasy.totp.verify).toHaveBeenCalledWith({
                secret: "SECRET123",
                encoding: "base32",
                token: "123456",
            });
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: "Code d'authentification incorrect",
            });
        });

        test("should successfully disable 2FA", async () => {
            mockRequest.body = {
                userId: 1,
                otp: "123456",
            };

            const mockUser = {
                id: 1,
                has2FA: true,
                twoFactorSecret: "SECRET123",
            };

            (User.findByPk as jest.Mock).mockResolvedValue(mockUser);
            (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
            (User.update as jest.Mock).mockResolvedValue([1]);

            await disable2FA(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(User.update).toHaveBeenCalledWith(
                {
                    twoFactorSecret: null,
                    has2FA: false,
                },
                {
                    where: { id: 1 },
                }
            );
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message:
                    "L'authentification à deux facteurs a été désactivée avec succès",
            });
        });

        test("should pass errors to next middleware", async () => {
            mockRequest.body = {
                userId: 1,
                otp: "123456",
            };

            const error = new Error("Test error");
            (User.findByPk as jest.Mock).mockRejectedValue(error);

            await disable2FA(
                mockRequest as Request,
                mockResponse as Response,
                nextFunction
            );

            expect(nextFunction).toHaveBeenCalledWith(error);
        });
    });
});
