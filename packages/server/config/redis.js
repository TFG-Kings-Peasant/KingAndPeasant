import {createClient} from "redis";

export const redisClient = createClient({
    url: 'redis://redis:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error: ', err));

export async function connectRedis() {
    try {
        await redisClient.connect();
        console.log("Connected to Redis!");
    } catch (err) {
        console.error("Redis connection error: ", err);
    }
}

export default redisClient;