const { addUrlToQueue } = require('../../queue/queue');
const { redisConnection } = require('../../config/redis');
const submitUrlCheck = async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  await addUrlToQueue(url);
  return res.status(200).json({ message: 'URL check job queued.' });
};
const getUrlStatus = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL query param is required' });
  }
  const key = `url-check:history:${url}`;
  const latest = await redisConnection.lindex(key, 0); 
  if (!latest) {
    return res.status(404).json({ message: 'No result found for this URL' });
  }
  return res.json(JSON.parse(latest));
};

const getUrlHistory = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL query param is required' });
  }

  const key = `url-check:history:${url}`;

  const items = await redisConnection.lrange(key, 0, -1);

  if (!items.length) {
    return res.status(404).json({ message: 'No history found for this URL' });
  }

  const results = items.map(item => JSON.parse(item));
  return res.json({ url, count: results.length, history: results });
};

module.exports = { submitUrlCheck, getUrlStatus, getUrlHistory };
