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
   * Find or create a random group for a user to join
   */
  async joinRandomGroup(userId: number, userPublicKey?: string): Promise<JoinGroupResult> {
    try {
      // Check if user is already in an active group
      const existingMembership = await GroupMember.findOne({
        where: {
          userId,
          isActive: true,
        },
        include: [{
          model: Group,
          as: 'group',
          where: { isActive: true }
        }]
      });

      if (existingMembership) {
        // Return the existing group
        const group = await this.getGroupWithMembers(existingMembership.groupId);
        return {
          success: true,
          group,
          message: 'Rejoined existing group'
        };
      }

      // Find available groups with space
      const availableGroups = await Group.findAll({
        where: {
          isActive: true,
          isPublic: true,
          currentMembers: {
            [Op.lt]: Group.sequelize!.col('maxMembers')
          }
        },
        order: [
          ['currentMembers', 'DESC'], // Prefer fuller groups first
          ['createdAt', 'ASC'] // Then older groups
        ],
        limit: 10
      });

      let targetGroup: Group | null = null;

      if (availableGroups.length > 0) {
        // Randomly select from available groups (weighted towards fuller groups)
        const weights = availableGroups.map((g, index) => Math.max(1, 11 - index));
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const random = Math.random() * totalWeight;
        
        let currentWeight = 0;
        for (let i = 0; i < availableGroups.length; i++) {
          currentWeight += weights[i];
          if (random <= currentWeight) {
            targetGroup = availableGroups[i];
            break;
          }
        }
      }

      // If no suitable group found, create a new one
      if (!targetGroup) {
        targetGroup = await this.createNewGroup();
      }

      // Add user to the group
      await this.addUserToGroup(targetGroup.id, userId, userPublicKey);
      
      // Update group member count
      await targetGroup.update({
        currentMembers: targetGroup.currentMembers + 1
      });

      // Get the complete group information
      const groupData = await this.getGroupWithMembers(targetGroup.id);

      // Cache the group info in Redis for fast lookups
      await this.redisService.cacheGroupInfo(targetGroup.id, groupData);

      return {
        success: true,
        group: groupData,
        message: 'Successfully joined group'
      };

    } catch (error) {
      console.error('Error joining random group:', error);
      return {
        success: false,
        message: 'Failed to join group'
      };
    }
  }

  /**
   * Leave a group
   */
  async leaveGroup(userId: number, groupId: string): Promise<boolean> {
    try {
      const membership = await GroupMember.findOne({
        where: {
          userId,
          groupId,
          isActive: true
        }
      });

      if (!membership) {
        return false;
      }

      // Mark membership as inactive
      await membership.update({ isActive: false });

      // Update group member count
      const group = await Group.findByPk(groupId);
      if (group) {
        const newCount = Math.max(0, group.currentMembers - 1);
        await group.update({ currentMembers: newCount });

        // If group is empty, mark it as inactive
        if (newCount === 0) {
          await group.update({ isActive: false });
        }
      }

      // Clear cache
      await this.redisService.clearGroupCache(groupId);

      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  }

  /**
   * Get group information with members
   */
  async getGroupWithMembers(groupId: string) {
    const group = await Group.findByPk(groupId, {
      include: [{
        model: GroupMember,
        as: 'members',
        where: { isActive: true },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'login']
        }]
      }]
    });

    if (!group) {
      throw new Error('Group not found');
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
        joinedAt: member.joinedAt
      }))
    };
  }

  /**
   * Create a new group
   */
  private async createNewGroup(): Promise<Group> {
    const groupNames = [
      'Random Chat #1', 'Coffee Break', 'Night Owls', 'Study Group',
      'Tech Talk', 'Casual Chat', 'Weekend Vibes', 'Quick Chat',
      'Anonymous Thoughts', 'Random Connections', 'Late Night Chat',
      'Morning Coffee', 'Lunch Break', 'After Hours', 'Brain Storming'
    ];

    const randomName = groupNames[Math.floor(Math.random() * groupNames.length)] + 
                      ' - ' + new Date().toLocaleTimeString();

    return await Group.create({
      name: randomName,
      maxMembers: Math.floor(Math.random() * 8) + 3, // 3-10 members
      isPublic: true,
      currentMembers: 0
    });
  }

  /**
   * Add a user to a group
   */
  private async addUserToGroup(groupId: string, userId: number, publicKey?: string): Promise<GroupMember> {
    return await GroupMember.create({
      groupId,
      userId,
      publicKey,
      joinedAt: new Date(),
      isActive: true
    });
  }

  /**
   * Store a message in the database
   */
  async storeMessage(
    groupId: string, 
    senderId: number, 
    encryptedContent: string,
    messageType: 'text' | 'system' | 'key_exchange' = 'text'
  ): Promise<Message> {
    return await Message.create({
      groupId,
      senderId,
      encryptedContent,
      messageType,
      timestamp: new Date()
    });
  }

  /**
   * Get recent messages for a group
   */
  async getGroupMessages(groupId: string, limit: number = 50): Promise<Message[]> {
    return await Message.findAll({
      where: { groupId },
      order: [['timestamp', 'DESC']],
      limit,
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'login']
      }]
    });
  }

  /**
   * Get group statistics
   */
  async getGroupStats(): Promise<GroupStats> {
    const [totalGroups, activeGroups, totalMembers] = await Promise.all([
      Group.count(),
      Group.count({ where: { isActive: true } }),
      GroupMember.count({ where: { isActive: true } })
    ]);

    const averageGroupSize = activeGroups > 0 ? totalMembers / activeGroups : 0;

    return {
      totalGroups,
      activeGroups,
      totalMembers,
      averageGroupSize: Math.round(averageGroupSize * 100) / 100
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
          updatedAt: { [Op.lt]: cutoffTime }
        }
      }
    );
  }

  /**
   * Get active groups for admin purposes
   */
  async getActiveGroups(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    
    return await Group.findAndCountAll({
      where: { isActive: true },
      order: [['currentMembers', 'DESC'], ['createdAt', 'DESC']],
      limit,
      offset,
      include: [{
        model: GroupMember,
        as: 'members',
        where: { isActive: true },
        required: false,
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'login']
        }]
      }]
    });
  }
}

export default GroupService; 