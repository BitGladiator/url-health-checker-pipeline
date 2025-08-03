// Import function to add a URL to the job queue and the Redis connection
const { addUrlToQueue } = require('../../queue/queue');
const { redisConnection } = require('../../config/redis');

// Controller to handle URL submission for health check
const submitUrlCheck = async (req, res) => {
  const { url } = req.body;

  // Validate that URL is provided
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Add URL to the job queue for processing
  await addUrlToQueue(url);

  // Respond with success message
  return res.status(200).json({ message: 'URL check job queued.' });
};

// Controller to get the latest status of a specific URL
const getUrlStatus = async (req, res) => {
  const { url } = req.query;

  // Validate that URL query parameter is provided
  if (!url) {
    return res.status(400).json({ error: 'URL query param is required' });
  }

  // Construct Redis key for the URL history
  const key = `url-check:history:${url}`;

  // Get the latest status (most recent entry in the list)
  const latest = await redisConnection.lindex(key, 0); 

  // If no status found, respond with 404
  if (!latest) {
    return res.status(404).json({ message: 'No result found for this URL' });
  }

  // Parse and return the latest result
  return res.json(JSON.parse(latest));
};

// Controller to get the full history of checks for a specific URL
const getUrlHistory = async (req, res) => {
  const { url } = req.query;

  // Validate that URL query parameter is provided
  if (!url) {
    return res.status(400).json({ error: 'URL query param is required' });
  }

  // Construct Redis key for the URL history
  const key = `url-check:history:${url}`;

  // Get the entire history list from Redis
  const items = await redisConnection.lrange(key, 0, -1);

  // If no history found, respond with 404
  if (!items.length) {
    return res.status(404).json({ message: 'No history found for this URL' });
  }

  // Parse each item from JSON string to object
  const results = items.map(item => JSON.parse(item));

  // Return the full history
  return res.json({ url, count: results.length, history: results });
};

// Export all controller functions
module.exports = { submitUrlCheck, getUrlStatus, getUrlHistory };
