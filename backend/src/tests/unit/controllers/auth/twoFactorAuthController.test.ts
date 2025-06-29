import { Request, Response, NextFunction } from "express";
import {
<<<<<<< HEAD:backend/tests/unit/controllers/auth/twoFactorAuthController.test.ts
	generate2FASecret,
	verify2FASetup,
	verify2FALogin,
	disable2FA,
} from "../../../../src/controllers/auth/twoFactorAuthController";
import User from "../../../../src/models/User";
import { TwoFactorService } from "../../../../src/services/TwoFactorServices";
=======
    generate2FASecret,
    verify2FASetup,
    verify2FALogin,
    disable2FA,
} from "../../../../controllers/auth/twoFactorAuthController";
import User from "../../../../models/User";
import { TwoFactorService } from "../../../../services/TwoFactorServices";
>>>>>>> mar/typing-tests:backend/src/tests/unit/controllers/auth/twoFactorAuthController.test.ts
import * as jwt from "jsonwebtoken";
import * as JwtService from "../../../../services/JwtServices";

// Mocks
jest.mock("../../../../models/User");
jest.mock("../../../../services/TwoFactorServices");
jest.mock("../../../../services/JwtServices");
jest.mock("jsonwebtoken");

const mockJson = jest.fn();
const mockStatus = jest.fn(() => ({ json: mockJson }));
const mockRes = { status: mockStatus } as unknown as Response;

const mockNext = jest.fn();

describe("2FA Controller", () => {
<<<<<<< HEAD:backend/tests/unit/controllers/auth/twoFactorAuthController.test.ts
	afterEach(() => {
		jest.clearAllMocks();
	});
=======
let mockJson: jest.Mock;
let mockStatus: jest.Mock;
let mockRes: Response;

beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockImplementation(() => ({
        json: mockJson,
    }));

    // 👇 Cast complet pour satisfaire TypeScript
    mockRes = {
        status: mockStatus,
        json: mockJson,
    } as unknown as Response;
});

    afterEach(() => {
        jest.clearAllMocks();
    });
