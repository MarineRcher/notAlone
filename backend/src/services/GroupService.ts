import { Op } from "sequelize";
import Group from "../models/Group";
import GroupMember from "../models/GroupMember";
import User from "../models/User";
import Message from "../models/Message";
import RedisService from "./RedisService";

export interface JoinGroupResult {
	success: boolean;
	group?: {
		id: string;
		name: string;
		currentMembers: number;
		maxMembers: number;
		members: Array<{
			userId: number;
			login: string;
			publicKey?: string;
			joinedAt: Date;
		}>;
	};
	message?: string;
}

export interface GroupStats {
	totalGroups: number;
	activeGroups: number;
	totalMembers: number;
	averageGroupSize: number;
}

class GroupService {
	private redisService: RedisService;

	constructor() {
		this.redisService = new RedisService();
	}

	/**
	 * Create a mock user for testing purposes
	 */

	/**
	 * Enhanced group joining with waitroom support
	 */
	async joinRandomGroupWithWaitroom(
		userId: number,
		userPublicKey?: string,
		userLogin?: string,
	): Promise<JoinGroupResult> {
		try {
			// Verify user exists in database - no more on-the-fly creation
			const actualUser: User | null = await User.findByPk(userId);
			if (!actualUser) {
				console.error(
					`❌ User not found in database: ${userId} (${userLogin})`,
				);
				return {
					success: false,
					message:
						"User not found. Please use a valid test user (alice, bob, charlie, diana, eve)",
				};
			}

			console.log(
				`✅ Found user in database: ${actualUser.login} (ID: ${actualUser.id})`,
			);

			// Check if user is already in an active group
			console.log(
				`🔍 Checking if user ${actualUser.id} (${actualUser.login}) is already in an active group...`,
			);
			const existingMembership = await GroupMember.findOne({
				where: {
					userId: actualUser.id,
					isActive: true,
				},
				include: [
					{
						model: Group,
						as: "group",
						where: {
							status: { [Op.in]: ["waiting", "active"] },
						},
					},
				],
			});

			if (existingMembership) {
				console.log(
					`✅ User ${actualUser.login} already in group ${existingMembership.groupId}`,
				);
				const group = await this.getGroupWithMembers(
					existingMembership.groupId,
				);
				const groupModel = (existingMembership as any).group; // Type assertion to access included model
				return {
					success: true,
					group,
					message:
						groupModel.status === "waiting"
							? "In waitroom"
							: "Rejoined existing group",
				};
			}

			console.log(
				`✅ User ${actualUser.login} not in any active group, proceeding to find/create group...`,
			);

			// First, try to find a waiting group
			const waitingGroup = await Group.findOne({
				where: {
					status: "waiting",
					isPublic: true,
					currentMembers: {
						[Op.lt]: Group.sequelize!.col("min_members_to_start"),
					},
				},
				order: [["createdAt", "ASC"]], // Oldest waiting group first
			});

			let targetGroup: Group;

			if (waitingGroup) {
				// Add user to waiting group
				targetGroup = waitingGroup;
			} else {
				// Create new waiting group
				targetGroup = await this.createNewWaitingGroup();
			}

			// Add user to the group
			await this.addUserToGroup(targetGroup.id, actualUser.id, userPublicKey);

			// Update group member count
			const newMemberCount = targetGroup.currentMembers + 1;
			await targetGroup.update({
				currentMembers: newMemberCount,
			});

			// Check if we have enough members to start the group
			if (newMemberCount >= targetGroup.minMembersToStart) {
				await this.activateWaitingGroup(targetGroup.id);
				targetGroup = (await Group.findByPk(targetGroup.id)) as Group;
			}

			// Get the complete group information
			const groupData = await this.getGroupWithMembers(targetGroup.id);

			// Cache the group info in Redis for fast lookups
			await this.redisService.cacheGroupInfo(targetGroup.id, groupData);

			return {
				success: true,
				group: groupData,
				message:
					targetGroup.status === "waiting"
						? "Added to waitroom"
						: "Group activated!",
			};
		} catch (error) {
			console.error("❌ Error joining random group with waitroom:", error);
			return {
				success: false,
				message: "Failed to join group",
			};
		}
	}

