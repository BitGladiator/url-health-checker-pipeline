// Import Express and create a router instance
const express = require('express');
const router = express.Router();

// Import controller functions for URL check operations
const { submitUrlCheck, getUrlStatus, getUrlHistory } = require('../controllers/url.controller.js');

// Route to submit a new URL check job
router.post('/check', submitUrlCheck);

// Route to get the latest status of a URL
router.get('/status', getUrlStatus);

// Route to get the full check history of a URL
router.get('/history', getUrlHistory);

// Export the router to be used in the main app
module.exports = router;
