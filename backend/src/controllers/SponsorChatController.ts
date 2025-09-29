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

			// Check if user has a sponsor (user is sponsored) - include pending and accepted
			const sponsorship = await Sponsor.findOne({
				where: { 
					userId, 
					isActive: true,
					status: 'accepted' // Only show accepted sponsorships as active
				},
				include: [
					{
						model: User,
						as: "sponsor",
						attributes: ["id", "login", "email"],
					},
				],
			});

			// Check if user is a sponsor (user sponsors others) - include pending and accepted
			const sponsoredUsers = await Sponsor.findAll({
				where: { 
					sponsorId: userId, 
					isActive: true,
					status: 'accepted' // Only show accepted sponsorships as active
				},
				include: [
					{
						model: User,
						as: "user",
						attributes: ["id", "login", "email"],
					},
				],
			});

			// Get the user's own sponsor code
			const currentUser = await User.findByPk(userId, {
				attributes: ["sponsorCode"],
			});

			// Get pending sponsor requests where this user is the sponsor
			const pendingRequests = await Sponsor.findAll({
				where: { sponsorId: userId, status: 'pending' },
				include: [
					{
						model: User,
						as: "user",
						attributes: ["id", "login", "email"],
					},
				],
			});

			// Also check if this user has a pending outgoing request
			const outgoingPendingRequest = await Sponsor.findOne({
				where: { userId: userId, status: 'pending' },
				include: [
					{
						model: User,
						as: "sponsor",
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
					sponsorCode: currentUser?.sponsorCode,
					pendingRequests: pendingRequests,
					outgoingPendingRequest: outgoingPendingRequest,
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

	// Request sponsorship using sponsor code
	static async requestSponsor(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user!.id;
			const { sponsorCode } = req.body;

			if (!sponsorCode) {
				res.status(400).json({
					success: false,
					message: "Sponsor code is required",
				});
				return;
			}

			// Check if user already has a sponsor
			const existingSponsor = await Sponsor.findOne({
				where: { userId, isActive: true },
			});

			if (existingSponsor) {
				res.status(400).json({
					success: false,
					message: "You already have a sponsor",
				});
				return;
			}

			// Check if there's already a pending request
			const pendingRequest = await Sponsor.findOne({
				where: { userId, status: 'pending' },
			});

			if (pendingRequest) {
				res.status(400).json({
					success: false,
					message: "You already have a pending sponsor request",
				});
				return;
			}

			// Find the sponsor by code
			const sponsor = await User.findOne({
				where: { sponsorCode },
			});

			if (!sponsor) {
				res.status(404).json({
					success: false,
					message: "Invalid sponsor code",
				});
				return;
			}

			// Can't sponsor yourself
			if (sponsor.id === userId) {
				res.status(400).json({
					success: false,
					message: "You cannot sponsor yourself",
				});
				return;
			}

			// Create pending sponsorship request
			const sponsorship = await Sponsor.create({
				sponsorId: sponsor.id,
				userId: userId,
				status: 'pending',
				isActive: false, // Will be activated when accepted
			});

			res.json({
				success: true,
				data: {
					message: "Sponsor request sent successfully",
					sponsorship: sponsorship,
				},
			});
		} catch (error) {
			console.error("Error requesting sponsor:", error);
			res.status(500).json({
				success: false,
				message: "Failed to request sponsor",
			});
		}
	}

	// Accept or reject a sponsor request
	static async respondToSponsorRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user!.id;
		const { sponsorshipId, action } = req.body;

		if (!sponsorshipId || !action || !['accept', 'reject'].includes(action)) {
			res.status(400).json({
				success: false,
				message: "Sponsorship ID and valid action (accept/reject) are required",
			});
			return;
		}

			const sponsorship = await Sponsor.findByPk(sponsorshipId);
			if (!sponsorship) {
				res.status(404).json({
					success: false,
					message: "Sponsorship request not found",
				});
				return;
			}

			// Check if user is the sponsor
			if (sponsorship.sponsorId !== userId) {
				res.status(403).json({
					success: false,
					message: "Not authorized for this sponsorship request",
				});
				return;
			}

			// Check if request is still pending
			if (sponsorship.status !== 'pending') {
				res.status(400).json({
					success: false,
					message: "This request has already been processed",
				});
				return;
			}

		if (action === 'accept') {
			sponsorship.status = 'accepted';
			sponsorship.isActive = true;
			sponsorship.startedAt = new Date();
		} else {
			sponsorship.status = 'rejected';
		}

			await sponsorship.save();

			res.json({
				success: true,
				data: {
					message: action === 'accept' ? "Sponsor request accepted" : "Sponsor request rejected",
					sponsorship: sponsorship,
				},
			});
		} catch (error) {
			console.error("Error responding to sponsor request:", error);
			res.status(500).json({
				success: false,
				message: "Failed to respond to sponsor request",
			});
		}
	}

	// Remove a sponsor relationship
	static async removeSponsor(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user!.id;
			const { sponsorshipId } = req.params;

			// Validate sponsorshipId
			if (!sponsorshipId || isNaN(parseInt(sponsorshipId))) {
				res.status(400).json({
					success: false,
					message: "Invalid sponsorship ID",
				});
				return;
			}

			const sponsorship = await Sponsor.findByPk(parseInt(sponsorshipId));
			if (!sponsorship) {
				res.status(404).json({
					success: false,
					message: "Sponsorship not found",
				});
				return;
			}

			// Check if user is part of this sponsorship
			const isAuthorized = sponsorship.sponsorId === userId || sponsorship.userId === userId;
			
			if (!isAuthorized) {
				res.status(403).json({
					success: false,
					message: "Not authorized for this sponsorship",
				});
				return;
			}

			// Check if sponsorship is already ended
			if (!sponsorship.isActive && sponsorship.endedAt) {
				res.status(400).json({
					success: false,
					message: "This sponsorship has already been ended",
				});
				return;
			}

			// Deactivate the sponsorship
			sponsorship.isActive = false;
			sponsorship.endedAt = new Date();
			await sponsorship.save();

			res.json({
				success: true,
				data: {
					message: "Sponsorship ended successfully",
				},
			});
		} catch (error) {
			console.error("Error removing sponsor:", error);
			res.status(500).json({
				success: false,
				message: "Failed to remove sponsor",
			});
		}
	}

	// Get pending sponsor requests for the current user
	static async getPendingSponsorRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user!.id;

			// Get pending requests where user is being requested as sponsor
			const pendingRequests = await Sponsor.findAll({
				where: { sponsorId: userId, status: 'pending' },
				include: [
					{
						model: User,
						as: "user",
						attributes: ["id", "login", "email"],
					},
				],
			});

			// Get user's own pending request (if any)
			const ownPendingRequest = await Sponsor.findOne({
				where: { userId: userId, status: 'pending' },
				include: [
					{
						model: User,
						as: "sponsor",
						attributes: ["id", "login", "email"],
					},
				],
			});

			res.json({
				success: true,
				data: {
					incomingRequests: pendingRequests,
					outgoingRequest: ownPendingRequest,
				},
			});
		} catch (error) {
			console.error("Error getting pending requests:", error);
			res.status(500).json({
				success: false,
				message: "Failed to get pending requests",
			});
		}
	}

	// Check for sponsor status updates (called when user starts the app)
	static async checkSponsorStatusUpdates(req: AuthenticatedRequest, res: Response): Promise<void> {
		try {
			const userId = req.user!.id;

			// Check for newly accepted sponsorships
			const updatedSponsorships = await Sponsor.findAll({
				where: { 
					userId, 
					status: 'accepted',
					keyExchangeComplete: true 
				},
				include: [
					{
						model: User,
						as: "sponsor",
						attributes: ["id", "login", "email"],
					},
				],
			});

			// Check for rejected requests
			const rejectedRequests = await Sponsor.findAll({
				where: { 
					userId, 
					status: 'rejected' 
				},
				include: [
					{
						model: User,
						as: "sponsor",
						attributes: ["id", "login", "email"],
					},
				],
			});

			res.json({
				success: true,
				data: {
					acceptedSponsorships: updatedSponsorships,
					rejectedRequests: rejectedRequests,
				},
			});
		} catch (error) {
			console.error("Error checking sponsor status updates:", error);
			res.status(500).json({
				success: false,
				message: "Failed to check sponsor status updates",
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
			const { sponsorshipId, content, messageType = "text" } = req.body;

			if (!sponsorshipId || !content) {
				res.status(400).json({
					success: false,
					message: "Sponsorship ID and message content are required",
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

			// Check if sponsorship is active
			if (!sponsorship.isActive || sponsorship.status !== 'accepted') {
				res.status(400).json({
					success: false,
					message: "Sponsorship must be active to send messages",
				});
				return;
			}

			const message = await SponsorMessage.create({
				sponsorshipId,
				senderId: userId,
				encryptedContent: content, // Store plain text content in the field for now
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