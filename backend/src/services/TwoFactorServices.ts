import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { Service } from "typedi";
import logger from "../config/logger";

@Service()
export class TwoFactorService {
	/**
	 * Generates a 2FA secret and associated QR code
	 * @param email - User's email to personalize the QR code
	 * @returns Object containing base32 secret, TOTP authentication URL, and base64 QR code
	 * @throws Error if secret generation fails
	 */
	async generateSecret(email: string) {
		try {
			const secret = speakeasy.generateSecret({
				name: `MyApp:${email}`,
				issuer: "MyApp",
				length: 20,
			});

			if (!secret.otpauth_url) {
				throw new Error("Failed to generate 2FA secret");
			}

			const qrCode = await QRCode.toDataURL(secret.otpauth_url);

			return {
				base32: secret.base32,
				otpauth_url: secret.otpauth_url,
				qrCode,
			};
		} catch (error) {
			logger.error("Error generating 2FA secret", {
				error: error instanceof Error ? error.message : "Unknown error",
			});
			throw error;
		}
	}

	/**
	 * Verifies an OTP token against a stored 2FA secret
	 * @param secret - Stored base32-encoded 2FA secret
	 * @param token - OTP token to validate
	 * @param window - Time window for validity (in steps of 30 seconds)
	 * @returns Boolean indicating if token is valid
	 */
	verifyOTP(secret: string, token: string, window = 2): boolean {
		try {
			return speakeasy.totp.verify({
				secret,
				encoding: "base32",
				token,
				window,
			});
		} catch (error) {
			logger.error("OTP verification failed", {
				error: error instanceof Error ? error.message : "Unknown error",
			});
			return false;
		}
	}

	/**
	 * Generates a QR code from a TOTP authentication URL
	 * @param otpauthUrl - TOTP provisioning URI
	 * @returns Data URL of the generated QR code
	 * @throws Error if QR code generation fails
	 */
	async generateQRCode(otpauthUrl: string): Promise<string> {
		try {
			return await QRCode.toDataURL(otpauthUrl);
		} catch (error) {
			logger.error("QR code generation failed", {
				error: error instanceof Error ? error.message : "Unknown error",
			});
			throw new Error("Failed to generate QR code");
		}
	}
}