>>>>>>> mar/typing-tests:backend/src/tests/unit/controllers/auth/twoFactorAuthController.test.ts

	describe("generate2FASecret", () => {
		it("should return 200 and QR code for valid user", async () => {
			const mockReq = { user: { id: "1" } } as Request;

			(User.findByPk as jest.Mock).mockResolvedValue({
				id: "1",
				email: "user@example.com",
			});
			(
				TwoFactorService.prototype.generateSecret as jest.Mock
			).mockResolvedValue({
				base32: "SECRET",
				otpauth_url: "otpauth://test",
				qrCode: "data:image/png;base64,test",
			});
			(JwtService.generateToken as jest.Mock).mockReturnValue("temp.jwt.token");

			await generate2FASecret(mockReq, mockRes, mockNext);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					tempToken: "temp.jwt.token",
					qrCodeUrl: "data:image/png;base64,test",
					secret: "SECRET",
				}),
			);
		});

		it("should return 404 if user not found", async () => {
			const mockReq = { user: { id: "999" } } as Request;
			(User.findByPk as jest.Mock).mockResolvedValue(null);

			await generate2FASecret(mockReq, mockRes, mockNext);
			expect(mockStatus).toHaveBeenCalledWith(404);
		});
	});

	describe("verify2FASetup", () => {
		it("should verify OTP and update user", async () => {
			const mockReq = {
				body: { token: "token", otp: "123456" },
				ip: "127.0.0.1",
			} as Request;

            const decoded = {
                setupPhase: true,
                secret: "SECRET",
                userId: "1",
            };
            (JwtService.generateToken as jest.Mock).mockReturnValue("final.jwt.token");
            (jwt.verify as jest.Mock).mockReturnValue(decoded);
            (TwoFactorService.prototype.verifyOTP as jest.Mock).mockReturnValue(
                true
            );

            (User.findByPk as jest.Mock).mockResolvedValue({
                id: "1",
                login: "user1",
                notify: true,
                hourNotify: "08:00",
                hasPremium: true,
            });
            (User.update as jest.Mock).mockResolvedValue([1]);

			await verify2FASetup(mockReq, mockRes, mockNext);

			expect(User.update).toHaveBeenCalledWith(
				{
					twoFactorSecret: "SECRET",
					has2FA: true,
				},
				{
					where: { id: "1" },
				},
			);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message:
						"L'authentification à deux facteurs a été activée avec succès",
					newToken: expect.any(String),
				}),
			);
		});

		it("should return 400 if OTP invalid", async () => {
			const mockReq = {
				body: { token: "token", otp: "abc" },
				ip: "127.0.0.1",
			} as Request;

			await verify2FASetup(mockReq, mockRes, mockNext);
			expect(mockStatus).toHaveBeenCalledWith(400);
		});

		it("should return 400 if token invalid", async () => {
			const mockReq = {
				body: { token: "token", otp: "123456" },
			} as Request;

			(jwt.verify as jest.Mock).mockReturnValue({ setupPhase: false });

			await verify2FASetup(mockReq, mockRes, mockNext);
			expect(mockStatus).toHaveBeenCalledWith(400);
		});
	});

	describe("verify2FALogin", () => {
		it("should return 200 and token if OTP valid", async () => {
			const mockReq = {
				body: { tempToken: "token", otp: "123456" },
				ip: "127.0.0.1",
			} as Request;

			const decoded = { requiresTwoFactor: true, id: "1" };
			const mockUser = {
				id: "1",
				login: "user1",
				password: "secret",
				twoFactorSecret: "SECRET",
			};

			(jwt.verify as jest.Mock).mockReturnValue(decoded);
			(User.findByPk as jest.Mock).mockResolvedValue(mockUser);
			(TwoFactorService.prototype.verifyOTP as jest.Mock).mockReturnValue(true);
			(JwtService.generateToken as jest.Mock).mockReturnValue(
				"final.jwt.token",
			);

			await verify2FALogin(mockReq, mockRes, mockNext);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					token: "final.jwt.token",
				}),
			);
		});

		it("should return 401 if OTP invalid", async () => {
			const mockReq = {
				body: { tempToken: "token", otp: "123456" },
				ip: "127.0.0.1",
			} as Request;

			const decoded = { requiresTwoFactor: true, id: "1" };
			const mockUser = {
				id: "1",
				login: "user1",
				password: "secret",
				twoFactorSecret: "SECRET",
			};

			(jwt.verify as jest.Mock).mockReturnValue(decoded);
			(User.findByPk as jest.Mock).mockResolvedValue(mockUser);
			(TwoFactorService.prototype.verifyOTP as jest.Mock).mockReturnValue(
				false,
			);

			await verify2FALogin(mockReq, mockRes, mockNext);
			expect(mockStatus).toHaveBeenCalledWith(401);
		});
	});

	describe("disable2FA", () => {
		it("should disable 2FA successfully", async () => {
			const mockReq = {
				body: { userId: "1", otp: "123456" },
			} as Request;

			const mockUser = {
				id: "1",
				twoFactorSecret: "SECRET",
				has2FA: true,
			};

			(User.findByPk as jest.Mock).mockResolvedValue(mockUser);
			(TwoFactorService.prototype.verifyOTP as jest.Mock).mockReturnValue(true);
			(User.update as jest.Mock).mockResolvedValue([1]);

			await disable2FA(mockReq, mockRes, mockNext);
			expect(mockStatus).toHaveBeenCalledWith(200);
		});

		it("should return 404 if user not found", async () => {
			const mockReq = {
				body: { userId: "99", otp: "123456" },
			} as Request;

			(User.findByPk as jest.Mock).mockResolvedValue(null);

			await disable2FA(mockReq, mockRes, mockNext);
			expect(mockStatus).toHaveBeenCalledWith(404);
		});

		it("should return 401 if OTP invalid", async () => {
			const mockReq = {
				body: { userId: 1, otp: "123456" },
			} as Request;

			const mockUser = {
				id: "1",
				twoFactorSecret: "SECRET",
				has2FA: true,
			};

			(User.findByPk as jest.Mock).mockResolvedValue(mockUser);
			(TwoFactorService.prototype.verifyOTP as jest.Mock).mockReturnValue(
				false,
			);

			await disable2FA(mockReq, mockRes, mockNext);
			expect(mockStatus).toHaveBeenCalledWith(401);
		});
	});
});
