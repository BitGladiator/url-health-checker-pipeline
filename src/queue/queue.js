// Import BullMQ's Queue class and Redis connection
const { Queue } = require('bullmq');
const { redisConnection } = require('../config/redis');

// Create a BullMQ queue named 'url-check-queue'
const urlCheckQueue = new Queue('url-check-queue', { connection: redisConnection });

// Function to add a new URL check job to the queue
const addUrlToQueue = async (url) => {
  await urlCheckQueue.add('check-url', { url }); // Job name: 'check-url', payload: { url }
};

// Export the queue instance and the job-adding function
module.exports = { urlCheckQueue, addUrlToQueue };
