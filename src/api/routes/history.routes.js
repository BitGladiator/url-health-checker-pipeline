const express = require('express');
const router = express.Router();
const {
  getAllHistory,
  getUrlStats,
  deleteHistory,
  clearAllHistory
} = require('../controllers/history.controller');

router.get('/all', getAllHistory);

router.get('/stats', getUrlStats);

router.delete('/url', deleteHistory);

router.delete('/clear-all', clearAllHistory);

module.exports = router;