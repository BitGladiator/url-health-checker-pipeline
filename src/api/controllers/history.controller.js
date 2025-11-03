const { redisConnection } = require('../../config/redis');

const getAllHistory = async (req, res) => {
  try {
    const { limit = 1000, url } = req.query;
    const activeIds = await redisConnection.smembers('monitored:active');
    const allHistory = [];
    for (const id of activeIds) {
      const urlData = await redisConnection.hgetall(`monitored:${id}`);
      if (urlData && urlData.url) {
        const historyKey = `url-check:history:${urlData.url}`;
        const items = await redisConnection.lrange(historyKey, 0, -1);
        
        items.forEach(item => {
          const parsed = JSON.parse(item);
          allHistory.push(parsed);
        });
      }
    }
    const allKeys = await redisConnection.keys('url-check:history:*');
    
    for (const key of allKeys) {
      const url = key.replace('url-check:history:', '');
      const alreadyProcessed = allHistory.some(h => h.url === url);
      if (!alreadyProcessed) {
        const items = await redisConnection.lrange(key, 0, -1);
        items.forEach(item => {
          const parsed = JSON.parse(item);
          allHistory.push(parsed);
        });
      }
    }
    allHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    let filteredHistory = allHistory;
    if (url) {
      filteredHistory = allHistory.filter(h => h.url.includes(url));
    }
    const limitedHistory = filteredHistory.slice(0, parseInt(limit));

    res.json({
      total: filteredHistory.length,
      returned: limitedHistory.length,
      history: limitedHistory
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
};

const getUrlStats = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const historyKey = `url-check:history:${url}`;
    const items = await redisConnection.lrange(historyKey, 0, -1);

    if (items.length === 0) {
      return res.status(404).json({ error: 'No history found for this URL' });
    }

    const history = items.map(item => JSON.parse(item));
    const successful = history.filter(h => h.status >= 200 && h.status < 400).length;
    const failed = history.length - successful;
    const uptimePercentage = (successful / history.length * 100).toFixed(2);
    
    const responseTimes = history
      .filter(h => h.duration)
      .map(h => h.duration);
    
    const avgResponse = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    
    const minResponse = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponse = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const errors = history
      .filter(h => h.error)
      .map(h => h.error);
    
    const errorCounts = {};
    errors.forEach(err => {
      errorCounts[err] = (errorCounts[err] || 0) + 1;
    });
    
    const mostCommonError = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({
      url,
      totalChecks: history.length,
      successful,
      failed,
      uptimePercentage: parseFloat(uptimePercentage),
      avgResponseTime: avgResponse,
      minResponseTime: minResponse,
      maxResponseTime: maxResponse,
      mostCommonError,
      lastCheck: history[0]
    });

  } catch (error) {
    console.error('Error fetching URL stats:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteHistory = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const historyKey = `url-check:history:${url}`;
    await redisConnection.del(historyKey);

    res.json({ message: 'History deleted successfully', url });

  } catch (error) {
    console.error('Error deleting history:', error);
    res.status(500).json({ error: error.message });
  }
};

const clearAllHistory = async (req, res) => {
  try {
    const allKeys = await redisConnection.keys('url-check:history:*');
    
    if (allKeys.length > 0) {
      await redisConnection.del(...allKeys);
    }

    res.json({ 
      message: 'All history cleared successfully', 
      deletedKeys: allKeys.length 
    });

  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllHistory,
  getUrlStats,
  deleteHistory,
  clearAllHistory
};