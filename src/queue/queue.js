const { Queue } = require('bullmq');
const { redisConnection } = require('../config/redis');

const urlCheckQueue = new Queue('url-check-queue', { connection: redisConnection });

const addUrlToQueue = async (url) => {
  await urlCheckQueue.add('check-url', { url });
};

module.exports = { urlCheckQueue, addUrlToQueue };
