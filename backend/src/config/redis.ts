import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL,
});

const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log("Connecté à Redis");
    } catch (err) {
        console.error("Erreur de connexion Redis:", err);
    }
};

export { redisClient, connectRedis };
