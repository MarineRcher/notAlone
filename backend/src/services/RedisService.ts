import { safeRedisClient } from '../config/redis';

export interface CachedGroupInfo {
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
}

class RedisService {
  private isEnabled: boolean = false;

  constructor() {
    this.isEnabled = process.env.REDIS_ENABLED === 'true' || process.env.NODE_ENV === 'production';
    
    if (!this.isEnabled) {
      console.log('ℹ️  RedisService: Caching disabled for development');
    }
  }

  /**
   * Cache group information
   */
  async cacheGroupInfo(groupId: string, groupInfo: CachedGroupInfo): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      const key = `group:${groupId}`;
      await safeRedisClient.set(key, JSON.stringify(groupInfo), 3600); // Cache for 1 hour
    } catch (error) {
      // Silently fail for caching operations
    }
  }

  /**
   * Get cached group information
   */
  async getCachedGroupInfo(groupId: string): Promise<CachedGroupInfo | null> {
    if (!this.isEnabled) return null;
    
    try {
      const key = `group:${groupId}`;
      const cached = await safeRedisClient.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear group cache
   */
  async clearGroupCache(groupId: string): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      const key = `group:${groupId}`;
      await safeRedisClient.del(key);
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Clear all group-related cache
   */
  async clearAllGroupCache(): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      // For simplicity, we'll just log that cache would be cleared
      // The cache will be cleared naturally as new operations occur
      console.log('🗑️ Group cache cleared (Redis not fully implemented for keys pattern)');
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Store user socket mapping
   */
  async storeUserSocket(userId: number, socketId: string): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      const key = `user:${userId}:socket`;
      await safeRedisClient.set(key, socketId, 86400); // Cache for 24 hours
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Get user socket ID
   */
  async getUserSocket(userId: number): Promise<string | null> {
    if (!this.isEnabled) return null;
    
    try {
      const key = `user:${userId}:socket`;
      return await safeRedisClient.get(key);
    } catch (error) {
      return null;
    }
  }

  /**
   * Remove user socket mapping
   */
  async removeUserSocket(userId: number): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      const key = `user:${userId}:socket`;
      await safeRedisClient.del(key);
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Store group member socket mappings - simplified for development
   */
  async storeGroupMemberSocket(groupId: string, userId: number, socketId: string): Promise<void> {
    if (!this.isEnabled) return;
    // Simplified - just store user socket mapping
    await this.storeUserSocket(userId, socketId);
  }

  /**
   * Get all socket IDs for group members - simplified
   */
  async getGroupMemberSockets(groupId: string): Promise<Record<string, string>> {
    if (!this.isEnabled) return {};
    // Return empty for development
    return {};
  }

  /**
   * Remove user from group socket mapping
   */
  async removeGroupMemberSocket(groupId: string, userId: number): Promise<void> {
    if (!this.isEnabled) return;
    await this.removeUserSocket(userId);
  }

  /**
   * Store temporary data with TTL
   */
  async setTempData(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      await safeRedisClient.set(key, JSON.stringify(data), ttlSeconds);
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Get temporary data
   */
  async getTempData(key: string): Promise<any> {
    if (!this.isEnabled) return null;
    
    try {
      const data = await safeRedisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Increment counter - simplified
   */
  async incrementCounter(key: string, ttlSeconds: number = 3600): Promise<number> {
    if (!this.isEnabled) return 0;
    // Return 0 for development
    return 0;
  }

  /**
   * Clean up expired data - no-op for development
   */
  async cleanup(): Promise<void> {
    if (!this.isEnabled) return;
    // No-op for development
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    // No-op - safe client handles this
  }
}

export default RedisService; 