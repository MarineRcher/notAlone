import { Request, Response } from "express";
import Sponsor from "../models/Sponsor";
import SponsorMessage from "../models/SponsorMessage";
import User from "../models/User";
import { UserAttributes } from "../types/users";

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
	user?: UserAttributes;
}

class SponsorChatController {
	// Get sponsor relationship info for current user
	static async getSponsorshipInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user!.id;

			// Check if user has a sponsor (user is sponsored)
			const sponsorship = await Sponsor.findOne({
				where: { userId, isActive: true },
				include: [
					{
						model: User,
						as: "sponsor",
						attributes: ["id", "login", "email"],
					},
				],
			});

			// Check if user is a sponsor (user sponsors others)
			const sponsoredUsers = await Sponsor.findAll({
				where: { sponsorId: userId, isActive: true },
				include: [
					{
						model: User,
						as: "user",
						attributes: ["id", "login", "email"],
					},
				],
			});

			res.json({
				success: true,
				data: {
					hasSponsor: !!sponsorship,
					sponsorship: sponsorship,
					isSponsoring: sponsoredUsers.length > 0,
					sponsoredUsers: sponsoredUsers,
				},
			});
		} catch (error) {
			console.error("Error getting sponsorship info:", error);
			res.status(500).json({
				success: false,
				message: "Failed to get sponsorship information",
			});
		}
	}

	// Update public key for sponsor chat
	static async updatePublicKey(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user!.id;
			const { publicKey, sponsorshipId } = req.body;

			if (!publicKey || !sponsorshipId) {
				res.status(400).json({
					success: false,
					message: "Public key and sponsorship ID are required",
				});
				return;
			}

			const sponsorship = await Sponsor.findByPk(sponsorshipId);
			if (!sponsorship) {
				res.status(404).json({
					success: false,
					message: "Sponsorship not found",
				});
				return;
			}

			// Check if user is part of this sponsorship
			if (sponsorship.sponsorId !== userId && sponsorship.userId !== userId) {
				res.status(403).json({
					success: false,
					message: "Not authorized for this sponsorship",
				});
				return;
			}

			// Update the appropriate public key
			if (sponsorship.sponsorId === userId) {
				sponsorship.sponsorPublicKey = publicKey;
			} else {
				sponsorship.userPublicKey = publicKey;
			}

			// Check if key exchange is complete
			if (sponsorship.sponsorPublicKey && sponsorship.userPublicKey) {
				sponsorship.keyExchangeComplete = true;
			}

			await sponsorship.save();

			res.json({
				success: true,
				data: {
					keyExchangeComplete: sponsorship.keyExchangeComplete,
				},
			});
		} catch (error) {
			console.error("Error updating public key:", error);
			res.status(500).json({
				success: false,
				message: "Failed to update public key",
			});
		}
	}

	// Get messages for a sponsorship
	static async getMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user!.id;
			const { sponsorshipId } = req.params;

			const sponsorship = await Sponsor.findByPk(sponsorshipId);
			if (!sponsorship) {
				res.status(404).json({
					success: false,
					message: "Sponsorship not found",
				});
				return;
			}

			// Check if user is part of this sponsorship
			if (sponsorship.sponsorId !== userId && sponsorship.userId !== userId) {
				res.status(403).json({
					success: false,
					message: "Not authorized for this sponsorship",
				});
				return;
			}

			const messages = await SponsorMessage.findAll({
				where: { sponsorshipId },
				include: [
					{
						model: User,
						as: "sender",
						attributes: ["id", "login"],
					},
				],
				order: [["timestamp", "ASC"]],
			});

			res.json({
				success: true,
				data: {
					messages,
					sponsorship,
				},
			});
		} catch (error) {
			console.error("Error getting messages:", error);
			res.status(500).json({
				success: false,
				message: "Failed to get messages",
			});
		}
	}

	// Send a message
	static async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user!.id;
			const { sponsorshipId, encryptedContent, messageType = "text" } = req.body;

			if (!sponsorshipId || !encryptedContent) {
				res.status(400).json({
					success: false,
					message: "Sponsorship ID and encrypted content are required",
				});
				return;
			}

			const sponsorship = await Sponsor.findByPk(sponsorshipId);
			if (!sponsorship) {
				res.status(404).json({
					success: false,
					message: "Sponsorship not found",
				});
				return;
			}

			// Check if user is part of this sponsorship
			if (sponsorship.sponsorId !== userId && sponsorship.userId !== userId) {
				res.status(403).json({
					success: false,
					message: "Not authorized for this sponsorship",
				});
				return;
			}

			// Check if key exchange is complete
			if (!sponsorship.keyExchangeComplete && messageType !== "key_exchange") {
				res.status(400).json({
					success: false,
					message: "Key exchange must be completed before sending messages",
				});
				return;
			}

			const message = await SponsorMessage.create({
				sponsorshipId,
				senderId: userId,
				encryptedContent,
				messageType,
			});

			res.json({
				success: true,
				data: message,
			});
		} catch (error) {
			console.error("Error sending message:", error);
			res.status(500).json({
				success: false,
				message: "Failed to send message",
			});
		}
	}
}

export default SponsorChatController; 