	/**
	 * Create a new waiting group
	 */
	private async createNewWaitingGroup(): Promise<Group> {
		const groupName = `Chat Room ${Math.floor(Math.random() * 10000)}`;

		return await Group.create({
			name: groupName,
			isActive: true,
			isPublic: true,
			maxMembers: 10, // Maximum group size
			minMembersToStart: 3, // Minimum to start chatting
			currentMembers: 0,
			status: "waiting",
		});
	}

	/**
	 * Activate a waiting group when it has enough members
	 */
	private async activateWaitingGroup(groupId: string): Promise<void> {
		await Group.update({ status: "active" }, { where: { id: groupId } });

		// Notify all waiting members that the group is now active
		const members = await GroupMember.findAll({
			where: { groupId, isActive: true },
			include: [{ model: User, as: "user" }],
		});

		// Here you could emit Socket.io events to notify users
		console.log(`🎉 Group ${groupId} activated with ${members.length} members`);
	}

	/**
	 * Seal a group permanently (no new members allowed)
	 */
	async sealGroup(groupId: string): Promise<boolean> {
		try {
			await Group.update(
				{ status: "sealed" },
				{ where: { id: groupId, status: "active" } },
			);
			return true;
		} catch (error) {
			console.error("Error sealing group:", error);
			return false;
		}
	}

	/**
	 * Leave a group - COMPLETELY removes user from group
	 */
	async leaveGroup(userId: number, groupId: string): Promise<boolean> {
		try {
			const membership = await GroupMember.findOne({
				where: {
					userId,
					groupId,
					isActive: true,
				},
			});

			if (!membership) {
				console.log(
					`❌ User ${userId} not found in group ${groupId} or already inactive`,
				);
				return false;
			}

			console.log(
				`🚪 User ${userId} leaving group ${groupId} - REMOVING membership completely`,
			);

			// COMPLETELY DELETE the membership instead of marking inactive
			await membership.destroy();

			// Update group member count
			const group = await Group.findByPk(groupId);
			if (group) {
				const newCount = Math.max(0, group.currentMembers - 1);
				await group.update({ currentMembers: newCount });

				console.log(
					`📊 Group ${groupId} member count updated: ${group.currentMembers} -> ${newCount}`,
				);

				// If group is empty, mark it as inactive and clean it up
				if (newCount === 0) {
					console.log(`🗑️ Group ${groupId} is now empty - marking as inactive`);
					await group.update({ isActive: false });

					// Optional: Delete empty group completely
					await this.cleanupEmptyGroup(groupId);
				}
			}

			// Clear cache
			await this.redisService.clearGroupCache(groupId);

			console.log(
				`✅ User ${userId} successfully removed from group ${groupId}`,
			);
			return true;
		} catch (error) {
			console.error("Error leaving group:", error);
			return false;
		}
	}

	/**
	 * Get group information with members
	 */
	async getGroupWithMembers(groupId: string) {
		const group = await Group.findByPk(groupId, {
			include: [
				{
					model: GroupMember,
					as: "members",
					where: { isActive: true },
					include: [
						{
							model: User,
							as: "user",
							attributes: ["id", "login"],
						},
					],
				},
			],
		});

		if (!group) {
			throw new Error("Group not found");
		}

		// Get the members from the included association
		const members = (group as any).members || [];

		return {
			id: group.id,
			name: group.name,
			currentMembers: group.currentMembers,
			maxMembers: group.maxMembers,
			members: members.map((member: any) => ({
				userId: member.user.id,
				login: member.user.login,
				publicKey: member.publicKey,
				joinedAt: member.joinedAt,
			})),
		};
	}

	/**
	 * Create a new group
	 */
	private async createNewGroup(): Promise<Group> {
		const groupNames = [
			"Random Chat #1",
			"Coffee Break",
			"Night Owls",
			"Study Group",
			"Tech Talk",
			"Casual Chat",
			"Weekend Vibes",
			"Quick Chat",
			"Anonymous Thoughts",
			"Random Connections",
			"Late Night Chat",
			"Morning Coffee",
			"Lunch Break",
			"After Hours",
			"Brain Storming",
		];

		const randomName =
			groupNames[Math.floor(Math.random() * groupNames.length)] +
			" - " +
			new Date().toLocaleTimeString();

		return await Group.create({
			name: randomName,
			maxMembers: Math.floor(Math.random() * 8) + 3, // 3-10 members
			isPublic: true,
			currentMembers: 0,
		});
	}

