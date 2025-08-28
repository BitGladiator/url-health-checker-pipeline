const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const { httpDuration } = require('../metrics/prometheus');
const { sendEmailAlert } = require('../config/email');
const { MonitoredUrl } = require('../models/monitoredUrl');
const httpClient = require('../utils/httpClient');
const logger = require('../utils/logger');

const createWorker = () => {
  const worker = new Worker('url-check-queue', async job => {
    const { url, monitoredUrlId } = job.data;
    const key = `url-check:history:${url}`;

    // Get monitored URL config if available
    let monitoredUrl = null;
    if (monitoredUrlId) {
      monitoredUrl = await MonitoredUrl.getById(monitoredUrlId);
    }

    try {
      const start = Date.now();
      const response = await httpClient.get(url);
      const duration = Date.now() - start;

      const result = {
        url,
        status: response.status,
        duration,
        timestamp: new Date().toISOString(),
      };

      // Save to Redis history
      await redisConnection.lpush(key, JSON.stringify(result));
      await redisConnection.ltrim(key, 0, 9);

      // Update monitored URL status
      if (monitoredUrl) {
        await monitoredUrl.updateFailureCount(false);
        
        // Send recovery email if this was previously down
        if (monitoredUrl.consecutiveFailures > 0) {
          await sendEmailAlert(url, 'RECOVERED', {
            httpStatus: response.status,
            responseTime: duration,
            wasDownFor: `${monitoredUrl.consecutiveFailures} consecutive checks`
          });
        }
      }

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

      // Save error to Redis
      await redisConnection.lpush(key, JSON.stringify(result));
      await redisConnection.ltrim(key, 0, 9);

      // Handle monitored URL failure
      if (monitoredUrl) {
        await monitoredUrl.updateFailureCount(true);
        
        // Send alert email for failures (avoid spam by limiting frequency)
        const shouldAlert = (
          monitoredUrl.consecutiveFailures === 1 || // First failure
          monitoredUrl.consecutiveFailures === 3 || // After 3 consecutive
          monitoredUrl.consecutiveFailures % 10 === 0 // Every 10 failures
        );

        if (shouldAlert) {
          await sendEmailAlert(url, 'DOWN', {
            error: error.message,
            httpStatus: status,
            consecutiveFailures: monitoredUrl.consecutiveFailures
          });
        }
      }

      logger.error(`[${url}] Error: ${status} - ${error.message}`);
      httpDuration.labels(url, status).observe(0);
    }
  }, {
    connection: redisConnection,
    concurrency: 5 // Process up to 5 jobs simultaneously
  });

  worker.on('completed', job => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed: ${err.message}`);
  });

  return worker;
};

module.exports = { createWorker };