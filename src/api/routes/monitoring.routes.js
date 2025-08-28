const express = require('express');
const router = express.Router();
const {
  addMonitoredUrl,
  getMonitoredUrls,
  updateMonitoredUrl,
  removeMonitoredUrl
} = require('../controllers/monitoring.controller');

router.post('/', addMonitoredUrl);
router.get('/', getMonitoredUrls);
router.put('/:id', updateMonitoredUrl);
router.delete('/:id', removeMonitoredUrl);

module.exports = router;