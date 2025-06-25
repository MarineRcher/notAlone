import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import GroupService from "../services/GroupService";
import GroupMember from "../models/GroupMember";
import User from "../models/User";

const router = express.Router();
const groupService = new GroupService();

// Middleware to authenticate JWT tokens
interface AuthenticatedRequest extends Request {
	userId?: number;
	userLogin?: string;
}

const authenticateToken = (
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): void => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

	if (!token) {
		res.status(401).json({ error: "Access token required" });
		return;
	}

	try {
		const secret = process.env.JWT_SECRET || "your-secret-key";
		const decoded = jwt.verify(token, secret) as any;

		req.userId = decoded.userId;
		req.userLogin = decoded.login;
		next();
	} catch (error) {
		res.status(403).json({ error: "Invalid or expired token" });
		return;
	}
};

/**
 * GET /api/groups/stats
 * Get group statistics
 */
router.get("/stats", async (req: Request, res: Response) => {
	try {
		const stats = await groupService.getGroupStats();
		res.json({
			success: true,
			stats,
		});
	} catch (error) {
		console.error("Error getting group stats:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get group statistics",
		});
	}
});

/**
 * POST /api/groups/join-random
 * Join a random group (HTTP fallback, mainly used via Socket.IO)
 */
router.post(
	"/join-random",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const { publicKey } = req.body;

			const result = await groupService.joinRandomGroupWithWaitroom(
				req.userId!,
				publicKey,
				req.userLogin,
			);

			if (result.success) {
				res.json({
					success: true,
					group: result.group,
					message: result.message,
				});
			} else {
				res.status(400).json({
					success: false,
					message: result.message,
				});
			}
		} catch (error) {
			console.error("Error joining random group:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	},
);

/**
 * POST /api/groups/:groupId/leave
 * Leave a group
 */
router.post(
	"/:groupId/leave",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const { groupId } = req.params;

			const success = await groupService.leaveGroup(req.userId!, groupId);

			if (success) {
				res.json({
					success: true,
					message: "Successfully left group",
				});
			} else {
				res.status(400).json({
					success: false,
					message: "Failed to leave group",
				});
			}
		} catch (error) {
			console.error("Error leaving group:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	},
);

/**
 * GET /api/groups/:groupId
 * Get group information
 */
router.get(
	"/:groupId",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const { groupId } = req.params;

			const group = await groupService.getGroupWithMembers(groupId);

			res.json({
				success: true,
				group,
			});
		} catch (error) {
			console.error("Error getting group info:", error);
			res.status(404).json({
				success: false,
				message: "Group not found",
			});
		}
	},
);

/**
 * GET /api/groups/:groupId/messages
 * Get group messages
 */
router.get(
	"/:groupId/messages",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const { groupId } = req.params;
			const limit = parseInt(req.query.limit as string) || 50;

			const messages = await groupService.getGroupMessages(groupId, limit);

			res.json({
				success: true,
				messages: messages.map(msg => ({
					id: msg.id,
					senderId: msg.senderId,
					senderLogin: (msg as any).sender?.login,
					encryptedContent: msg.encryptedContent,
					messageType: msg.messageType,
					timestamp: msg.timestamp,
				})),
			});
		} catch (error) {
			console.error("Error getting group messages:", error);
			res.status(500).json({
				success: false,
				message: "Failed to get messages",
			});
		}
	},
);

/**
 * POST /api/groups/:groupId/messages
 * Send a message to a group (HTTP fallback, mainly used via Socket.IO)
 */
router.post(
	"/:groupId/messages",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const { groupId } = req.params;
			const { encryptedMessage, messageType = "text" } = req.body;

			if (!encryptedMessage) {
				res.status(400).json({
					success: false,
					message: "Encrypted message content is required",
				});
				return;
			}

			const message = await groupService.storeMessage(
				groupId,
				req.userId!,
				encryptedMessage,
				messageType,
			);

			res.json({
				success: true,
				messageId: message.id,
				timestamp: message.timestamp,
			});
		} catch (error) {
			console.error("Error sending message:", error);
			res.status(500).json({
				success: false,
				message: "Failed to send message",
			});
		}
	},
);

/**
 * GET /api/groups (Admin route)
 * Get all active groups with pagination
 */
router.get("/", async (req: Request, res: Response) => {
	try {
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 20;

		const result = await groupService.getActiveGroups(page, limit);

		res.json({
			success: true,
			groups: result.rows,
			pagination: {
				page,
				limit,
				total: result.count,
				totalPages: Math.ceil(result.count / limit),
			},
		});
	} catch (error) {
		console.error("Error getting active groups:", error);
		res.status(500).json({
			success: false,
			message: "Failed to get groups",
		});
	}
});

