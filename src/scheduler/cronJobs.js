const cron = require('node-cron');
const { MonitoredUrl } = require('../models/monitoredUrl');
const { addUrlToQueue } = require('../queue/queue');
const logger = require('../utils/logger');

class CronScheduler {
  constructor() {
    this.jobs = new Map();
  }

  // Start monitoring all active URLs
  async startAllJobs() {
    logger.info('Starting cron scheduler for URL monitoring...');
    
    const activeUrls = await MonitoredUrl.getAllActive();
    
    for (const urlConfig of activeUrls) {
      this.scheduleUrlCheck(urlConfig);
    }

    logger.info(`Scheduled ${activeUrls.length} URLs for monitoring`);
  }

  // Schedule a single URL for monitoring
  scheduleUrlCheck(urlConfig) {
    const { id, url, checkInterval } = urlConfig;
    
    // Stop existing job if running
    this.stopJob(id);
    
    // Create cron expression (every N minutes)
    const cronExpression = `*/${checkInterval} * * * *`;
    
    logger.info(`Scheduling ${url} to check every ${checkInterval} minutes`);
    
    const job = cron.schedule(cronExpression, async () => {
      try {
        logger.info(`Cron triggered check for: ${url}`);
        await addUrlToQueue(url, { monitoredUrlId: id });
      } catch (error) {
        logger.error(`Failed to queue URL check: ${error.message}`);
      }
    }, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'UTC'
    });
    
    this.jobs.set(id, job);
  }

  // Stop a specific job
  stopJob(id) {
    const existingJob = this.jobs.get(id);
    if (existingJob) {
      existingJob.stop();
      this.jobs.delete(id);
      logger.info(`⏹️ Stopped monitoring job for URL ID: ${id}`);
    }
  }

  // Reschedule a URL (useful when interval changes)
  async rescheduleUrl(id) {
    const urlConfig = await MonitoredUrl.getById(id);
    if (urlConfig && urlConfig.isActive) {
      this.scheduleUrlCheck(urlConfig);
    }
  }

  // Stop all jobs
  stopAllJobs() {
    for (const [id, job] of this.jobs) {
      job.stop();
    }
    this.jobs.clear();
    logger.info('All monitoring jobs stopped');
  }

  // Get status of all jobs
  getJobsStatus() {
    const status = [];
    for (const [id, job] of this.jobs) {
      status.push({
        id,
        running: job.running || false,
        scheduled: true
      });
    }
    return status;
  }
}

// Create singleton instance
const cronScheduler = new CronScheduler();

module.exports = { cronScheduler, CronScheduler };