const { Worker } = require('bullmq');
const axios = require('axios');
const { redisConnection } = require('../config/redis');

const createWorker = () => {
  const worker = new Worker('url-check-queue', async job => {
    const { url } = job.data;
    const resultKey = `url-check:${url}`;

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

      await redisConnection.set(resultKey, JSON.stringify(result));
      console.log(`[${url}] Saved result to Redis`);

    } catch (error) {
      const status = error.response?.status || 'NO_RESPONSE';

      const result = {
        url,
        status,
        error: error.message,
        timestamp: new Date().toISOString()
      };

      await redisConnection.set(resultKey, JSON.stringify(result));
      console.log(`[${url}] Error saved to Redis`);
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
