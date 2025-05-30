import { createClient } from "redis";

let redisClient: any = null;
let isRedisEnabled = false;

// Create Redis client only if explicitly enabled
const initializeRedis = () => {
    if (process.env.REDIS_ENABLED === 'true' || process.env.NODE_ENV === 'production') {
        redisClient = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    // Stop reconnecting after 3 attempts
                    if (retries > 3) {
                        console.warn('⚠️  Redis reconnection failed after 3 attempts, disabling Redis');
                        isRedisEnabled = false;
                        return false;
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        redisClient.on('error', (err: any) => {
            console.warn('⚠️  Redis connection failed, continuing without Redis');
            isRedisEnabled = false;
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
            isRedisEnabled = true;
        });
    } else {
        console.log('ℹ️  Redis disabled - set REDIS_ENABLED=true to enable');
    }
};

const connectRedis = async () => {
    if (!redisClient) {
        initializeRedis();
    }
    
    if (redisClient) {
        try {
            await redisClient.connect();
            isRedisEnabled = true;
        } catch (err) {
            console.warn('⚠️  Redis connection failed, continuing without Redis');
            isRedisEnabled = false;
        }
    }
};

// Export a safe Redis client that doesn't throw errors
const safeRedisClient = {
    isConnected: () => isRedisEnabled,
    get: async (key: string) => {
        if (!isRedisEnabled || !redisClient) return null;
        try {
            return await redisClient.get(key);
        } catch {
            return null;
        }
    },
    set: async (key: string, value: string, ttl?: number) => {
        if (!isRedisEnabled || !redisClient) return false;
        try {
            if (ttl) {
                await redisClient.setEx(key, ttl, value);
            } else {
                await redisClient.set(key, value);
            }
            return true;
        } catch {
            return false;
        }
    },
    del: async (key: string) => {
        if (!isRedisEnabled || !redisClient) return false;
        try {
            await redisClient.del(key);
            return true;
        } catch {
            return false;
        }
    }
};

export { redisClient, connectRedis, safeRedisClient };
