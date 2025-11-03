const { Queue } = require('bullmq');
const { redisConnection } = require('../config/redis');

const urlCheckQueue = new Queue('url-check-queue', { connection: redisConnection });


const addUrlToQueue = async (url, additionalData = {}) => {
  await urlCheckQueue.add('check-url', { url, ...additionalData });
};


module.exports = { urlCheckQueue, addUrlToQueue };
