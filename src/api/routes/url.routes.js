const express = require('express');
const router = express.Router();

const { submitUrlCheck, getUrlStatus, getUrlHistory } = require('../controllers/url.controller.js');

router.post('/check', submitUrlCheck);

router.get('/status', getUrlStatus);

router.get('/history', getUrlHistory);

module.exports = router;
