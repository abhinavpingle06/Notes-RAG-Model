require('dotenv').config({
    path: require('path').resolve(__dirname, '../.env')
});

const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true
});

async function inspectRedis() {
    try {
        // Total keys
        console.log("\n--- DATABASE SIZE ---");
        console.log(await redis.dbsize());

        // Memory information
        console.log("\n--- MEMORY ---");
        const memory = await redis.info('memory');
        console.log(memory);

        // Eviction and expiration statistics
        console.log("\n--- REDIS STATS ---");
        const stats = await redis.info('stats');
        console.log(stats);

        // Find application session keys
        console.log("\n--- SESSION KEYS ---");

        let cursor = '0';

        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH', 'user:*',
                'COUNT', 100
            );

            cursor = nextCursor;

            for (const key of keys) {
                console.log({
                    key,
                    data: await redis.hgetall(key),
                    ttl: await redis.ttl(key)
                });
            }
        } while (cursor !== '0');

    } catch (error) {
        console.error("Redis inspection failed:", error);
    } finally {
        await redis.quit();
    }
}

inspectRedis();
