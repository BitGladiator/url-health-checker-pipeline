// src/queue/worker.js
const { Worker } = require('bullmq');
const axios = require('axios');
const { redisConnection } = require('../config/redis');

const createWorker = () => {
  const worker = new Worker('url-check-queue', async job => {
    const { url } = job.data;
    const key = `url-check:history:${url}`;

    try {
      const start = Date.now();
      const response = await axios.get(url, { timeout: 5000 });
      const duration = Date.now() - start;

      const result = {
        url,
        status: response.status,
        duration,
        timestamp: new Date().toISOString()
      };

      await redisConnection.lpush(key, JSON.stringify(result));
      await redisConnection.ltrim(key, 0, 9); // Keep only last 10 entries

      console.log(`[${url}] Logged to history`);

    } catch (error) {
      const status = error.response?.status || 'NO_RESPONSE';
      const result = {
        url,
        status,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      await redisConnection.lpush(key, JSON.stringify(result));
      await redisConnection.ltrim(key, 0, 9);

      console.log(`[${url}] Error logged to history`);
    }
  }, {
    connection: redisConnection
  });

  worker.on('completed', job => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed: ${err.message}`);
  });
};

module.exports = { createWorker };
