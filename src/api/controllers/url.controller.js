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

  const result = await redisConnection.get(`url-check:${url}`);

  if (!result) {
    return res.status(404).json({ message: 'No result found for this URL' });
  }

  return res.json(JSON.parse(result));
};


module.exports = { submitUrlCheck , getUrlStatus};
