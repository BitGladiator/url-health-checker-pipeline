const { redisConnection } = require("../config/redis");

class MonitoredUrl {
  constructor(data) {
    this.id = data.id || `url_${Date.now()}`;
    this.url = data.url;
    this.name = data.name || data.url;
    this.checkInterval = data.checkInterval || 5;
    this.isActive = data.isActive !== false;
    this.alertEmail = data.alertEmail;
    this.expectedStatus = data.expectedStatus || [200, 201, 202, 204];
    this.timeout = data.timeout || 5000;
    this.tags = data.tags || [];
    this.consecutiveFailures = data.consecutiveFailures || 0;
    this.lastCheck = data.lastCheck;
    this.lastStatus = data.lastStatus;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.responseTimeThreshold = data.responseTimeThreshold || null;
  }
  async save() {
    const key = `monitored:${this.id}`;
    await redisConnection.hset(key, {
      ...this,
      tags: JSON.stringify(this.tags),
      expectedStatus: JSON.stringify(this.expectedStatus),
    });
    if (this.isActive) {
      await redisConnection.sadd("monitored:active", this.id);
    } else {
      await redisConnection.srem("monitored:active", this.id);
    }
  }
  static async getById(id) {
    const key = `monitored:${id}`;
    const data = await redisConnection.hgetall(key);

    if (!data.id) return null;
    if (data.tags) data.tags = JSON.parse(data.tags);
    if (data.expectedStatus)
      data.expectedStatus = JSON.parse(data.expectedStatus);
    if (data.consecutiveFailures)
      data.consecutiveFailures = parseInt(data.consecutiveFailures);
    if (data.responseTimeThreshold)
      data.responseTimeThreshold = parseInt(data.responseTimeThreshold);

    return new MonitoredUrl(data);
  }
  static async getAllActive() {
    const activeIds = await redisConnection.smembers("monitored:active");
    const urls = [];

    for (const id of activeIds) {
      const url = await MonitoredUrl.getById(id);
      if (url) urls.push(url);
    }

    return urls;
  }
  async updateFailureCount(failed = false) {
    if (failed) {
      this.consecutiveFailures += 1;
    } else {
      this.consecutiveFailures = 0;
    }

    this.lastCheck = new Date().toISOString();
    await this.save();
  }
}

module.exports = { MonitoredUrl };
