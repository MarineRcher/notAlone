import { redisClient } from "../config/redis";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Generates a JWT token with specified payload and expiration
 * @param payload - Data to be encoded in the token
 * @param expiresIn - Token validity duration (e.g., '1h', '7d')
 * @returns {string} Signed JWT token
 * @throws {Error} If JWT_SECRET environment variable is not set
 */
export const generateToken = (payload: object, expiresIn: string): string => {
	return jwt.sign(payload, process.env.JWT_SECRET!, {
		expiresIn,
	} as jwt.SignOptions);
};

/**
 * Revokes a JWT token by adding it to a Redis blacklist
 * @param {string} token - JWT token to revoke
 * @returns {Promise<void>} Resolves when token is added to blacklist
 * @description Uses SHA-256 hashing to store token fingerprint in Redis
 * with TTL matching token's expiration time
 */
export const revokeToken = async (token: string): Promise<void> => {
	const decoded = jwt.decode(token) as { exp: number };
	const ttl = decoded.exp - Math.floor(Date.now() / 1000);
	const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
	await redisClient.set(`blacklist:${tokenHash}`, "revoked", { EX: ttl });
};
