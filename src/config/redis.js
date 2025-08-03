const { Redis } = require('ioredis');

const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'redis', // Use Docker service name here
  port: process.env.REDIS_PORT || 6379
});

module.exports = { redisConnection };
