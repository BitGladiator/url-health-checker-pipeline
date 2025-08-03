// Import BullMQ Worker, Redis connection, Prometheus metric, HTTP client, and logger
const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const { httpDuration } = require('../metrics/prometheus');
const httpClient = require('../utils/httpClient');
const logger = require('../utils/logger');

// Function to create and start a BullMQ worker
const createWorker = () => {
  // Define the worker to process jobs from the 'url-check-queue'
  const worker = new Worker('url-check-queue', async job => {
    const { url } = job.data; // Extract URL from job data
    const key = `url-check:history:${url}`; // Redis key for storing URL check history

    try {
      const start = Date.now(); // Start timing the request
      const response = await httpClient.get(url); // Send HTTP GET request using wrapped Axios
      const duration = Date.now() - start; // Calculate duration

      // Build success result object
      const result = {
        url,
        status: response.status,
        duration,
        timestamp: new Date().toISOString(),
      };

      // Save result to Redis (push to list) and keep only last 10 entries
      await redisConnection.lpush(key, JSON.stringify(result));
      await redisConnection.ltrim(key, 0, 9);

      // Log success
      logger.info(`[${url}] Success: ${response.status} in ${duration}ms`);

      // Record duration in Prometheus (convert ms to seconds)
      httpDuration.labels(url, response.status).observe(duration / 1000);

    } catch (error) {
      // Extract status if available, or use fallback
      const status = error.response?.status || 'NO_RESPONSE';

      // Build error result object
      const result = {
        url,
        status,
        error: error.message,
        timestamp: new Date().toISOString(),
      };

      // Save error result to Redis and keep only last 10 entries
      await redisConnection.lpush(key, JSON.stringify(result));
      await redisConnection.ltrim(key, 0, 9);

      // Log error
      logger.error(`[${url}] Error: ${status} - ${error.message}`);

      // Record failed duration as 0 in Prometheus
      httpDuration.labels(url, status).observe(0);
    }
  }, {
    connection: redisConnection, // Redis connection for the worker
  });

  // Event listener for successful job completion
  worker.on('completed', job => {
    logger.info(`Job ${job.id} completed`);
  });

  // Event listener for job failure
  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed: ${err.message}`);
  });
};

// Export the function to be used in app entry point
module.exports = { createWorker };
