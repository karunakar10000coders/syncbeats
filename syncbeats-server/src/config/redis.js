const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

let redisClient;
let redisPub;
let redisSub;

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis reconnection limit reached. Operating in memory-fallback mode.');
        return null; // Stop reconnecting
      }
      return Math.min(times * 100, 2000);
    }
  });

  redisPub = new Redis(env.REDIS_URL);
  redisSub = new Redis(env.REDIS_URL);

  redisClient.on('connect', () => logger.info('Redis client connected.'));
  redisClient.on('error', (err) => logger.error('Redis error: %O', err));
} catch (err) {
  logger.error('Failed to initialize Redis. Operating in fallback mode: %O', err);
}

module.exports = {
  redisClient,
  redisPub,
  redisSub
};
