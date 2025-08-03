const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const { httpDuration } = require('../metrics/prometheus');
const httpClient = require('../utils/httpClient');
const logger = require('../utils/logger');
 
const createWorker = () => {
  const worker = new Worker('url-check-queue', async job => {
    const { url } = job.data;
    const key = `url-check:history:${url}`;

    try {
      const start = Date.now();
      const response = await httpClient.get(url); // uses wrapped Axios
      const duration = Date.now() - start;

      const result = {
        url,
        status: response.status,
        duration,
        timestamp: new Date().toISOString(),
      };

      await redisConnection.lpush(key, JSON.stringify(result));
      await redisConnection.ltrim(key, 0, 9); // Keep last 10 results only

      logger.info(`[${url}] Success: ${response.status} in ${duration}ms`);
      httpDuration.labels(url, response.status).observe(duration / 1000);
    } catch (error) {
      const status = error.response?.status || 'NO_RESPONSE';

      const result = {
        url,
        status,
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      await redisConnection.lpush(key, JSON.stringify(result));
      await redisConnection.ltrim(key, 0, 9);

      logger.error(`[${url}] Error: ${status} - ${error.message}`);
      httpDuration.labels(url, status).observe(0);
    }
  }, {
    connection: redisConnection,
  });

  worker.on('completed', job => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed: ${err.message}`);
  });
};

module.exports = { createWorker };
