import Redis from 'ioredis';

let redisClient;

if (process.env.REDIS_HOST && process.env.REDIS_PASSWORD) {
    redisClient = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
            if (times > 3) return null; // stop retrying after 3 attempts
            return Math.min(times * 200, 2000);
        }
    });

    redisClient.on('connect', () => {
        console.log('Redis connected');
    });

    redisClient.on('error', (err) => {
        console.error('Redis error:', err.message);
    });
} else {
    console.warn('⚠️ Redis env vars not set — using in-memory fallback (token blacklist disabled)');
    // Minimal fallback so app doesn't crash without Redis
    redisClient = {
        get: async () => null,
        set: async () => null,
        setex: async () => null,
    };
}

export default redisClient;