	/**
	 * Add a user to a group
	 */
	private async addUserToGroup(
		groupId: string,
		userId: number,
		publicKey?: string,
	): Promise<GroupMember> {
		console.log("🔍 addUserToGroup called with:", {
			groupId,
			userId,
			publicKey: !!publicKey,
		});

		if (!groupId) {
			console.error("❌ groupId is null/undefined!");
			throw new Error("groupId cannot be null");
		}

		// Check if user is already a member of this group
		const existingMember = await GroupMember.findOne({
			where: {
				groupId,
				userId,
				isActive: true,
			},
		});

		if (existingMember) {
			console.log(
				`ℹ️ User ${userId} already member of group ${groupId}, returning existing membership`,
			);
			// Update the public key if provided
			if (publicKey && publicKey !== existingMember.publicKey) {
				await existingMember.update({ publicKey });
			}
			return existingMember;
		}

		// Since we now DELETE memberships completely when leaving,
		// we don't need to check for inactive memberships anymore.
		// Just create a new membership directly.
		console.log(
			`✨ Creating new membership for user ${userId} in group ${groupId}`,
		);
		return await GroupMember.create({
			groupId,
			userId,
			publicKey,
			joinedAt: new Date(),
			isActive: true,
		});
	}

	/**
	 * Find or create a group by name (for non-UUID group IDs)
	 */
	async findOrCreateGroupByName(
		groupName: string,
	): Promise<{ groupId: string; isNew: boolean }> {
		try {
			// First try to find existing group by name
			let group = await Group.findOne({
				where: { name: groupName },
			});

			if (group) {
				return { groupId: group.id, isNew: false };
			}

			// Create new group if not found
			group = await Group.create({
				name: groupName,
				isActive: true,
				isPublic: true,
				maxMembers: 10,
				minMembersToStart: 2,
				status: "active", // Start as active for E2EE groups
			});

			return { groupId: group.id, isNew: true };
		} catch (error) {
			console.error("Error finding/creating group by name:", error);
			throw error;
		}
	}

	/**
	 * Store a message in the database
	 */
	async storeMessage(
		groupId: string,
		senderId: number,
		encryptedContent: string,
		messageType: "text" | "system" | "key_exchange" = "text",
	): Promise<Message> {
		return await Message.create({
			groupId,
			senderId,
			encryptedContent,
			messageType,
			timestamp: new Date(),
		});
	}

	/**
	 * Get recent messages for a group
	 */
	async getGroupMessages(
		groupId: string,
		limit: number = 50,
	): Promise<Message[]> {
		return await Message.findAll({
			where: { groupId },
			order: [["timestamp", "DESC"]],
			limit,
			include: [
				{
					model: User,
					as: "sender",
					attributes: ["id", "login"],
				},
			],
		});
	}

	/**
	 * Get group statistics
	 */
	async getGroupStats(): Promise<GroupStats> {
		const [totalGroups, activeGroups, totalMembers] = await Promise.all([
			Group.count(),
			Group.count({ where: { isActive: true } }),
			GroupMember.count({ where: { isActive: true } }),
		]);

		const averageGroupSize = activeGroups > 0 ? totalMembers / activeGroups : 0;

		return {
			totalGroups,
			activeGroups,
			totalMembers,
			averageGroupSize: Math.round(averageGroupSize * 100) / 100,
		};
	}

	/**
	 * Clean up inactive groups
	 */
	async cleanupInactiveGroups(): Promise<void> {
		const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

		await Group.update(
			{ isActive: false },
			{
				where: {
					isActive: true,
					currentMembers: 0,
					updatedAt: { [Op.lt]: cutoffTime },
				},
			},
		);
	}