/**
 * POST /api/groups/cleanup
 * Cleanup inactive groups (Admin route)
 */
router.post("/cleanup", async (req: Request, res: Response) => {
	try {
		await groupService.cleanupInactiveGroups();

		res.json({
			success: true,
			message: "Cleanup completed successfully",
		});
	} catch (error) {
		console.error("Error during cleanup:", error);
		res.status(500).json({
			success: false,
			message: "Failed to cleanup groups",
		});
	}
});

// E2EE Integration Routes - These match the frontend API expectations

/**
 * POST /api/users/:userId/sessions
 * Initialize encrypted session (for e2ee compatibility)
 */
router.post(
	"/users/:userId/sessions",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const { userId } = req.params;
			const { publicKey, timestamp, signature } = req.body;

			// In a real implementation, you would verify the signature and establish a session
			// For this demo, we'll return a mock response that the frontend expects

			res.json({
				userId: req.userId,
				publicKey: publicKey, // Echo back for simplicity
				timestamp: Date.now(),
				signature: "mock_signature", // In real implementation, sign with server's key
			});
		} catch (error) {
			console.error("Error initializing session:", error);
			res.status(500).json({
				success: false,
				message: "Failed to initialize session",
			});
		}
	},
);

/**
 * GET /api/users/:userId/public-key
 * Get user's public key (for e2ee)
 */
router.get(
	"/users/:userId/public-key",
	async (req: Request, res: Response): Promise<void> => {
		try {
			const { userId } = req.params;

			// Find the user's most recent group membership to get their public key
			const groupMember = await GroupMember.findOne({
				where: { userId: parseInt(userId), isActive: true },
				order: [["joinedAt", "DESC"]],
				attributes: ["publicKey"],
			});

			if (groupMember && groupMember.publicKey) {
				res.json({
					success: true,
					data: groupMember.publicKey,
				});
			} else {
				res.status(404).json({
					success: false,
					message: "Public key not found for user",
				});
			}
		} catch (error) {
			console.error("Error getting public key:", error);
			res.status(500).json({
				success: false,
				message: "Failed to get public key",
			});
		}
	},
);

/**
 * POST /api/messages
 * Send encrypted message (group message endpoint for e2ee compatibility)
 */
router.post(
	"/messages",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const { to, encrypted } = req.body;

			// 'to' could be a groupId, 'encrypted' is the serialized encrypted message
			// This endpoint is used by the frontend's encryptedApi for sending messages

			if (!to || !encrypted) {
				res.status(400).json({
					success: false,
					message: "Recipient and encrypted content are required",
				});
				return;
			}

			// Store the message
			const message = await groupService.storeMessage(
				to, // Assuming 'to' is a groupId
				req.userId!,
				encrypted,
				"text",
			);

			res.json({
				success: true,
				messageId: message.id,
			});
		} catch (error) {
			console.error("Error sending encrypted message:", error);
			res.status(500).json({
				success: false,
				message: "Failed to send encrypted message",
			});
		}
	},
);

/**
 * POST /api/group-messages
 * Send encrypted group message (for e2ee compatibility)
 */
router.post(
	"/group-messages",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const { groupId, encrypted } = req.body;

			if (!groupId || !encrypted) {
				res.status(400).json({
					success: false,
					message: "Group ID and encrypted content are required",
				});
				return;
			}

			// Store the group message
			const message = await groupService.storeMessage(
				groupId,
				req.userId!,
				encrypted,
				"text",
			);

			res.json({
				success: true,
				messageId: message.id,
			});
		} catch (error) {
			console.error("Error sending encrypted group message:", error);
			res.status(500).json({
				success: false,
				message: "Failed to send encrypted group message",
			});
		}
	},
);

/**
 * GET /api/groups/:groupId/members/public-keys
 * Get all public keys for group members (for e2ee)
 */
router.get(
	"/groups/:groupId/members/public-keys",
	authenticateToken,
	async (req: AuthenticatedRequest, res: Response): Promise<void> => {
		try {
			const { groupId } = req.params;

			// Get all active group members with their public keys
			const members = await GroupMember.findAll({
				where: {
					groupId,
					isActive: true,
				},
				include: [
					{
						model: User,
						as: "user",
						attributes: ["id", "login"],
					},
				],
				attributes: ["userId", "publicKey"],
			});

			// Format response as userId -> publicKey mapping
			const publicKeys: { [userId: string]: string } = {};
			members.forEach(member => {
				if (member.publicKey) {
					publicKeys[member.userId.toString()] = member.publicKey;
				}
			});

			res.json({
				success: true,
				data: publicKeys,
			});
		} catch (error) {
			console.error("Error getting group member public keys:", error);
			res.status(500).json({
				success: false,
				message: "Failed to get group member public keys",
			});
		}
	},
);

export default router;
