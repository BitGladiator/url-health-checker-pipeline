const Redis = require('ioredis');

let redisConnection;

if (process.env.REDIS_URL) {
  console.log(`🔗 Connecting via URL: ${process.env.REDIS_URL}`);
  redisConnection = new Redis(process.env.REDIS_URL);
} else {
  const host = process.env.REDIS_HOST || 'redis';
  const port = process.env.REDIS_PORT || 6379;
  console.log(`🔗 Connecting via host=${host}, port=${port}`);
  redisConnection = new Redis({ host, port });
}

redisConnection.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisConnection.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

module.exports = redisConnection;
