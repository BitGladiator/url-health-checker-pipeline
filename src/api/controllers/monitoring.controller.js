const { MonitoredUrl } = require('../../models/monitoredUrl');
const { cronScheduler } = require('../../scheduler/cronJobs');
const redisConnection = require('../../config/redis');
// Add a URL to monitoring
const addMonitoredUrl = async (req, res) => {
  try {
    const {
      url,
      name,
      checkInterval = 5,
      alertEmail,
      expectedStatus = [200, 201, 202, 204],
      tags = []
    } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const monitoredUrl = new MonitoredUrl({
      url,
      name,
      checkInterval,
      alertEmail,
      expectedStatus,
      tags
    });

    await monitoredUrl.save();
    
    // Schedule the monitoring job
    cronScheduler.scheduleUrlCheck(monitoredUrl);

    res.status(201).json({
      message: 'URL added to monitoring',
      id: monitoredUrl.id,
      url: monitoredUrl.url,
      checkInterval: monitoredUrl.checkInterval
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all monitored URLs
const getMonitoredUrls = async (req, res) => {
  try {
    const urls = await MonitoredUrl.getAllActive();
    res.json(urls);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update monitoring settings
const updateMonitoredUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const monitoredUrl = await MonitoredUrl.getById(id);
    if (!monitoredUrl) {
      return res.status(404).json({ error: 'Monitored URL not found' });
    }

    // Apply updates
    Object.assign(monitoredUrl, updates);
    await monitoredUrl.save();

    // Reschedule if interval changed or reactivated
    if (updates.checkInterval || updates.isActive) {
      await cronScheduler.rescheduleUrl(id);
    }

    res.json({ message: 'Monitoring settings updated', url: monitoredUrl });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove URL from monitoring
const removeMonitoredUrl = async (req, res) => {
  try {
    const { id } = req.params;
    
    cronScheduler.stopJob(id);
    
    // Remove from Redis (you might want to implement MonitoredUrl.delete())
    await redisConnection.del(`monitored:${id}`);
    await redisConnection.srem('monitored:active', id);

    res.json({ message: 'URL removed from monitoring' });

  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error(error);
  }
};

module.exports = {
  addMonitoredUrl,
  getMonitoredUrls,
  updateMonitoredUrl,
  removeMonitoredUrl
};