	/**
	 * Get active groups for admin purposes
	 */
	async getActiveGroups(page: number = 1, limit: number = 20) {
		const offset = (page - 1) * limit;

		return await Group.findAndCountAll({
			where: { isActive: true },
			order: [
				["currentMembers", "DESC"],
				["createdAt", "DESC"],
			],
			limit,
			offset,
			include: [
				{
					model: GroupMember,
					as: "members",
					where: { isActive: true },
					required: false,
					include: [
						{
							model: User,
							as: "user",
							attributes: ["id", "login"],
						},
					],
				},
			],
		});
	}

	/**
	 * Clean up a specific empty group
	 */
	private async cleanupEmptyGroup(groupId: string): Promise<void> {
		try {
			const group = await Group.findByPk(groupId);
			if (!group || group.currentMembers > 0) {
				return; // Group doesn't exist or still has members
			}

			console.log(`🗑️ Cleaning up empty group: ${group.id} (${group.name})`);

			// Delete all messages from this group
			const deletedMessages = await Message.destroy({
				where: { groupId: group.id },
			});

			// Delete all remaining group members (should be none, but just in case)
			const deletedMembers = await GroupMember.destroy({
				where: { groupId: group.id },
			});

			// Delete the group itself
			await group.destroy();

			// Clear cache
			await this.redisService.clearGroupCache(group.id);

			console.log(
				`🗑️ Deleted empty group ${groupId}: ${deletedMessages} messages, ${deletedMembers} memberships`,
			);
		} catch (error) {
			console.error(`Error cleaning up empty group ${groupId}:`, error);
		}
	}

	/**
	 * Enhanced cleanup: Delete empty groups and their messages
	 */
	async cleanupEmptyGroups(): Promise<void> {
		try {
			// Find groups with 0 active members
			const emptyGroups = await Group.findAll({
				where: {
					currentMembers: 0,
					isActive: true,
				},
				include: [
					{
						model: GroupMember,
						as: "members",
						where: { isActive: true },
						required: false, // LEFT JOIN to find groups with no active members
					},
				],
			});

			for (const group of emptyGroups) {
				await this.cleanupEmptyGroup(group.id);
			}

			console.log(`✅ Cleaned up ${emptyGroups.length} empty groups`);
		} catch (error) {
			console.error("Error cleaning up empty groups:", error);
		}
	}

	/**
	 * Startup cleanup: Delete ALL groups and their related data
	 * WARNING: This will delete ALL groups, messages, and memberships!
	 */
	async deleteAllGroups(): Promise<void> {
		try {
			console.log("🧹 STARTUP CLEANUP: Deleting ALL groups...");

			// Get count before deletion for logging
			const totalGroups = await Group.count();
			const totalMessages = await Message.count();
			const totalMemberships = await GroupMember.count();

			console.log(
				`📊 Found ${totalGroups} groups, ${totalMessages} messages, ${totalMemberships} memberships`,
			);

			// Delete all messages first (due to foreign key constraints)
			await Message.destroy({ where: {}, truncate: true });
			console.log("🗑️ Deleted all messages");

			// Delete all group memberships
			await GroupMember.destroy({ where: {}, truncate: true });
			console.log("🗑️ Deleted all group memberships");

			// Delete all groups
			await Group.destroy({ where: {}, truncate: true });
			console.log("🗑️ Deleted all groups");

			// Clear all group-related cache
			await this.redisService.clearAllGroupCache();
			console.log("🗑️ Cleared all group cache");

			console.log(
				`✅ STARTUP CLEANUP COMPLETE: Deleted ${totalGroups} groups, ${totalMessages} messages, ${totalMemberships} memberships`,
			);
		} catch (error) {
			console.error("❌ Error during startup cleanup:", error);
			throw error;
		}
	}

	/**
	 * Auto-seal groups that are full
	 */
	async autoSealFullGroups(): Promise<void> {
		try {
			const fullGroups = await Group.findAll({
				where: {
					status: "active",
					currentMembers: Group.sequelize!.col("max_members"),
				},
			});

			for (const group of fullGroups) {
				await this.sealGroup(group.id);
				console.log(`🔒 Auto-sealed full group: ${group.id} (${group.name})`);
			}
		} catch (error) {
			console.error("Error auto-sealing full groups:", error);
		}
	}
}

export default GroupService;
